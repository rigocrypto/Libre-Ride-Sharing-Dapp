import type { Express } from "express";
import { randomBytes } from "node:crypto";
import { z } from "zod";

import { storage } from "./storage-factory.js";
import { setDevToken } from "./lib/devAuth.js";

const seedOverridesSchema = z.object({
  riderWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  driverWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
});

export function registerDevRoutes(app: Express) {
  app.post("/api/__test/seed", async (req, res) => {
    try {
      const seedOverrides = seedOverridesSchema.safeParse(req.body ?? {});
      if (!seedOverrides.success) {
        return res.status(400).json({ error: seedOverrides.error.errors[0].message });
      }

      const now = Date.now();
      const riderFirebaseUid = `dev-rider-${now}`;
      const driverFirebaseUid = `dev-driver-${now}`;

      console.log("[DEV SEED] Rider UID:", riderFirebaseUid);
      let rider =
        (await storage.getUserByFirebaseUid(riderFirebaseUid)) ||
        (await storage.getUserByEmail(`rider-test+${Date.now()}@dev.local`));

      if (!rider) {
        const riderEmail = `rider-test+${now}@dev.local`;
        const riderWallet =
          seedOverrides.data.riderWallet ?? `0x${randomBytes(20).toString("hex")}`;

        try {
          console.log(
            "[DEV SEED] Creating rider with UID:",
            riderFirebaseUid,
            "email:",
            riderEmail,
            "wallet:",
            riderWallet
          );

          const existingByFirebase = await storage.getUserByFirebaseUid(riderFirebaseUid);
          const existingByEmail = await storage.getUserByEmail(riderEmail);

          if (existingByFirebase) {
            rider = existingByFirebase;
          } else if (existingByEmail) {
            rider = existingByEmail;
          } else {
            rider = await storage.createUser({
              firebaseUid: riderFirebaseUid,
              email: riderEmail,
              role: "rider",
              walletAddress: riderWallet,
              profileImage: null,
            } as any);
          }
        } catch (err: any) {
          console.error("[DEV SEED] createUser rider error:", err.stack || err);
          if (/(duplicate key|unique constraint)/i.test(err.message || "")) {
            rider = await storage.getUserByFirebaseUid(riderFirebaseUid);
            if (!rider) rider = await storage.getUserByWallet(riderWallet);
            if (!rider) rider = await storage.getUserByEmail(riderEmail);
            if (!rider) throw err;
          } else {
            throw err;
          }
        }
      }

      console.log("[DEV SEED] Driver UID:", driverFirebaseUid);
      let driver =
        (await storage.getUserByFirebaseUid(driverFirebaseUid)) ||
        (await storage.getUserByEmail(`driver-test+${Date.now()}@dev.local`));

      if (!driver) {
        const driverEmail = `driver-test+${now}@dev.local`;
        let driverWallet =
          seedOverrides.data.driverWallet ?? `0x${randomBytes(20).toString("hex")}`;

        try {
          console.log(
            "[DEV SEED] Creating driver with UID:",
            driverFirebaseUid,
            "email:",
            driverEmail,
            "wallet:",
            driverWallet
          );

          const existingByFirebase = await storage.getUserByFirebaseUid(driverFirebaseUid);
          const existingByEmail = await storage.getUserByEmail(driverEmail);

          if (existingByFirebase) {
            driver = existingByFirebase;
          } else if (existingByEmail) {
            driver = existingByEmail;
          } else {
            if ((rider as any)?.walletAddress && (rider as any).walletAddress === driverWallet) {
              driverWallet = `0x${randomBytes(20).toString("hex")}`;
            }

            driver = await storage.createUser({
              firebaseUid: driverFirebaseUid,
              email: driverEmail,
              role: "driver",
              walletAddress: driverWallet,
            } as any);
          }
        } catch (err: any) {
          console.error("[DEV SEED] createUser driver error:", err.stack || err);
          if (/(duplicate key|unique constraint)/i.test(err.message || "")) {
            driver = await storage.getUserByFirebaseUid(driverFirebaseUid);
            if (!driver) driver = await storage.getUserByWallet(driverWallet);
            if (!driver) driver = await storage.getUserByEmail(driverEmail);
            if (!driver) throw err;
          } else {
            throw err;
          }
        }
      }

      const ride = await storage.createRide({
        riderId: rider.id,
        driverId: null,
        status: "OFFERED",
        escrowStatus: "pending",
        pickupLocation: { lat: 28.428, lng: -81.3089, address: "Orlando Airport" },
        dropoffLocation: { lat: 28.5, lng: -81.4, address: "Downtown Orlando" },
        estimatedPrice: 25.0,
      } as any);

      await storage.updateUser(rider.id, {
        walletVerifiedAt: new Date(),
        siweVerifiedAt: new Date(),
        identityVerified: true,
        identityVerifiedAt: new Date(),
      } as any);

      await storage.updateUser(driver.id, { driverStatus: "approved" } as any);
      await storage.createDriver({ userId: driver.id } as any).catch(() => {});

      setDevToken("dev-token", {
        firebaseUid: riderFirebaseUid,
        userId: rider.id,
        email: rider.email,
        role: "rider",
        walletAddress: rider.walletAddress,
        walletVerifiedAt: new Date(),
        siweVerifiedAt: new Date(),
      });

      setDevToken("dev-driver-token", {
        firebaseUid: driverFirebaseUid,
        userId: driver.id,
        email: driver.email,
        role: "driver",
        walletAddress: driver.walletAddress,
        walletVerifiedAt: new Date(),
        siweVerifiedAt: new Date(),
      });

      res.json({
        success: true,
        token: "dev-token",
        driverToken: "dev-driver-token",
        rideId: ride.id,
        riderId: rider.id,
        driverId: driver.id,
      });
    } catch (err: any) {
      console.error("[DEV SEED] Failed:", err);
      res.status(500).json({ error: "Seed failed", message: err.message });
    }
  });
}
