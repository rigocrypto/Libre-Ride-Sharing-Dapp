/**
 * Admin Routes
 *
 * Secure admin-only endpoints for stats, drivers, rides, and users.
 * All routes require Firebase-authenticated admin via requireAuth + requireRole('admin').
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth";
import { storage } from "../storage-factory";
import { db } from "../db/client";
import { users, rides } from "../db/schema";
import { sql, inArray } from "drizzle-orm";
import { buildAdminEscrowSnapshot } from "../services/adminEscrowMonitor";

const router = Router();

const BASE_SEPOLIA_CHAIN_ID = 84532;

/**
 * GET /api/admin/stats
 *
 * High-level KPIs for admin dashboard.
 */
router.get(
  "/api/admin/stats",
  requireAuth,
  requireRole("admin"),
  async (_req, res) => {
    try {
      const [[{ count: userCount }]] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)` })
          .from(users) as any,
      ]);

      const [[{ pendingDrivers }], [{ approvedDrivers }]] = await Promise.all([
        db
          .select({ pendingDrivers: sql<number>`count(*)` })
          .from(users)
          .where(sql`driver_status = 'pending'`) as any,
        db
          .select({ approvedDrivers: sql<number>`count(*)` })
          .from(users)
          .where(sql`driver_status = 'approved'`) as any,
      ]);

      const [[{ activeRides }], [{ completedRides }]] = await Promise.all([
        db
          .select({ activeRides: sql<number>`count(*)` })
          .from(rides)
          .where(
            inArray(rides.status, [
              "matching",
              "en_route",
              "arrived",
              "on_trip",
            ] as any)
          ) as any,
        db
          .select({ completedRides: sql<number>`count(*)` })
          .from(rides)
          .where(sql`status = 'completed'`) as any,
      ]);

      const [[{ escrowLocked }]] = (await db
        .select({ escrowLocked: sql<number>`coalesce(sum(escrow_amount), 0)` })
        .from(rides)
        .where(sql`escrow_status = 'locked'`)) as any;

      const escrowLockedEth = escrowLocked || 0;
      const escrowLockedWei = BigInt(Math.round(escrowLockedEth * 1e18)).toString();

      res.json({
        users: userCount || 0,
        drivers: {
          pending: pendingDrivers || 0,
          approved: approvedDrivers || 0,
        },
        rides: {
          active: activeRides || 0,
          completed: completedRides || 0,
        },
        escrowLockedWei,
      });
    } catch (error: any) {
      console.error("[Admin] Failed to fetch stats:", error);
      res.status(500).json({ error: "Failed to fetch admin stats" });
    }
  }
);

/**
 * GET /api/admin/drivers/pending
 *
 * List pending drivers for approval.
 */
router.get(
  "/api/admin/drivers/pending",
  requireAuth,
  requireRole("admin"),
  async (_req, res) => {
    try {
      const rows = await db
        .select({
          id: users.id,
          email: users.email,
          walletAddress: users.walletAddress,
          driverStatus: sql<string>`driver_status`,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(sql`driver_status = 'pending'`)
        .orderBy(users.createdAt);

      res.json(rows);
    } catch (error: any) {
      console.error("[Admin] Failed to fetch pending drivers:", error);
      res.status(500).json({ error: "Failed to fetch pending drivers" });
    }
  }
);

/**
 * POST /api/admin/drivers/:id/approve
 *
 * Approve a driver (by userId).
 */
router.post(
  "/api/admin/drivers/:id/approve",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { id } = z.object({ id: z.string() }).parse(req.params);

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const updated = await storage.updateDriver(id, {
        driverStatus: "approved" as any,
        isVerified: true as any,
      });

      if (!updated) {
        return res.status(404).json({ error: "Driver not found" });
      }

      res.json({ success: true, driverStatus: (updated as any).driverStatus });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("[Admin] Failed to approve driver:", error);
      res.status(500).json({ error: "Failed to approve driver" });
    }
  }
);

/**
 * POST /api/admin/drivers/:id/reject
 *
 * Reject a driver (by userId) with reason.
 */
router.post(
  "/api/admin/drivers/:id/reject",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { id } = z.object({ id: z.string() }).parse(req.params);
      const { reason } = z
        .object({ reason: z.string().min(10) })
        .parse(req.body);

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const updated = await storage.updateDriver(id, {
        driverStatus: "rejected" as any,
      });

      if (!updated) {
        return res.status(404).json({ error: "Driver not found" });
      }

      res.json({
        success: true,
        driverStatus: (updated as any).driverStatus,
        reason,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("[Admin] Failed to reject driver:", error);
      res.status(500).json({ error: "Failed to reject driver" });
    }
  }
);

/**
 * GET /api/admin/rides
 *
 * List rides with escrow status for admin.
 */
router.get(
  "/api/admin/rides",
  requireAuth,
  requireRole("admin"),
  async (_req, res) => {
    try {
      const allRides = await storage.getAllRides();
      res.json(allRides);
    } catch (error: any) {
      console.error("[Admin] Failed to fetch rides:", error);
      res.status(500).json({ error: "Failed to fetch rides" });
    }
  }
);

/**
 * GET /api/admin/escrows
 *
 * Payment operations view for escrowed rides. Uses the storage abstraction so
 * local QA can run against MemStorage while production remains auth-gated.
 */
router.get(
  "/api/admin/escrows",
  requireAuth,
  requireRole("admin"),
  async (_req, res) => {
    try {
      const allRides = await storage.getAllRides();
      const snapshot = buildAdminEscrowSnapshot(allRides, {
        chainId: Number(
          process.env.CHAIN_ID ||
            process.env.VITE_CHAIN_ID ||
            BASE_SEPOLIA_CHAIN_ID
        ),
        tokenAddress:
          process.env.USDC_TOKEN_ADDRESS ||
          process.env.USDC_CONTRACT_ADDRESS_TESTNET ||
          process.env.VITE_USDC_TOKEN_ADDRESS ||
          "unknown",
        verificationMode: process.env.ESCROW_VERIFIER_MODE || "mock",
      });

      res.json(snapshot);
    } catch (error: any) {
      console.error("[Admin] Failed to fetch escrow monitor:", error);
      res.status(500).json({ error: "Failed to fetch escrow monitor" });
    }
  }
);

/**
 * GET /api/admin/users
 *
 * List users for admin moderation.
 */
router.get(
  "/api/admin/users",
  requireAuth,
  requireRole("admin"),
  async (_req, res) => {
    try {
      const rows = await db
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          walletAddress: users.walletAddress,
          driverStatus: sql<string>`driver_status`,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(users.createdAt);

      res.json(rows);
    } catch (error: any) {
      console.error("[Admin] Failed to fetch users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  }
);

export default router;
