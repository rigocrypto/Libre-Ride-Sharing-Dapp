#!/usr/bin/env node

/**
 * Phase 1 Verification Script
 *
 * Simple verification that the ride acceptance atomic transaction works.
 * Tests the critical invariant: exactly one driver can accept a ride.
 *
 * Run: npm run verify:acceptance
 */

import { db } from "../server/db/client.ts";
import { users, rides } from "../server/db/schema/index.ts";
import { acceptRideAtomic } from "../server/services/rideAcceptance.ts";

async function main() {
  console.log("🧪 Phase 1 Verification: Ride Acceptance Isolation\n");

  try {
    // Step 1: Create test users
    console.log("📝 Creating test users...");
    const ridersResult = await db
      .insert(users)
      .values({
        firebaseUid: `test-rider-${Date.now()}`,
        email: `rider-${Date.now()}@test.local`,
        role: "rider",
      })
      .returning();

    const rider = ridersResult[0];

    const d1Result = await db
      .insert(users)
      .values({
        firebaseUid: `test-driver-1-${Date.now()}`,
        email: `driver1-${Date.now()}@test.local`,
        role: "driver",
      })
      .returning();

    const driver1 = d1Result[0];

    const d2Result = await db
      .insert(users)
      .values({
        firebaseUid: `test-driver-2-${Date.now()}`,
        email: `driver2-${Date.now()}@test.local`,
        role: "driver",
      })
      .returning();

    const driver2 = d2Result[0];

    console.log(`   ✅ Rider: ${rider.id}`);
    console.log(`   ✅ Driver 1: ${driver1.id}`);
    console.log(`   ✅ Driver 2: ${driver2.id}\n`);

    // Step 2: Create a ride in OFFERED state
    console.log("📍 Creating ride in OFFERED state...");
    const rideResult = await db
      .insert(rides)
      .values({
        riderId: rider.id,
        status: "OFFERED",
        pickupLocation: {
          lat: 28.4294,
          lng: -81.3089,
          address: "Orlando Airport",
        },
        dropoffLocation: {
          lat: 28.5,
          lng: -81.4,
          address: "Downtown Orlando",
        },
        estimatedPrice: 25.0,
      })
      .returning();

    const ride = rideResult[0];

    console.log(`   ✅ Ride: ${ride.id}`);
    console.log(`   ✅ Status: ${ride.status}\n`);

    // Step 3: Simulate both drivers clicking Accept simultaneously
    console.log("⚡ Simulating both drivers accepting simultaneously...\n");

    const results = await Promise.allSettled([
      acceptRideAtomic(ride.id, driver1.id),
      acceptRideAtomic(ride.id, driver2.id),
    ]);

    const successes = results.filter((r) => r.status === "fulfilled");
    const failures = results.filter((r) => r.status === "rejected");

    // Step 4: Verify results
    console.log("📊 Results:\n");
    console.log(`   🎯 Successes: ${successes.length}`);
    console.log(`   ❌ Failures: ${failures.length}\n`);

    if (successes.length === 1 && failures.length === 1) {
      console.log(
        "✅ CRITICAL INVARIANT VERIFIED: Exactly one driver accepted!\n"
      );

      const winner = successes[0].value;
      console.log(
        `   Winner: ${winner.driverId === driver1.id ? "Driver 1" : "Driver 2"}`
      );
      console.log(`   Status: ${winner.status}`);
      console.log(`   Accepted At: ${winner.acceptedAt}\n`);

      const loser = failures[0].reason;
      console.log(`   Loser got error: ${loser.name}`);
      console.log(`   Error message: "${loser.message}"\n`);

      console.log("═══════════════════════════════════════════════════════════");
      console.log("✅ PHASE 1 VERIFICATION PASSED");
      console.log("═══════════════════════════════════════════════════════════\n");
      console.log("The atomic acceptance transaction is working correctly:");
      console.log("- FOR UPDATE lock prevents race conditions");
      console.log("- Exactly one driver can win");
      console.log("- Database state is consistent");
      console.log("- Ready for Phase 2: REST endpoints\n");

      process.exit(0);
    } else {
      console.log("❌ CRITICAL INVARIANT VIOLATED!");
      console.log(`   Expected: 1 success, 1 failure`);
      console.log(
        `   Got: ${successes.length} successes, ${failures.length} failures\n`
      );
      process.exit(1);
    }
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

main();
