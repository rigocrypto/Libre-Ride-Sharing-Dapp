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
import type { AuditAction } from "@shared/audit/types";
import { buildAdminEscrowSnapshot } from "../services/adminEscrowMonitor";
import {
  buildAdminEscrowDetail,
  DisabledAdminEscrowActionError,
  InvalidAdminEscrowTransitionError,
  prepareAdminEscrowAction,
  type AdminEscrowAction,
} from "../services/adminEscrowActions";
import { getAuditLogForRide, listAuditLogEntries } from "../services/auditLog";
import {
  applyDriverComplianceAction,
  DriverComplianceActionError,
  getDriverComplianceDetail,
  listDriverComplianceProfiles,
  type AdminDriverComplianceAction,
} from "../services/adminDriverCompliance";

const router = Router();

const BASE_SEPOLIA_CHAIN_ID = 84532;

const adminEscrowReasonSchema = z.object({
  reason: z.string().min(10),
});

const adminDriverReasonSchema = z.object({
  reason: z.string().min(10),
});

function getAdminEscrowOptions() {
  return {
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
  };
}

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
          .where(sql`driver_status in ('pending', 'pending_review', 'requires_manual_review', 'expired_documents')`) as any,
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
 * GET /api/admin/drivers
 *
 * Driver compliance queue with dispatch eligibility and document warnings.
 */
router.get(
  "/api/admin/drivers",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const query = z
        .object({
          status: z.string().optional(),
          search: z.string().optional(),
        })
        .parse(req.query);
      const drivers = await listDriverComplianceProfiles(storage);
      const filtered = drivers.filter((driver) => {
        if (query.status && query.status !== "all" && driver.approvalStatus !== query.status) {
          return false;
        }
        const search = query.search?.trim().toLowerCase();
        if (!search) return true;
        return [
          driver.driverId,
          driver.email,
          driver.username,
          driver.walletAddress,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search);
      });

      res.json({ drivers: filtered });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("[Admin] Failed to fetch driver compliance queue:", error);
      res.status(500).json({ error: "Failed to fetch driver compliance queue" });
    }
  }
);

router.get(
  "/api/admin/drivers/pending",
  requireAuth,
  requireRole("admin"),
  async (_req, res) => {
    try {
      const drivers = (await listDriverComplianceProfiles(storage)).filter((driver) =>
        ["pending_review", "requires_manual_review", "expired_documents"].includes(driver.approvalStatus)
      );
      res.json(drivers);
    } catch (error: any) {
      console.error("[Admin] Failed to fetch pending drivers:", error);
      res.status(500).json({ error: "Failed to fetch pending drivers" });
    }
  }
);

router.get(
  "/api/admin/drivers/:driverId",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { driverId } = z.object({ driverId: z.string() }).parse(req.params);
      const detail = await getDriverComplianceDetail(storage, driverId);
      if (!detail) {
        return res.status(404).json({ error: "Driver not found" });
      }
      res.json(detail);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("[Admin] Failed to fetch driver compliance detail:", error);
      res.status(500).json({ error: "Failed to fetch driver compliance detail" });
    }
  }
);

function registerAdminDriverActionRoute(
  path: string,
  action: AdminDriverComplianceAction,
  requiresReason = true
) {
  router.post(
    path,
    requireAuth,
    requireRole("admin"),
    async (req, res) => {
      try {
        const { driverId } = z.object({ driverId: z.string() }).parse(req.params);
        const reason = requiresReason
          ? adminDriverReasonSchema.parse(req.body).reason
          : adminDriverReasonSchema.partial().parse(req.body).reason;
        const result = await applyDriverComplianceAction({
          storage,
          driverId,
          actor: {
            userId: req.user!.userId,
            role: req.user!.role,
            walletAddress: (req.user as any).walletAddress,
          },
          action,
          reason,
        });

        res.json(result);
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors[0].message });
        }
        if (error instanceof DriverComplianceActionError) {
          return res.status(error.statusCode).json({ error: error.message });
        }
        console.error(`[Admin] Failed driver compliance action ${action}:`, error);
        res.status(500).json({ error: `Failed driver compliance action ${action}` });
      }
    }
  );
}

