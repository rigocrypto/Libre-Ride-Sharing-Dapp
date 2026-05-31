import express, { Request, Response } from "express";
import { db } from "@server/db/client";
import {
  insurancePolicies,
  driverEligibilitySnapshots,
  users,
  InsertInsurancePolicy,
} from "@shared/schema";
import {
  getDriverEligibility,
  recalculateAndSaveEligibility,
  getDriverEligibilityHistory,
} from "@server/lib/compliance/driver-eligibility";
import {
  createAuditEvent,
  getDriverAuditTrail,
  getRideAuditTrail,
} from "@server/lib/compliance/audit-events";
import { eq } from "drizzle-orm";
import { insertInsurancePolicySchema } from "@shared/schema";

const router = express.Router();

/**
 * POST /api/compliance/insurance
 * Driver submits insurance document for verification.
 * Status starts as "pending" until admin approves or rejects.
 */
router.post("/api/compliance/insurance", async (req: Request, res: Response) => {
  try {
    // Validate & parse
    const validated = insertInsurancePolicySchema.parse(req.body);
    const driverId = req.user?.userId;

    if (!driverId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if driver exists
    const driver = await db.query.users.findFirst({
      where: eq(users.id, driverId),
    });

    if (!driver || driver.role !== "driver") {
      return res.status(403).json({ error: "Must be a driver to submit insurance" });
    }

    // Create insurance policy record
    const policy: InsertInsurancePolicy = {
      ...validated,
      driverId,
      status: "pending",
    };

    const result = await db.insert(insurancePolicies).values(policy).returning();
    const savedPolicy = result[0];

    // Audit event
    await createAuditEvent({
      eventType: "INSURANCE_SUBMITTED",
      actorUserId: driverId,
      actorRole: "driver",
      targetType: "insurance",
      targetId: savedPolicy.id,
      driverId,
      metadata: {
        carrierName: savedPolicy.carrierName,
        policyNumber: savedPolicy.policyNumber,
        expirationDate: savedPolicy.expirationDate,
        hasCommercialCoverage: savedPolicy.hasCommercialCoverage,
        hasTncEndorsement: savedPolicy.hasTncEndorsement,
      },
      req,
    });

    res.status(201).json({
      success: true,
      data: {
        id: savedPolicy.id,
        status: "pending",
        message: "Insurance submitted for review. Admin will verify within 24 hours.",
      },
    });
  } catch (error) {
    console.error("Insurance submission error:", error);
    res.status(400).json({ error: error instanceof Error ? error.message : "Failed to submit insurance" });
  }
});

/**
 * GET /api/compliance/insurance/:driverId
 * Get insurance history for a driver (driver can see own, admin can see any).
 */
router.get("/api/compliance/insurance/:driverId", async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    const currentUserId = req.user?.userId;

    // Only allow drivers to view their own, admins can view any
    if (currentUserId !== driverId && req.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const policies = await db.query.insurancePolicies.findMany({
      where: eq(insurancePolicies.driverId, driverId),
      orderBy: (table, { desc }) => desc(table.createdAt),
    });

    res.json({
      success: true,
      data: policies,
    });
  } catch (error) {
    console.error("Insurance fetch error:", error);
    res.status(500).json({ error: "Failed to fetch insurance" });
  }
});

/**
 * POST /api/admin/compliance/insurance/:policyId/approve
 * Admin approves an insurance policy.
 * Triggers eligibility recalculation.
 */
router.post(
  "/api/admin/compliance/insurance/:policyId/approve",
  async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ error: "Admin only" });
      }

      const { policyId } = req.params;

      // Get policy
      const policy = await db.query.insurancePolicies.findFirst({
        where: eq(insurancePolicies.id, policyId),
      });

      if (!policy) {
        return res.status(404).json({ error: "Policy not found" });
      }

      // Update status
      const updated = await db
        .update(insurancePolicies)
        .set({
          status: "approved",
          verifiedAt: new Date(),
          verifiedBy: req.user.userId,
        })
        .where(eq(insurancePolicies.id, policyId))
        .returning();

      // Audit event
      await createAuditEvent({
        eventType: "INSURANCE_APPROVED",
        actorUserId: req.user.userId,
        actorRole: "admin",
        targetType: "insurance",
        targetId: policyId,
        driverId: policy.driverId,
        metadata: {
          carrierName: policy.carrierName,
          policyNumber: policy.policyNumber,
          verifiedAt: new Date().toISOString(),
        },
        req,
      });

      // Recalculate eligibility
      await recalculateAndSaveEligibility(policy.driverId, req.user.userId);

      res.json({
        success: true,
        data: {
          policyId: updated[0].id,
          status: "approved",
          message: "Insurance approved. Driver eligibility updated.",
        },
      });
    } catch (error) {
      console.error("Insurance approval error:", error);
      res.status(500).json({ error: "Failed to approve insurance" });
    }
  }
);

/**
 * POST /api/admin/compliance/insurance/:policyId/reject
 * Admin rejects an insurance policy.
 * Triggers eligibility recalculation.
 */
