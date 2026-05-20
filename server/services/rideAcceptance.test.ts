/**
 * Ride Acceptance Isolation Test
 *
 * Tests the critical invariant: exactly one driver can accept a ride.
 * These tests use MemStorage so the unit suite can run in CI without a
 * provisioned PostgreSQL database.
 */

import { beforeAll, describe, expect, it } from "vitest";
import type { IStorage } from "../storage";
import type { acceptRideAtomic as acceptRideAtomicType } from "./rideAcceptance";

let storage: IStorage;
let acceptRideAtomic: typeof acceptRideAtomicType;
let RideAlreadyAcceptedError: typeof import("./rideAcceptance").RideAlreadyAcceptedError;
let RideNotFoundError: typeof import("./rideAcceptance").RideNotFoundError;

describe("Ride Acceptance - Isolation & Race Conditions", () => {
  let riderId: string;
  let driver1Id: string;
  let driver2Id: string;
  let rideId: string;

  beforeAll(async () => {
    process.env.STORAGE_ENGINE = "mem";
    delete process.env.DATABASE_URL;

    const storageFactory = await import("../storage-factory");
    const rideAcceptance = await import("./rideAcceptance");

    storage = storageFactory.storage;
    acceptRideAtomic = rideAcceptance.acceptRideAtomic;
    RideAlreadyAcceptedError = rideAcceptance.RideAlreadyAcceptedError;
    RideNotFoundError = rideAcceptance.RideNotFoundError;

    const rider = await storage.createUser({
      firebaseUid: `test-rider-${Date.now()}`,
      email: `rider-${Date.now()}@test.local`,
      role: "rider",
    });

    const driver1 = await storage.createUser({
      firebaseUid: `test-driver-1-${Date.now()}`,
      email: `driver1-${Date.now()}@test.local`,
      role: "driver",
      walletAddress: "0x1111111111111111111111111111111111111111",
      walletVerifiedAt: new Date(),
      driverStatus: "approved" as any,
    });

    const driver2 = await storage.createUser({
      firebaseUid: `test-driver-2-${Date.now()}`,
      email: `driver2-${Date.now()}@test.local`,
      role: "driver",
      walletAddress: "0x2222222222222222222222222222222222222222",
      walletVerifiedAt: new Date(),
      driverStatus: "approved" as any,
    });

    await storage.createDriver({ userId: driver1.id, driverStatus: "approved" as any } as any);
    await storage.createDriver({ userId: driver2.id, driverStatus: "approved" as any } as any);

    riderId = rider.id;
    driver1Id = driver1.id;
    driver2Id = driver2.id;

    const ride = await storage.createRide({
      riderId,
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
      estimatedPrice: 25,
    });

    rideId = ride.id;
  });

  it("allows exactly one driver to accept when multiple click simultaneously", async () => {
    const results = await Promise.allSettled([
      acceptRideAtomic(rideId, driver1Id),
      acceptRideAtomic(rideId, driver2Id),
    ]);

    const successes = results.filter((result) => result.status === "fulfilled");
    const failures = results.filter((result) => result.status === "rejected");

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);

    const winner = (successes[0] as PromiseFulfilledResult<Awaited<ReturnType<typeof acceptRideAtomic>>>).value;
    expect(winner.status).toBe("ACCEPTED");
    expect([driver1Id, driver2Id]).toContain(winner.driverId);

    const loser = (failures[0] as PromiseRejectedResult).reason;
    expect(loser).toBeInstanceOf(RideAlreadyAcceptedError);

    const rideInStorage = await storage.getRide(rideId);
    expect(rideInStorage?.driverId).toBe(winner.driverId);
    expect(rideInStorage?.status).toBe("ACCEPTED");
  });

  it("rejects acceptance if ride is not found", async () => {
    await expect(
      acceptRideAtomic("00000000-0000-0000-0000-000000000000", driver1Id)
    ).rejects.toThrow(RideNotFoundError);
  });

  it("rejects acceptance if ride is already in the wrong state", async () => {
    const completedRide = await storage.createRide({
      riderId,
      status: "COMPLETED",
      pickupLocation: {
        lat: 28.4,
        lng: -81.3,
        address: "Test pickup",
      },
      dropoffLocation: {
        lat: 28.5,
        lng: -81.4,
        address: "Test dropoff",
      },
      estimatedPrice: 20,
    });

    await expect(
      acceptRideAtomic(completedRide.id, driver2Id)
    ).rejects.toThrow(RideAlreadyAcceptedError);
  });

  it("returns all required fields after acceptance", async () => {
    const freshRide = await storage.createRide({
      riderId,
      status: "OFFERED",
      pickupLocation: {
        lat: 28.4294,
        lng: -81.3089,
        address: "Test pickup",
      },
      dropoffLocation: {
        lat: 28.5,
        lng: -81.4,
        address: "Test dropoff",
      },
      estimatedPrice: 30,
    });

    const result = await acceptRideAtomic(freshRide.id, driver1Id);

    expect(result).toEqual({
      rideId: freshRide.id,
      driverId: driver1Id,
      status: "ACCEPTED",
      acceptedAt: expect.any(Date),
    });
    expect(result.acceptedAt.getTime()).toBeLessThanOrEqual(Date.now());
  });
});