registerAdminDriverActionRoute("/api/admin/drivers/:driverId/approve", "approve", false);
registerAdminDriverActionRoute("/api/admin/drivers/:driverId/reject", "reject");
registerAdminDriverActionRoute("/api/admin/drivers/:driverId/suspend", "suspend");
registerAdminDriverActionRoute("/api/admin/drivers/:driverId/request-documents", "request-documents");
registerAdminDriverActionRoute("/api/admin/drivers/:driverId/manual-review", "manual-review");

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
      const snapshot = buildAdminEscrowSnapshot(allRides, getAdminEscrowOptions());

      res.json(snapshot);
    } catch (error: any) {
      console.error("[Admin] Failed to fetch escrow monitor:", error);
      res.status(500).json({ error: "Failed to fetch escrow monitor" });
    }
  }
);

/**
 * GET /api/admin/escrows/:rideId
 *
 * Escrow detail view with allowed admin actions and audit trail.
 */
router.get(
  "/api/admin/escrows/:rideId",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { rideId } = z.object({ rideId: z.string() }).parse(req.params);
      const ride = await storage.getRide(rideId);
      if (!ride) {
        return res.status(404).json({ error: "Ride not found" });
      }

      res.json(await buildAdminEscrowDetail(ride, getAdminEscrowOptions()));
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("[Admin] Failed to fetch escrow detail:", error);
      res.status(500).json({ error: "Failed to fetch escrow detail" });
    }
  }
);

function registerAdminEscrowActionRoute(path: string, action: AdminEscrowAction) {
  router.post(
    path,
    requireAuth,
    requireRole("admin"),
    async (req, res) => {
      try {
        const { rideId } = z.object({ rideId: z.string() }).parse(req.params);
        const { reason } = adminEscrowReasonSchema.parse(req.body);
        const ride = await storage.getRide(rideId);
        if (!ride) {
          return res.status(404).json({ error: "Ride not found" });
        }

        const result = await prepareAdminEscrowAction({
          ride,
          actor: {
            userId: req.user!.userId,
            role: req.user!.role,
            walletAddress: (req.user as any).walletAddress,
          },
          action,
          reason,
        });

        if (result.updates) {
          await storage.updateRide(rideId, result.updates as any);
        }

        const updatedRide = (await storage.getRide(rideId)) || ride;
        res.json({
          success: true,
          action,
          previousState: result.previousState,
          nextState: result.nextState,
          audit: result.audit,
          detail: await buildAdminEscrowDetail(updatedRide, getAdminEscrowOptions()),
        });
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors[0].message });
        }
        if (error instanceof InvalidAdminEscrowTransitionError) {
          return res.status(409).json({ error: error.message });
        }
        if (error instanceof DisabledAdminEscrowActionError) {
          return res.status(403).json({ error: error.message });
        }
        console.error(`[Admin] Failed escrow action ${action}:`, error);
        res.status(500).json({ error: `Failed escrow action ${action}` });
      }
    }
  );
}

registerAdminEscrowActionRoute("/api/admin/escrows/:rideId/mark-review", "mark-review");
registerAdminEscrowActionRoute("/api/admin/escrows/:rideId/retry-verification", "retry-verification");
registerAdminEscrowActionRoute("/api/admin/escrows/:rideId/release", "release");
registerAdminEscrowActionRoute("/api/admin/escrows/:rideId/refund", "refund");
registerAdminEscrowActionRoute("/api/admin/escrows/:rideId/dispute", "dispute");

/**
 * GET /api/admin/audit-logs
 *
 * Admin activity timeline, optionally filtered by ride, actor, or action.
 */
router.get(
  "/api/admin/audit-logs",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const query = z
        .object({
          rideId: z.string().optional(),
          actorId: z.string().optional(),
          action: z.string().optional(),
        })
        .parse(req.query);

      const entries = await listAuditLogEntries({
        rideId: query.rideId,
        actorId: query.actorId,
        action: query.action as AuditAction | undefined,
      });
      res.json({ entries });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("[Admin] Failed to fetch audit logs:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  }
);

/**
 * GET /api/admin/escrows/:rideId/audit-logs
 *
 * Ride-scoped admin activity timeline.
 */
router.get(
  "/api/admin/escrows/:rideId/audit-logs",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { rideId } = z.object({ rideId: z.string() }).parse(req.params);
      res.json({ entries: await getAuditLogForRide(rideId) });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("[Admin] Failed to fetch ride audit logs:", error);
      res.status(500).json({ error: "Failed to fetch ride audit logs" });
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
