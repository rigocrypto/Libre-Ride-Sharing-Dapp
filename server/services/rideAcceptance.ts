/**
 * Ride Acceptance Service
 *
 * Core marketplace logic: atomic driver acceptance with FOR UPDATE lock.
 * This is the critical path that ensures exactly one driver can accept a ride.
 *
 * CRITICAL INVARIANTS:
 * - A ride can be accepted exactly once
 * - Only one driver can win the acceptance
 * - State transitions are atomic
 * - Database is the single source of truth
 */

async function getDbModules() {
  const [{ db }, schema, drizzle] = await Promise.all([
    import("../db/client"),
    import("@shared/schema"),
    import("drizzle-orm"),
  ]);

  return {
    db,
    rides: schema.rides,
    users: schema.users,
    driverStatus: schema.driverStatus,
    eq: drizzle.eq,
    sql: drizzle.sql,
  };
}

export interface AcceptanceResult {
  rideId: string;
  driverId: string;
  status: "ACCEPTED";
  acceptedAt: Date;
}

export class RideAlreadyAcceptedError extends Error {
  constructor(rideId: string) {
    super(`Ride ${rideId} is no longer available`);
    this.name = "RideAlreadyAcceptedError";
  }
}

export class RideNotFoundError extends Error {
  constructor(rideId: string) {
    super(`Ride ${rideId} not found`);
    this.name = "RideNotFoundError";
  }
}

export class DriverNotEligibleError extends Error {
  constructor(message = "Driver is not eligible to accept rides") {
    super(message);
    this.name = "DriverNotEligibleError";
  }
}

function isApprovedDriver(user: any, driver: any): boolean {
  return user?.role === "driver" && (user?.driverStatus === "approved" || driver?.driverStatus === "approved");
}

/**
 * Atomic ride acceptance transaction
 *
 * This is the **critical path** for the marketplace.
 * Uses PostgreSQL FOR UPDATE to ensure exactly one driver can accept.
 *
 * Flow:
 * 1. Lock the ride row (blocks other drivers)
 * 2. Check ride is in OFFERED state
 * 3. Assign driver + transition to ACCEPTED
 * 4. Return result (used by WS + REST)
 *
 * @param rideId - UUID of ride to accept
 * @param driverId - UUID of driver accepting
 * @returns AcceptanceResult with confirmed acceptance
 * @throws RideNotFoundError if ride doesn't exist
 * @throws RideAlreadyAcceptedError if ride was already accepted by another driver
 */
/**
 * Atomic ride acceptance transaction
 *
 * This is the **critical path** for the marketplace.
 * Uses PostgreSQL FOR UPDATE to ensure exactly one driver can accept.
 *
 * Flow:
 * 1. Lock the ride row (blocks other drivers)
 * 2. Check ride is in OFFERED state
 * 3. Assign driver + transition to ACCEPTED
 * 4. Return result (used by WS + REST)
 *
 * @param rideId - UUID of ride to accept
 * @param driverId - UUID of driver accepting
 * @returns AcceptanceResult with confirmed acceptance
 * @throws RideNotFoundError if ride doesn't exist
 * @throws RideAlreadyAcceptedError if ride was already accepted by another driver
 */
