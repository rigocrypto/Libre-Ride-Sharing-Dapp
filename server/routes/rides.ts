/**
 * Rides Routes
 *
 * Ride matching, acceptance, and state management.
 * Critical path for marketplace operations.
 *
 * Endpoints:
 * - POST /api/rides/:id/accept (atomic driver acceptance)
 * - POST /api/rides/:id/start (escrow-gated ride start)
 */

import { Router } from 'express';
import { requireAuth, requireWallet, requireSIWE } from '../middleware/auth';
import {
  acceptRideAtomic,
  DriverNotEligibleError,
  RideAlreadyAcceptedError,
  RideNotFoundError,
} from '../services/rideAcceptance';
import { createAuditEvent } from '../lib/compliance/audit-events';
import { storage } from '../storage-factory';
import { getRideStartEligibility } from '../services/rideStartGuard';

const router = Router();

/**
 * POST /api/rides/:id/accept
 *
 * Driver accepts a ride offer.
 * This is the **critical path** for marketplace — must be atomic.
 *
 * Calls acceptRideAtomic() which:
 * 1. Locks ride row (FOR UPDATE)
 * 2. Verifies status = OFFERED
 * 3. Atomically assigns driver + transitions to ACCEPTED
 * 4. Returns result
 *
 * Auth: requireAuth (driver must be authenticated)
 * NOT requireWallet (no funds move here; escrow happens later)
 * NOT requireSIWE (no signature needed)
 *
 * Response:
 * - 200: Ride accepted successfully
 * - 404: Ride not found
 * - 409: Ride already accepted by another driver
 * - 500: Database error
 */
router.post('/api/rides/:id/accept', requireAuth, requireWallet, requireSIWE, async (req, res) => {
  const rideId = req.params.id;
  const driverId = req.user?.userId;

  try {
    if (!req.user || !driverId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate rideId is UUID-like
    if (!rideId || rideId.length < 36) {
      return res.status(400).json({ error: 'Invalid ride ID' });
    }

    /**
     * Call the atomic transaction
     * This is where all the safety happens.
     */
    const result = await acceptRideAtomic(rideId, driverId);

    /**
     * Success: return 200 with acceptance details
     */
    return res.status(200).json({
      success: true,
      data: {
        rideId: result.rideId,
        driverId: result.driverId,
        status: result.status,
        acceptedAt: result.acceptedAt,
      },
    });
  } catch (err) {
    /**
     * Handle specific errors
     */
    if (err instanceof RideNotFoundError) {
      return res.status(404).json({
        success: false,
        error: 'Ride not found or no longer available',
      });
    }

    if (err instanceof RideAlreadyAcceptedError) {
      return res.status(409).json({
        success: false,
        error: 'Ride was already accepted by another driver',
      });
    }

    if (err instanceof DriverNotEligibleError) {
      try {
        await createAuditEvent({
          eventType: 'RIDE_ACCEPT_BLOCKED',
          actorUserId: driverId,
          actorRole: 'driver',
          targetType: 'ride',
          targetId: rideId,
          rideId,
          driverId,
          metadata: {
            reason: err.message,
          },
          req,
        });
      } catch (auditError) {
        console.error('[Rides] Failed to log blocked acceptance audit event:', auditError);
      }

      return res.status(403).json({
        success: false,
        error: err.message || 'Driver is not eligible to accept rides',
      });
    }

    /**
     * Unknown error: log and return 500
     */
    console.error('[Rides] Accept error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to accept ride',
    });
  }
});

/**
 * POST /api/rides/:id/start
 *
 * Driver starts a ride.
 * **CRITICAL:** Escrow must be FUNDED before ride can start.
 *
 * This enforces the economic invariant:
 * A ride may enter IN_PROGRESS only if payment is secured.
 *
 * Calls:
 * 1. Lock ride row (FOR UPDATE)
 * 2. Verify status = ACCEPTED
 * 3. Verify driverId matches (authorization)
 * 4. Check escrowStatus = 'locked' (payment secured)
 * 5. Transition to IN_PROGRESS
 *
 * Auth: requireAuth + requireWallet + requireSIWE
 * (Money path: signature required + wallet verified)
 *
 * Response:
 * - 200: Ride started successfully
 * - 402: Escrow not funded (PAYMENT_REQUIRED)
 * - 403: Not authorized to start this ride
 * - 404: Ride not found
 * - 409: Ride not in ACCEPTED state
 * - 500: Database error
 */
router.post(
  '/api/rides/:id/start',
  requireAuth,
  requireWallet,
  requireSIWE,
  async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const rideId = req.params.id;
      const driverId = req.user.userId;

      // Validate rideId is UUID-like
      if (!rideId || rideId.length < 36) {
        return res.status(400).json({ error: 'Invalid ride ID' });
      }

      const ride = await storage.getRide(rideId);
      if (!ride) {
        return res.status(404).json({
          success: false,
          error: 'Ride not found',
        });
      }

      const eligibility = getRideStartEligibility(ride, driverId, req.user.walletAddress);
      if (!eligibility.ok) {
        const current = "current" in eligibility ? eligibility.current : undefined;
        if (eligibility.code === 'not_authorized' || eligibility.code === 'wallet_mismatch') {
          return res.status(403).json({
            success: false,
            error: 'Not the assigned driver',
          });
        }

        if (eligibility.code === 'invalid_state') {
          return res.status(409).json({
            success: false,
            error: `Ride cannot be started from status: ${current}`,
          });
        }

        return res.status(402).json({
          success: false,
          error: 'Escrow not confirmed',
          code: 'ESCROW_REQUIRED',
          escrowStatus: current,
        });
      }

      const updatedRide = await storage.updateRide(rideId, {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      } as any);

      if (!updatedRide) {
        return res.status(500).json({
          success: false,
          error: 'Failed to start ride',
        });
      }

      /**
       * Success: return ride details
       */
      return res.status(200).json({
        success: true,
        data: {
          rideId: updatedRide.id,
          driverId: updatedRide.driverId,
          status: updatedRide.status,
          startedAt: updatedRide.startedAt,
        },
      });
    } catch (err) {
      /**
       * Unknown error: log and return 500
       */
      console.error('[Rides] Start error:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to start ride',
      });
    }
  }
);

export default router;