router.post(
  "/api/admin/compliance/insurance/:policyId/reject",
  async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ error: "Admin only" });
      }

      const { policyId } = req.params;
      const { rejectionReason } = req.body;

      if (!rejectionReason) {
        return res.status(400).json({ error: "Rejection reason required" });
      }

      // Get policy
      const policy = await db.query.insurancePolicies.findFirst({
        where: eq(insurancePolicies.id, policyId),
      });

      if (!policy) {
        return res.status(404).json({ error: "Policy not found" });
      }

      // Update status
      const updated = await db
        .update(insurancePolicies)
        .set({
          status: "rejected",
          rejectionReason,
          verifiedAt: new Date(),
          verifiedBy: req.user.userId,
        })
        .where(eq(insurancePolicies.id, policyId))
        .returning();

      // Audit event
      await createAuditEvent({
        eventType: "INSURANCE_REJECTED",
        actorUserId: req.user.userId,
        actorRole: "admin",
        targetType: "insurance",
        targetId: policyId,
        driverId: policy.driverId,
        metadata: {
          carrierName: policy.carrierName,
          policyNumber: policy.policyNumber,
          rejectionReason,
        },
        req,
      });

      // Recalculate eligibility
      await recalculateAndSaveEligibility(policy.driverId, req.user.userId);

      res.json({
        success: true,
        data: {
          policyId: updated[0].id,
          status: "rejected",
          rejectionReason,
          message: "Insurance rejected. Driver notified. Re-upload a corrected policy.",
        },
      });
    } catch (error) {
      console.error("Insurance rejection error:", error);
      res.status(500).json({ error: "Failed to reject insurance" });
    }
  }
);

/**
 * GET /api/compliance/eligibility/:driverId
 * Get current driver eligibility status.
 * Driver can view own, admin can view any.
 */
router.get("/api/compliance/eligibility/:driverId", async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    const currentUserId = req.user?.userId;

    // Authorization
    if (currentUserId !== driverId && req.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const snapshot = await getDriverEligibility(driverId);

    if (!snapshot) {
      return res.status(404).json({ error: "No eligibility snapshot found" });
    }

    res.json({
      success: true,
      data: {
        driverId,
        canGoOnline: snapshot.canGoOnline,
        canAcceptGeneralRides: snapshot.canAcceptGeneralRides,
        canAcceptAirportRides: snapshot.canAcceptAirportRides,
        blockingReasons: snapshot.blockingReasons,
        warnings: snapshot.warnings,
        calculatedAt: snapshot.calculatedAt,
        // Individual gates for admin visibility
        identityVerified: snapshot.identityVerified,
        licenseVerified: snapshot.licenseVerified,
        backgroundCheckApproved: snapshot.backgroundCheckApproved,
        insuranceVerified: snapshot.insuranceVerified,
        vehicleApproved: snapshot.vehicleApproved,
        vehicleInspectionApproved: snapshot.vehicleInspectionApproved,
        walletVerified: snapshot.walletVerified,
        airportEligible: snapshot.airportEligible,
      },
    });
  } catch (error) {
    console.error("Eligibility fetch error:", error);
    res.status(500).json({ error: "Failed to fetch eligibility" });
  }
});

/**
 * GET /api/compliance/eligibility/:driverId/history
 * Get eligibility calculation history (for audit trail).
 */
router.get(
  "/api/compliance/eligibility/:driverId/history",
  async (req: Request, res: Response) => {
    try {
      const { driverId } = req.params;

      // Only admin can view history
      if (req.user?.role !== "admin") {
        return res.status(403).json({ error: "Admin only" });
      }

      const history = await getDriverEligibilityHistory(driverId);

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      console.error("Eligibility history error:", error);
      res.status(500).json({ error: "Failed to fetch eligibility history" });
    }
  }
);

/**
 * POST /api/admin/compliance/drivers/:driverId/recalculate
 * Force recalculation of driver eligibility (admin operation).
 */
router.post(
  "/api/admin/compliance/drivers/:driverId/recalculate",
  async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ error: "Admin only" });
      }

      const { driverId } = req.params;

      // Check driver exists
      const driver = await db.query.users.findFirst({
        where: eq(users.id, driverId),
      });

      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }

      // Recalculate
      const snapshot = await recalculateAndSaveEligibility(driverId, req.user.userId);

      res.json({
        success: true,
        data: {
          driverId,
          canGoOnline: snapshot.canGoOnline,
          canAcceptGeneralRides: snapshot.canAcceptGeneralRides,
          canAcceptAirportRides: snapshot.canAcceptAirportRides,
          blockingReasons: snapshot.blockingReasons,
          calculatedAt: snapshot.calculatedAt,
        },
      });
    } catch (error) {
      console.error("Eligibility recalculation error:", error);
      res.status(500).json({ error: "Failed to recalculate eligibility" });
    }
  }
);

/**
 * GET /api/admin/audit/drivers/:driverId
 * Get audit trail for a driver (admin only).
 */
router.get(
  "/api/admin/audit/drivers/:driverId",
  async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ error: "Admin only" });
      }

      const { driverId } = req.params;
      const auditTrail = await getDriverAuditTrail(driverId);

      res.json({
        success: true,
        data: auditTrail,
      });
    } catch (error) {
      console.error("Audit trail error:", error);
      res.status(500).json({ error: "Failed to fetch audit trail" });
    }
  }
);

/**
 * GET /api/admin/audit/rides/:rideId
 * Get audit trail for a ride (admin/support only).
 */
router.get(
  "/api/admin/audit/rides/:rideId",
  async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ error: "Admin only" });
      }

      const { rideId } = req.params;
      const auditTrail = await getRideAuditTrail(rideId);

      res.json({
        success: true,
        data: auditTrail,
      });
    } catch (error) {
      console.error("Audit trail error:", error);
      res.status(500).json({ error: "Failed to fetch audit trail" });
    }
  }
);

export default router;