export async function acceptRideAtomic(
  rideId: string,
  driverId: string
): Promise<AcceptanceResult> {
  // If running against in-memory storage (tests/dev), emulate the FOR UPDATE
  // behavior with an in-process lock to keep the semantics deterministic.
  if (process.env.STORAGE_ENGINE === 'mem') {
    const { storage } = await import('../storage-factory');

    // Per-ride simple mutex stored on global to persist across module reloads in test env
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    global.__rideLocks = global.__rideLocks || new Map<string, boolean>();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const locks: Map<string, boolean> = global.__rideLocks;

    // Acquire lock (spin-wait with small backoff)
    while (locks.get(rideId)) {
      await new Promise((r) => setTimeout(r, 5));
    }
    locks.set(rideId, true);

    try {
      const driverUser = await storage.getUser(driverId);
      const driver = await storage.getDriver(driverId);
      if (!driverUser?.walletAddress || !driverUser.walletVerifiedAt || !isApprovedDriver(driverUser, driver)) {
        throw new DriverNotEligibleError();
      }

      const ride = await storage.getRide(rideId);
      if (!ride) throw new RideNotFoundError(rideId);
      if (ride.status !== 'OFFERED') throw new RideAlreadyAcceptedError(rideId);

      const now = new Date();
      const updated = await storage.updateRide(rideId, {
        status: 'ACCEPTED',
        driverId,
        acceptedAt: now,
      });

      if (!updated) throw new Error(`Failed to update ride ${rideId}`);

      return {
        rideId: updated.id,
        driverId: updated.driverId!,
        status: 'ACCEPTED',
        acceptedAt: updated.acceptedAt!,
      };
    } finally {
      locks.delete(rideId);
    }
  }

  // Default: use the database transaction with FOR UPDATE (Postgres)
  const { db, rides, users, eq, sql } = await getDbModules();

  return await db.transaction(async (tx) => {
    const [driverUser] = await tx
      .select()
      .from(users)
      .where(eq(users.id, driverId))
      .limit(1);

    if (!driverUser?.walletAddress || !(driverUser as any).walletVerifiedAt || !isApprovedDriver(driverUser, null)) {
      throw new DriverNotEligibleError();
    }

    /**
     * STEP 1: Lock the ride row
     *
     * FOR UPDATE ensures:
     * - Only one driver's transaction can proceed
     * - Others wait until this one commits/aborts
     * - No race conditions possible
     */
    const rideRows = await tx.execute(sql`
      SELECT * FROM ${rides}
      WHERE id = ${rideId}
      FOR UPDATE
    `);

    const rideRow = rideRows.rows?.[0] || null;

    if (!rideRow) {
      throw new RideNotFoundError(rideId);
    }

    /**
     * STEP 2: Validate ride is still available
     *
     * If another driver accepted it (impossible with FOR UPDATE, but defensive):
     * OFFERED -> ACCEPTED transition should be the only valid path here
     */
    if (rideRow.status !== "OFFERED") {
      throw new RideAlreadyAcceptedError(rideId);
    }

    /**
     * STEP 3: Atomic state transition
     *
     * Update exactly one row, setting:
     * - driverId (immutable once set)
     * - status = ACCEPTED
     * - acceptedAt = now
     *
     * This happens inside the transaction, so it's atomic with the lock.
     */
    const now = new Date();
    const updatedRides = await tx
      .update(rides)
      .set({
        status: "ACCEPTED",
        driverId: driverId,
        acceptedAt: now,
      })
      .where(eq(rides.id, rideId))
      .returning();

    const updatedRide = updatedRides[0];

    if (!updatedRide) {
      throw new Error(`Failed to update ride ${rideId}`);
    }

    /**
     * STEP 4: Return canonical result
     *
     * This result is used by:
     * - REST endpoint: return to client
     * - WS layer: broadcast to rider + driver
     * - Metrics: log acceptance event
     */
    return {
      rideId: updatedRide.id,
      driverId: updatedRide.driverId!,
      status: "ACCEPTED" as const,
      acceptedAt: updatedRide.acceptedAt!,
    };
  });
}

/**
 * Get driver's current online status
 *
 * @param driverId - UUID of driver
 * @returns Online status with location, or null if no status record
 */
export async function getDriverStatus(driverId: string) {
  const { db, driverStatus, eq } = await getDbModules();

  const [status] = await db
    .select()
    .from(driverStatus)
    .where(eq(driverStatus.driverId, driverId));

  return status || null;
}

/**
 * Update driver online status (upsert pattern)
 *
 * Called via REST endpoint:
 * - Driver goes online: POST /api/driver/status { isOnline: true, lat, lng }
 * - Driver goes offline: POST /api/driver/status { isOnline: false }
 *
 * @param driverId - UUID of driver
 * @param isOnline - Whether driver is online
 * @param lat - Optional latitude (required if isOnline)
 * @param lng - Optional longitude (required if isOnline)
 */
export async function updateDriverStatus(
  driverId: string,
  isOnline: boolean,
  lat?: number,
  lng?: number
) {
  const { db, driverStatus } = await getDbModules();
  const now = new Date();

  // Upsert pattern: try insert, fallback to update
  try {
    const [inserted] = await db
      .insert(driverStatus)
      .values({
        driverId,
        isOnline,
        lat,
        lng,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: driverStatus.driverId,
        set: {
          isOnline,
          lat,
          lng,
          updatedAt: now,
        },
      })
      .returning();

    return inserted;
  } catch (err) {
    console.error(`[RideAcceptance] Failed to update driver status for ${driverId}:`, err);
    throw err;
  }
}

/**
 * Get all online drivers in area (for broadcast)
 *
 * Simple radius query (V1 — no advanced geospatial indexing yet)
 * Used by ride offer broadcast to find eligible drivers
 *
 * @param lat - Pickup latitude
 * @param lng - Pickup longitude
 * @param radiusMiles - Search radius (default 5 miles)
 * @returns List of online drivers with location
 */
export async function getOnlineDriversNearby(
  lat: number,
  lng: number,
  radiusMiles: number = 5
) {
  const { db, driverStatus, sql } = await getDbModules();

  // Rough SQL: distance in miles (1 degree ≈ 69 miles)
  const radiusDegrees = radiusMiles / 69;

  const drivers = await db
    .select()
    .from(driverStatus)
    .where(
      sql`
        ${driverStatus.isOnline} = true
        AND ${driverStatus.lat} IS NOT NULL
        AND ${driverStatus.lng} IS NOT NULL
        AND ABS(${driverStatus.lat} - ${lat}) < ${radiusDegrees}
        AND ABS(${driverStatus.lng} - ${lng}) < ${radiusDegrees}
      `
    );

  return drivers;
}
