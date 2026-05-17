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
  RideAlreadyAcceptedError,
  RideNotFoundError,
} from '../services/rideAcceptance';
import { db } from '../db/client';
import { rides } from '@shared/schema';
import { eq } from 'drizzle-orm';

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
router.post('/api/rides/:id/accept', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const driverId = req.user.userId;
    const rideId = req.params.id;

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

      /**
       * Transaction: Atomically verify all conditions and update state
       * Uses FOR UPDATE lock to prevent race conditions
       */
      const result = await db.transaction(async (tx) => {
        /**
         * 1. Lock ride row
         * Prevents concurrent start attempts
         */
        const rideResult = await tx
          .select()
          .from(rides)
          .where(eq(rides.id, rideId))
          .for('update');

        if (rideResult.length === 0) {
          return { error: 'not_found' };
        }

        const ride = rideResult[0];

        /**
         * 2. Authorization check
         * Only the assigned driver can start the ride
         */
        if (ride.driverId !== driverId) {
          return { error: 'not_authorized' };
        }

        /**
         * 3. State check
         * Ride must be ACCEPTED before it can be started
         */
        if (ride.status !== 'ACCEPTED') {
          return { error: 'invalid_state', current: ride.status };
        }

        /**
         * 4. CRITICAL: Escrow check
         * This is the economic invariant enforcement.
         * Payment MUST be locked before the ride starts.
         */
        if (ride.escrowStatus !== 'locked') {
          return {
            error: 'escrow_not_funded',
            current: ride.escrowStatus,
            code: 'ESCROW_REQUIRED',
          };
        }

        /**
         * 5. State transition
         * Update ride to IN_PROGRESS and record the start time
         */
        const updatedRides = await tx
          .update(rides)
          .set({
            status: 'IN_PROGRESS',
            startedAt: new Date(),
          })
          .where(eq(rides.id, rideId))
          .returning();

        if (updatedRides.length === 0) {
          return { error: 'update_failed' };
        }

        return { success: true, ride: updatedRides[0] };
      });

      /**
       * Handle transaction results
       */
      if (result.error === 'not_found') {
        return res.status(404).json({
          success: false,
          error: 'Ride not found',
        });
      }

      if (result.error === 'not_authorized') {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to start this ride',
        });
      }

      if (result.error === 'invalid_state') {
        return res.status(409).json({
          success: false,
          error: `Ride cannot be started from status: ${result.current}`,
        });
      }

      if (result.error === 'escrow_not_funded') {
        return res.status(402).json({
          success: false,
          error: 'Escrow not funded',
          code: result.code,
          escrowStatus: result.current,
        });
      }

      if (result.error === 'update_failed') {
        return res.status(500).json({
          success: false,
          error: 'Failed to start ride',
        });
      }

      // Type guard: success case
      if (!result.success || !result.ride) {
        return res.status(500).json({
          success: false,
          error: 'Unexpected state',
        });
      }

      /**
       * Success: return ride details
       */
      return res.status(200).json({
        success: true,
        data: {
          rideId: result.ride.id,
          driverId: result.ride.driverId,
          status: result.ride.status,
          startedAt: result.ride.startedAt,
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
