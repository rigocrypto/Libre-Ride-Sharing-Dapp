import { eq } from "drizzle-orm";
import {
  users,
  drivers,
  rides,
  waitlist,
  ORLANDO_LOCATIONS,
  type InsertUser,
  type InsertDriver,
  type InsertRide,
} from "@shared/schema";
import { db } from "../db";

async function ensureUser(insert: InsertUser): Promise<typeof users.$inferSelect> {
  if (!insert.email) {
    throw new Error("Seed users must include an email");
  }

  const [existing] = await db.select().from(users).where(eq(users.email, insert.email));
  if (existing) return existing;

  const [created] = await db.insert(users).values(insert).returning();
  return created;
}

async function ensureDriver(insert: InsertDriver): Promise<typeof drivers.$inferSelect> {
  const [existing] = await db.select().from(drivers).where(eq(drivers.userId, insert.userId));
  if (existing) return existing;

  const [created] = await db.insert(drivers).values(insert).returning();
  return created;
}

async function seedWaitlist(email: string, userType: "driver" | "rider") {
  const [existing] = await db.select().from(waitlist).where(eq(waitlist.email, email));
  if (existing) return existing;

  const [created] = await db
    .insert(waitlist)
    .values({ email, userType })
    .returning();
  return created;
}

async function seedRide(insert: InsertRide) {
  if (insert.routeHash) {
    const [existing] = await db.select().from(rides).where(eq(rides.routeHash, insert.routeHash));
    if (existing) return existing;
  }

  const [created] = await db.insert(rides).values(insert).returning();
  return created;
}

async function main() {
  console.log("Seeding Libre development data...");

  const driverUser = await ensureUser({
    email: "driver@libre.dev",
    username: "orlando-driver",
    role: "driver",
    phoneNumber: "+14075550123",
  } satisfies InsertUser);

  const riderUser = await ensureUser({
    email: "rider@libre.dev",
    username: "orlando-rider",
    role: "rider",
    phoneNumber: "+14075550124",
  } satisfies InsertUser);

  const adminUser = await ensureUser({
    email: "admin@libre.dev",
    username: "libre-admin",
    role: "admin",
    phoneNumber: "+14075550125",
  } satisfies InsertUser);

  await ensureDriver({
    userId: driverUser.id,
    isOnline: true,
    isVerified: true,
    isAirportLicensed: true,
    vehicleType: "suv",
    vehicleMake: "Tesla",
    vehicleModel: "Model Y",
    vehicleYear: 2023,
    vehicleColor: "Midnight Silver",
    licensePlate: "ORL-LIBRE",
    licenseNumber: "FLD1234567",
    acceptanceRate: 98,
    onTimeRate: 99,
  } satisfies InsertDriver);

  await seedWaitlist("press@libre.dev", "rider");
  await seedWaitlist("founder@libre.dev", "driver");

  const pickup = ORLANDO_LOCATIONS.MCO_AIRPORT;
  const dropoff = ORLANDO_LOCATIONS.DISNEY_SPRINGS;

  await seedRide({
    riderId: riderUser.id,
    driverId: driverUser.id,
    status: "completed",
    pickupLocation: { ...pickup, address: pickup.name },
    dropoffLocation: { ...dropoff, address: dropoff.name },
    estimatedPrice: 52.5,
    finalPrice: 54.75,
    surgeMultiplier: 1.05,
    distance: 18.2,
    duration: 32,
    airportFee: 3.5,
    cashbackAmount: 5,
    libreRewards: 12,
    routeHash: "seed-mco-disney",
  } satisfies InsertRide);

  console.log("Seed completed. Users:");
  console.table([
    { email: driverUser.email, role: driverUser.role },
    { email: riderUser.email, role: riderUser.role },
    { email: adminUser.email, role: adminUser.role },
  ]);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

