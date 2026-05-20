/**
 * DrizzleStorage
 * 
 * Production-ready storage implementation using Drizzle ORM and PostgreSQL.
 * Implements the full IStorage interface, replacing MemStorage.
 * 
 * Uses firebaseUid as the primary auth identifier.
 */

import { db } from "../db/client";
import { users, walletLinkNonces, driverDocuments, rides } from "../db/schema";
import { eq, and, or, desc } from "drizzle-orm";
import type { IStorage } from "../storage";
import { isDispatchEligible } from "../services/driverCompliance";
import type {
  User,
  InsertUser,
  Driver,
  InsertDriver,
  Ride,
  InsertRide,
  Badge,
  InsertBadge,
  Waitlist,
  InsertWaitlist,
  SOSAlert,
  InsertSOSAlert,
  Dispute,
  InsertDispute,
  Referral,
  InsertReferral,
  RideWithDetails,
  DriverProfile,
} from "@shared/schema";

export class DrizzleStorage implements IStorage {
  /* ========== USERS ========== */

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user as User | undefined;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, firebaseUid))
      .limit(1);
    return user as User | undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!username) return undefined;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return user as User | undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user as User | undefined;
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    if (!walletAddress) return undefined;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, walletAddress))
      .limit(1);
    return user as User | undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values({
          firebaseUid: (insertUser as any).firebaseUid || null,
          email: insertUser.email || null,
          username: insertUser.username || null,
          role: insertUser.role || "rider",
          walletAddress: insertUser.walletAddress || null,
          walletVerifiedAt: (insertUser as any).walletVerifiedAt || null,
          identityVerified: (insertUser as any).identityVerified || false,
          identityVerifiedAt: (insertUser as any).identityVerifiedAt || null,
          authProvider: (insertUser as any).authProvider || null,
          driverStatus: (insertUser as any).driverStatus || "unverified",
          phoneNumber: insertUser.phoneNumber || null,
          profileImage: insertUser.profileImage || null,
        } as any)
        .returning();

      return user as User;
    } catch (err: any) {
      // Handle unique constraint races gracefully: if another process
      // inserted the same firebaseUid concurrently, return the existing
      // user instead of failing the whole flow.
      const msg = (err && err.message) ? err.message.toLowerCase() : '';
      if (msg.includes('duplicate key') || msg.includes('unique constraint')) {
        const firebaseUid = (insertUser as any).firebaseUid;
        if (firebaseUid) {
          // Another process likely inserted the same user concurrently. Try
          // a few times to read it back before giving up.
          for (let i = 0; i < 5; i++) {
            const existing = await this.getUserByFirebaseUid(firebaseUid);
            if (existing) {
              console.log(`[DrizzleStorage] Returning existing user for firebaseUid=${firebaseUid} after duplicate-key error`);
              return existing;
            }
            await new Promise((r) => setTimeout(r, 100 * (i + 1)));
          }
        }
        // If firebaseUid lookup didn't find anything, try to resolve by walletAddress or email
        const walletAddress = (insertUser as any).walletAddress;
        if (walletAddress) {
          const existingByWallet = await this.getUserByWallet(walletAddress);
          if (existingByWallet) {
            console.log(`[DrizzleStorage] Returning existing user for walletAddress=${walletAddress} after duplicate-key error`);
            return existingByWallet;
          }
        }

        const email = (insertUser as any).email;
        if (email) {
          const existingByEmail = await this.getUserByEmail(email);
          if (existingByEmail) {
            console.log(`[DrizzleStorage] Returning existing user for email=${email} after duplicate-key error`);
            return existingByEmail;
          }
        }
      }
      throw err;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set(updates as any)
      .where(eq(users.id, id))
      .returning();
    return updated as User | undefined;
  }

  /* ========== DRIVERS ========== */

  async getDriver(userId: string): Promise<Driver | undefined> {
    // Note: Driver data is stored in users table (driverStatus) and driverDocuments
    // For compatibility, we return a Driver-like object
    const user = await this.getUser(userId);
    if (!user) return undefined;

    // Check if user has driver documents
    const [doc] = await db
      .select()
      .from(driverDocuments)
      .where(eq(driverDocuments.userId, userId))
      .limit(1);

    return {
      id: userId,
      userId,
      driverStatus: (user as any).driverStatus || "unverified",
      driverApprovedAt: null,
      driverRejectedAt: null,
      rejectionReason: null,
      isOnline: false,
      currentLocation: null,
      vehicleType: null,
      vehicleMake: null,
      vehicleModel: null,
      vehicleYear: null,
      vehicleColor: null,
      licensePlate: null,
      licenseNumber: doc?.licenseUrl || null,
      insuranceDoc: doc?.insuranceUrl || null,
      licenseStatus: (doc as any)?.licenseStatus || "pending",
      insuranceStatus: (doc as any)?.insuranceStatus || "pending",
      vehicleInspectionStatus: (doc as any)?.vehicleInspectionStatus || "pending",
      backgroundCheckStatus: (doc as any)?.backgroundCheckStatus || "pending",
      orlandoPermitStatus: (doc as any)?.orlandoPermitStatus || "pending",
      airportEligibilityStatus: (doc as any)?.airportEligibilityStatus || "pending",
      licenseExpiresAt: (doc as any)?.licenseExpiresAt || null,
      insuranceExpiresAt: (doc as any)?.insuranceExpiresAt || null,
      inspectionExpiresAt: (doc as any)?.inspectionExpiresAt || null,
      permitExpiresAt: (doc as any)?.permitExpiresAt || null,
      orlandoPermitNumber: (doc as any)?.orlandoPermitNumber || null,
      orlandoPermitExpiresAt: (doc as any)?.orlandoPermitExpiresAt || null,
      mcoAirportEligible: (doc as any)?.mcoAirportEligible || false,
      mcoEligibilityGrantedAt: (doc as any)?.mcoEligibilityGrantedAt || null,
      backgroundCheckProvider: (doc as any)?.backgroundCheckProvider || null,
      backgroundCheckCompletedAt: (doc as any)?.backgroundCheckCompletedAt || null,
      lastReviewedAt: (doc as any)?.lastReviewedAt || doc?.reviewedAt || null,
      reviewedBy: (doc as any)?.reviewedBy || null,
      nextReviewDueAt: (doc as any)?.nextReviewDueAt || null,
      vehicleRegistration: null,
      isVerified: (user as any).driverStatus === "approved",
      isAirportLicensed: false,
      reputationScore: 5.0,
      totalRides: 0,
      totalEarnings: 0,
      acceptanceRate: 100,
      onTimeRate: 100,
      weeklyEarnings: 0,
    } as Driver;
  }

  async getDriverProfile(userId: string): Promise<DriverProfile | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const driver = await this.getDriver(userId);
    if (!driver) return undefined;

    const badges = await this.getBadgesByUser(userId);

    return {
      ...user,
      driverDetails: driver,
      badges,
    };
  }

  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    // Update user's driver status
    await this.updateUser(insertDriver.userId, {
      role: "driver",
      driverStatus: (insertDriver as any).driverStatus || "pending",
    } as any);

    // Create driver documents entry if license/insurance provided
    if ((insertDriver as any).licenseNumber || (insertDriver as any).insuranceDoc) {
      await db.insert(driverDocuments).values({
        userId: insertDriver.userId,
        licenseUrl: (insertDriver as any).licenseNumber || null,
        insuranceUrl: (insertDriver as any).insuranceDoc || null,
        status: "pending",
      });
    }

    const driver = await this.getDriver(insertDriver.userId);
    if (!driver) throw new Error("Failed to create driver");
    return driver;
  }

  async updateDriver(userId: string, updates: Partial<Driver>): Promise<Driver | undefined> {
    // Update user's driver status if provided
    if ((updates as any).driverStatus) {
      await this.updateUser(userId, {
        driverStatus: (updates as any).driverStatus,
      } as any);
    }

    // Update driver documents if provided
    const documentFields = [
      "licenseNumber",
      "insuranceDoc",
      "licenseStatus",
      "insuranceStatus",
      "vehicleInspectionStatus",
      "backgroundCheckStatus",
      "orlandoPermitStatus",
      "airportEligibilityStatus",
      "licenseExpiresAt",
      "insuranceExpiresAt",
      "inspectionExpiresAt",
      "permitExpiresAt",
      "orlandoPermitNumber",
      "orlandoPermitExpiresAt",
      "mcoAirportEligible",
      "mcoEligibilityGrantedAt",
      "backgroundCheckProvider",
      "backgroundCheckCompletedAt",
      "lastReviewedAt",
      "reviewedBy",
      "nextReviewDueAt",
      "rejectionReason",
    ];
    if (documentFields.some((field) => Object.prototype.hasOwnProperty.call(updates as any, field))) {
      const [existing] = await db
        .select()
        .from(driverDocuments)
        .where(eq(driverDocuments.userId, userId))
        .limit(1);

      if (existing) {
        await db
          .update(driverDocuments)
          .set({
            licenseUrl: (updates as any).licenseNumber || existing.licenseUrl,
            insuranceUrl: (updates as any).insuranceDoc || existing.insuranceUrl,
            licenseStatus: (updates as any).licenseStatus ?? (existing as any).licenseStatus,
            insuranceStatus: (updates as any).insuranceStatus ?? (existing as any).insuranceStatus,
            vehicleInspectionStatus:
              (updates as any).vehicleInspectionStatus ?? (existing as any).vehicleInspectionStatus,
            backgroundCheckStatus:
              (updates as any).backgroundCheckStatus ?? (existing as any).backgroundCheckStatus,
            orlandoPermitStatus:
              (updates as any).orlandoPermitStatus ?? (existing as any).orlandoPermitStatus,
            airportEligibilityStatus:
              (updates as any).airportEligibilityStatus ?? (existing as any).airportEligibilityStatus,
            licenseExpiresAt: (updates as any).licenseExpiresAt ?? (existing as any).licenseExpiresAt,
            insuranceExpiresAt: (updates as any).insuranceExpiresAt ?? (existing as any).insuranceExpiresAt,
            inspectionExpiresAt: (updates as any).inspectionExpiresAt ?? (existing as any).inspectionExpiresAt,
            permitExpiresAt: (updates as any).permitExpiresAt ?? (existing as any).permitExpiresAt,
            orlandoPermitNumber:
              (updates as any).orlandoPermitNumber ?? (existing as any).orlandoPermitNumber,
            orlandoPermitExpiresAt:
              (updates as any).orlandoPermitExpiresAt ?? (existing as any).orlandoPermitExpiresAt,
            mcoAirportEligible:
              (updates as any).mcoAirportEligible ?? (existing as any).mcoAirportEligible,
            mcoEligibilityGrantedAt:
              (updates as any).mcoEligibilityGrantedAt ?? (existing as any).mcoEligibilityGrantedAt,
            backgroundCheckProvider:
              (updates as any).backgroundCheckProvider ?? (existing as any).backgroundCheckProvider,
            backgroundCheckCompletedAt:
              (updates as any).backgroundCheckCompletedAt ?? (existing as any).backgroundCheckCompletedAt,
            lastReviewedAt: (updates as any).lastReviewedAt ?? (existing as any).lastReviewedAt,
            reviewedBy: (updates as any).reviewedBy ?? (existing as any).reviewedBy,
            nextReviewDueAt: (updates as any).nextReviewDueAt ?? (existing as any).nextReviewDueAt,
            rejectionReason: (updates as any).rejectionReason ?? existing.rejectionReason,
          } as any)
          .where(eq(driverDocuments.userId, userId));
      } else {
        await db.insert(driverDocuments).values({
          userId,
          licenseUrl: (updates as any).licenseNumber || null,
          insuranceUrl: (updates as any).insuranceDoc || null,
          status: "pending",
          licenseStatus: (updates as any).licenseStatus || "pending",
          insuranceStatus: (updates as any).insuranceStatus || "pending",
          vehicleInspectionStatus: (updates as any).vehicleInspectionStatus || "pending",
          backgroundCheckStatus: (updates as any).backgroundCheckStatus || "pending",
          orlandoPermitStatus: (updates as any).orlandoPermitStatus || "pending",
          airportEligibilityStatus: (updates as any).airportEligibilityStatus || "pending",
          rejectionReason: (updates as any).rejectionReason || null,
        } as any);
      }
    }

    return this.getDriver(userId);
  }

  async listDrivers(): Promise<DriverProfile[]> {
    const driverUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, "driver"));

    const profiles: DriverProfile[] = [];
    for (const user of driverUsers) {
      const profile = await this.getDriverProfile(user.id);
      if (profile) profiles.push(profile);
    }
    return profiles;
  }

  async getOnlineDrivers(): Promise<DriverProfile[]> {
    // Note: isOnline is not in users table yet - would need migration
    // For now, return all approved drivers
    const onlineUsers = await db
      .select()
      .from(users)
      .where(eq(users.driverStatus, "approved"));

    const profiles: DriverProfile[] = [];
    for (const user of onlineUsers) {
      const profile = await this.getDriverProfile(user.id);
      if (
        profile &&
        isDispatchEligible(profile as any, (profile as any).driverDetails)
      ) {
        profiles.push(profile);
      }
    }
    return profiles;
  }

  /* ========== RIDES ========== */

  async getRide(id: string): Promise<RideWithDetails | undefined> {
    const [ride] = await db.select().from(rides).where(eq(rides.id, id)).limit(1);
    if (!ride) return undefined;

    const rider = await this.getUser(ride.riderId);
    const driver = ride.driverId ? await this.getUser(ride.driverId) : undefined;
    const driverDetails = driver ? await this.getDriver(driver.id) : undefined;

    return {
      ...(ride as any),
      rider,
      driver: driver ? { ...driver, driverDetails } : undefined,
    } as RideWithDetails;
  }

  async getRidesByUser(userId: string, role: "rider" | "driver"): Promise<RideWithDetails[]> {
    const userRides = await db
      .select()
      .from(rides)
      .where(
        role === "rider"
          ? eq(rides.riderId, userId)
          : eq(rides.driverId, userId)
      )
      .orderBy(desc(rides.createdAt));

    const ridesWithDetails: RideWithDetails[] = [];
    for (const ride of userRides) {
      const details = await this.getRide(ride.id);
      if (details) ridesWithDetails.push(details);
    }
    return ridesWithDetails;
  }

  async getAllRides(): Promise<RideWithDetails[]> {
    const allRides = await db.select().from(rides).orderBy(desc(rides.createdAt));

    const ridesWithDetails: RideWithDetails[] = [];
    for (const ride of allRides) {
      const details = await this.getRide(ride.id);
      if (details) ridesWithDetails.push(details);
    }
    return ridesWithDetails;
  }

  async getActiveRides(): Promise<RideWithDetails[]> {
    const activeRides = await db
      .select()
      .from(rides)
      .where(
        or(
          eq(rides.status, "matching" as any),
          eq(rides.status, "en_route" as any),
          eq(rides.status, "arrived" as any),
          eq(rides.status, "on_trip" as any)
        )
      )
      .orderBy(desc(rides.createdAt));

    const ridesWithDetails: RideWithDetails[] = [];
    for (const ride of activeRides) {
      const details = await this.getRide(ride.id);
      if (details) ridesWithDetails.push(details);
    }
    return ridesWithDetails;
  }

  async createRide(insertRide: InsertRide): Promise<Ride> {
    const [ride] = await db
      .insert(rides)
      .values({
        riderId: insertRide.riderId,
        driverId: (insertRide as any).driverId || null,
        status: (insertRide as any).status || "matching",
        pickupLocation: (insertRide as any).pickupLocation || null,
        dropoffLocation: (insertRide as any).dropoffLocation || null,
        estimatedPrice: (insertRide as any).estimatedPrice || null,
        finalPrice: (insertRide as any).finalPrice || null,
        surgeMultiplier: (insertRide as any).surgeMultiplier || 1.0,
        fareWei: (insertRide as any).fareWei || null,
        distance: (insertRide as any).distance || null,
        duration: (insertRide as any).duration || null,
        airportFee: (insertRide as any).airportFee || 0,
        cashbackAmount: (insertRide as any).cashbackAmount || 0,
        libreRewards: (insertRide as any).libreRewards || 0,
        escrowId: (insertRide as any).escrowId || null,
        escrowAddress: (insertRide as any).escrowAddress || null,
        escrowStatus: (insertRide as any).escrowStatus || "pending",
        escrowAmount: (insertRide as any).escrowAmount || null,
        escrowTxHash: (insertRide as any).escrowTxHash || null,
        escrowReleaseTxHash: (insertRide as any).escrowReleaseTxHash || null,
      })
      .returning();
    return ride as Ride;
  }

  async updateRide(id: string, updates: Partial<Ride>): Promise<Ride | undefined> {
    const [updated] = await db
      .update(rides)
      .set(updates as any)
      .where(eq(rides.id, id))
      .returning();
    return updated as Ride | undefined;
  }

  async matchRide(rideId: string, driverId: string): Promise<Ride | undefined> {
    const [updated] = await db
      .update(rides)
      .set({
        driverId,
        status: "en_route",
        matchedAt: new Date(),
      } as any)
      .where(eq(rides.id, rideId))
      .returning();
    return updated as Ride | undefined;
  }

  /* ========== WALLET NONCES ========== */

  async setWalletNonce(firebaseUid: string, nonce: string, expiresAt: Date): Promise<void> {
    await db
      .insert(walletLinkNonces)
      .values({ firebaseUid, nonce, expiresAt })
      .onConflictDoUpdate({
        target: walletLinkNonces.firebaseUid,
        set: { nonce, expiresAt },
      });
  }

  async getWalletNonce(firebaseUid: string): Promise<string | null> {
    const [row] = await db
      .select()
      .from(walletLinkNonces)
      .where(eq(walletLinkNonces.firebaseUid, firebaseUid))
      .limit(1);

    if (!row || row.expiresAt < new Date()) return null;
    return row.nonce;
  }

  async clearWalletNonce(firebaseUid: string): Promise<void> {
    await db.delete(walletLinkNonces).where(eq(walletLinkNonces.firebaseUid, firebaseUid));
  }

  /* ========== STUB METHODS (Not yet implemented in schema) ========== */

  async getBadgesByUser(userId: string): Promise<Badge[]> {
    // TODO: Implement badges table
    return [];
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    // TODO: Implement badges table
    throw new Error("Badges not yet implemented");
  }

  async checkAndAwardBadges(userId: string): Promise<Badge[]> {
    // TODO: Implement badges table
    return [];
  }

  async addToWaitlist(waitlist: InsertWaitlist): Promise<Waitlist> {
    // TODO: Implement waitlist table
    throw new Error("Waitlist not yet implemented");
  }

  async getWaitlist(): Promise<Waitlist[]> {
    // TODO: Implement waitlist table
    return [];
  }

  async createSOSAlert(alert: InsertSOSAlert): Promise<SOSAlert> {
    // TODO: Implement SOS alerts table
    throw new Error("SOS alerts not yet implemented");
  }

  async getSOSAlerts(resolved?: boolean): Promise<SOSAlert[]> {
    // TODO: Implement SOS alerts table
    return [];
  }

  async resolveSOSAlert(id: string): Promise<SOSAlert | undefined> {
    // TODO: Implement SOS alerts table
    throw new Error("SOS alerts not yet implemented");
  }

  async createDispute(dispute: InsertDispute): Promise<Dispute> {
    // TODO: Implement disputes table
    throw new Error("Disputes not yet implemented");
  }

  async getDisputes(status?: string): Promise<Dispute[]> {
    // TODO: Implement disputes table
    return [];
  }

  async updateDispute(id: string, updates: Partial<Dispute>): Promise<Dispute | undefined> {
    // TODO: Implement disputes table
    throw new Error("Disputes not yet implemented");
  }

  async createReferral(referral: InsertReferral): Promise<Referral> {
    // TODO: Implement referrals table
    throw new Error("Referrals not yet implemented");
  }

  async getReferralByCode(code: string): Promise<Referral | undefined> {
    // TODO: Implement referrals table
    return undefined;
  }

  async getReferralsByUser(userId: string): Promise<Referral[]> {
    // TODO: Implement referrals table
    return [];
  }

  async claimReferral(code: string, userId: string): Promise<Referral | undefined> {
    // TODO: Implement referrals table
    return undefined;
  }

  async uploadDriverPhoto(photo: any): Promise<any> {
    // TODO: Implement photo uploads (using UploadThing)
    throw new Error("Photo uploads not yet implemented");
  }

  async getDriverPhotos(driverId: string): Promise<any[]> {
    // TODO: Implement photo retrieval
    return [];
  }

  async uploadVehiclePhoto(photo: any): Promise<any> {
    // TODO: Implement photo uploads
    throw new Error("Photo uploads not yet implemented");
  }

  async getVehiclePhotos(driverId: string): Promise<any[]> {
    // TODO: Implement photo retrieval
    return [];
  }

  async uploadInsuranceDocument(doc: any): Promise<any> {
    // TODO: Implement document uploads
    throw new Error("Document uploads not yet implemented");
  }

  async uploadBackgroundCheckDocument(doc: any): Promise<any> {
    // TODO: Implement document uploads
    throw new Error("Document uploads not yet implemented");
  }
}
