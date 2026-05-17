/**
 * Escrow Routes
 * 
 * Backend integration for on-chain ride escrow.
 * Manages escrow lifecycle and validates on-chain state.
 */

import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireWallet, requireSIWE } from '../middleware/auth';
import { storage } from '../storage-factory';
import { keccak256, stringToBytes } from 'viem';

const router = Router();

router.post('/api/escrow/deposit/initiate', requireAuth, requireWallet, requireSIWE, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { rideId } = z.object({
      rideId: z.string(),
    }).parse(req.body);

    const ride = await storage.getRide(rideId);
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    if (ride.riderId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized for this ride' });
    }

    if (!ride.driverId) {
      return res.status(409).json({ error: 'Driver has not accepted this ride yet' });
    }

    const rideIdHash = keccak256(stringToBytes(rideId));
    const amount = Number((ride as any).estimatedPrice || 0);

    await storage.updateRide(rideId, {
      escrowId: rideIdHash as any,
      escrowAddress: process.env.ESCROW_CONTRACT_ADDRESS as any,
      escrowStatus: 'pending' as any,
      escrowAmount: amount as any,
    });

    res.json({
      success: true,
      data: {
        rideId,
        rideIdHash,
        contractAddress: process.env.ESCROW_CONTRACT_ADDRESS || null,
        amount,
        amountWei: String(Math.round(amount * 1e6)),
        platformFeeBps: 300,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('[Escrow] Failed to initiate deposit:', error);
    res.status(500).json({ error: 'Failed to initiate escrow deposit' });
  }
});

router.post('/api/escrow/deposit/confirm', requireAuth, requireWallet, requireSIWE, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { rideId, txHash } = z.object({
      rideId: z.string(),
      txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
    }).parse(req.body);

    const ride = await storage.getRide(rideId);
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    if (ride.riderId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await storage.updateRide(rideId, {
      escrowTxHash: txHash as any,
      escrowStatus: 'locked' as any,
    });

    res.json({ success: true, data: { escrowStatus: 'locked', txHash } });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('[Escrow] Failed to confirm deposit:', error);
    res.status(500).json({ error: 'Failed to confirm escrow deposit' });
  }
});

/**
 * POST /api/escrow/deposit
 * 
 * Prepare escrow deposit (validates ride, returns contract params).
 * Actual deposit happens on-chain via frontend calling contract.deposit().
 * 
 * Requires: Authenticated rider, verified wallet, SIWE verification
 * 
 * Body: { rideId, driverAddress, amountWei, platformFeeBps? }
 * 
 * Returns: { rideIdHash, contractAddress, amountWei, platformFeeBps }
 */
router.post('/api/escrow/deposit', requireAuth, requireWallet, requireSIWE, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { rideId, driverAddress, amountWei, platformFeeBps } = z.object({
      rideId: z.string(),
      driverAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
      amountWei: z.string().regex(/^\d+$/), // Wei amount as string
      platformFeeBps: z.number().int().min(0).max(1000).optional(),
    }).parse(req.body);

    // Verify ride exists and belongs to rider
    const ride = await storage.getRide(rideId);
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    if (ride.riderId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized for this ride' });
    }

    // Verify ride is in valid state for escrow
    if (ride.status !== 'matching' && ride.status !== 'en_route') {
      return res.status(400).json({ 
        error: 'Invalid ride status',
        details: 'Escrow can only be created for rides in matching or en_route status'
      });
    }

    // Verify driver matches ride (if driver is assigned)
    if (ride.driverId) {
      // Get driver user to check wallet address
      const driverUser = await storage.getUser(ride.driverId);
      if (driverUser?.walletAddress?.toLowerCase() !== driverAddress.toLowerCase()) {
        return res.status(400).json({ error: 'Driver address mismatch' });
      }
    }

    // Verify escrow doesn't already exist
    if ((ride as any).escrowStatus && (ride as any).escrowStatus !== 'pending') {
      return res.status(400).json({ 
        error: 'Escrow already exists',
        escrowStatus: (ride as any).escrowStatus
      });
    }

    // Generate rideId hash (bytes32) for contract
    const rideIdHash = keccak256(stringToBytes(rideId));

    // Calculate platform fee (default to 300 bps = 3% if not provided)
    const feeBps = platformFeeBps ?? 300;

    // Store escrow metadata (will be updated with txHash after on-chain deposit)
    await storage.updateRide(rideId, {
      escrowId: rideIdHash as any,
      escrowAddress: process.env.ESCROW_CONTRACT_ADDRESS as any,
      escrowStatus: 'pending' as any,
      escrowAmount: parseFloat(amountWei) / 1e18 as any, // Convert wei to ETH for display
    });

    res.json({
      success: true,
      rideIdHash, // bytes32 hash for contract.deposit()
      contractAddress: process.env.ESCROW_CONTRACT_ADDRESS,
      amountWei,
      platformFeeBps: feeBps,
      message: 'Escrow prepared. Call contract.deposit(rideIdHash, driverAddress, platformFeeBps) with msg.value = amountWei',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('[Escrow] Failed to prepare deposit:', error);
    res.status(500).json({ error: 'Failed to prepare escrow deposit' });
  }
});

/**
 * POST /api/escrow/confirm
 * 
 * Confirm escrow deposit was completed on-chain.
 * Called by frontend after successful contract.deposit() transaction.
 * 
 * Requires: Authenticated rider, verified wallet, SIWE verification
 * 
 * Body: { rideId, txHash }
 */
router.post('/api/escrow/confirm', requireAuth, requireWallet, requireSIWE, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { rideId, txHash } = z.object({
      rideId: z.string(),
      txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
    }).parse(req.body);

    const ride = await storage.getRide(rideId);
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    if (ride.riderId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update ride with transaction hash and mark as funded
    await storage.updateRide(rideId, {
      escrowTxHash: txHash as any,
      escrowStatus: 'locked' as any, // Maps to FUNDED state in contract
    });

    res.json({
      success: true,
      escrowStatus: 'locked',
      txHash,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('[Escrow] Failed to confirm escrow:', error);
    res.status(500).json({ error: 'Failed to confirm escrow' });
  }
});

/**
 * POST /api/escrow/release
 * 
 * Prepare escrow release (validates ride, returns contract params).
 * Actual release happens on-chain via frontend calling contract.release().
 * 
 * Requires: Authenticated rider/driver, verified wallet, SIWE verification
 * 
 * Body: { rideId }
 * 
 * Returns: { rideIdHash, contractAddress }
 */
router.post('/api/escrow/release', requireAuth, requireWallet, requireSIWE, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { rideId } = z.object({
      rideId: z.string(),
    }).parse(req.body);

    const ride = await storage.getRide(rideId);
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Verify user has access (rider or driver)
    if (ride.riderId !== req.user.userId && ride.driverId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Verify escrow is funded
    if ((ride as any).escrowStatus !== 'locked') {
      return res.status(400).json({ 
        error: 'Invalid escrow status',
        details: 'Escrow must be locked (funded) before release'
      });
    }

    // Verify ride is completed or can be completed
    if (ride.status !== 'completed' && ride.status !== 'on_trip') {
      return res.status(400).json({ 
        error: 'Invalid ride status',
        details: 'Ride must be completed or on_trip to release escrow'
      });
    }

    // Generate rideId hash for contract
    const rideIdHash = keccak256(stringToBytes(rideId));

    res.json({
      success: true,
      rideIdHash, // bytes32 hash for contract.release()
      contractAddress: process.env.ESCROW_CONTRACT_ADDRESS,
      message: 'Escrow release prepared. Call contract.release(rideIdHash) on-chain.',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('[Escrow] Failed to prepare release:', error);
    res.status(500).json({ error: 'Failed to prepare escrow release' });
  }
});

/**
 * POST /api/escrow/confirm-release
 * 
 * Confirm escrow release was completed on-chain.
 * Called by frontend after successful contract.release() transaction.
 * 
 * Requires: Authenticated rider/driver, verified wallet, SIWE verification
 * 
 * Body: { rideId, txHash }
 */
router.post('/api/escrow/confirm-release', requireAuth, requireWallet, requireSIWE, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { rideId, txHash } = z.object({
      rideId: z.string(),
      txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
    }).parse(req.body);

    const ride = await storage.getRide(rideId);
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Verify user has access
    if (ride.riderId !== req.user.userId && ride.driverId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update ride
    await storage.updateRide(rideId, {
      escrowReleaseTxHash: txHash as any,
      escrowStatus: 'released' as any,
      status: 'completed',
    });

    res.json({
      success: true,
      escrowStatus: 'released',
      txHash,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('[Escrow] Failed to confirm release:', error);
    res.status(500).json({ error: 'Failed to confirm escrow release' });
  }
});

/**
 * POST /api/escrow/refund
 * 
 * Prepare escrow refund (validates ride, returns contract params).
 * Actual refund happens on-chain via frontend calling contract.refund().
 * 
 * Requires: Authenticated rider/driver, verified wallet, SIWE verification
 * 
 * Body: { rideId }
 * 
 * Returns: { rideIdHash, contractAddress }
 */
router.post('/api/escrow/refund', requireAuth, requireWallet, requireSIWE, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { rideId } = z.object({
      rideId: z.string(),
    }).parse(req.body);

    const ride = await storage.getRide(rideId);
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Verify user has access (rider or driver)
    if (ride.riderId !== req.user.userId && ride.driverId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Verify escrow is funded
    if ((ride as any).escrowStatus !== 'locked') {
      return res.status(400).json({ 
        error: 'Invalid escrow status',
        details: 'Escrow must be locked (funded) before refund'
      });
    }

    // Generate rideId hash for contract
    const rideIdHash = keccak256(stringToBytes(rideId));

    res.json({
      success: true,
      rideIdHash, // bytes32 hash for contract.refund()
      contractAddress: process.env.ESCROW_CONTRACT_ADDRESS,
      message: 'Escrow refund prepared. Call contract.refund(rideIdHash) on-chain.',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('[Escrow] Failed to prepare refund:', error);
    res.status(500).json({ error: 'Failed to prepare escrow refund' });
  }
});

/**
 * POST /api/escrow/confirm-refund
 * 
 * Confirm escrow refund was completed on-chain.
 * Called by frontend after successful contract.refund() transaction.
 * 
 * Requires: Authenticated rider/driver, verified wallet, SIWE verification
 * 
 * Body: { rideId, txHash }
 */
router.post('/api/escrow/confirm-refund', requireAuth, requireWallet, requireSIWE, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { rideId, txHash } = z.object({
      rideId: z.string(),
      txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
    }).parse(req.body);

    const ride = await storage.getRide(rideId);
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Verify user has access
    if (ride.riderId !== req.user.userId && ride.driverId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update ride
    await storage.updateRide(rideId, {
      escrowReleaseTxHash: txHash as any,
      escrowStatus: 'refunded' as any,
      status: 'cancelled',
    });

    res.json({
      success: true,
      escrowStatus: 'refunded',
      txHash,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('[Escrow] Failed to confirm refund:', error);
    res.status(500).json({ error: 'Failed to confirm escrow refund' });
  }
});

/**
 * POST /api/escrow/dispute
 * 
 * Prepare escrow dispute (validates ride, returns contract params).
 * Actual dispute happens on-chain via frontend calling contract.dispute().
 * 
 * Requires: Authenticated rider/driver, verified wallet, SIWE verification
 * 
 * Body: { rideId }
 * 
 * Returns: { rideIdHash, contractAddress }
 */
router.post('/api/escrow/dispute', requireAuth, requireWallet, requireSIWE, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { rideId } = z.object({
      rideId: z.string(),
    }).parse(req.body);

    const ride = await storage.getRide(rideId);
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Verify user has access (rider or driver)
    if (ride.riderId !== req.user.userId && ride.driverId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Verify escrow is funded
    if ((ride as any).escrowStatus !== 'locked') {
      return res.status(400).json({ 
        error: 'Invalid escrow status',
        details: 'Escrow must be locked (funded) before dispute'
      });
    }

    // Generate rideId hash for contract
    const rideIdHash = keccak256(stringToBytes(rideId));

    res.json({
      success: true,
      rideIdHash, // bytes32 hash for contract.dispute()
      contractAddress: process.env.ESCROW_CONTRACT_ADDRESS,
      message: 'Escrow dispute prepared. Call contract.dispute(rideIdHash) on-chain.',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('[Escrow] Failed to prepare dispute:', error);
    res.status(500).json({ error: 'Failed to prepare escrow dispute' });
  }
});

/**
 * GET /api/escrow/status/:rideId
 * 
 * Get escrow status for a ride.
 * 
 * Requires: Authenticated user (rider or driver)
 */
router.get('/api/escrow/status/:rideId', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { rideId } = z.object({
      rideId: z.string(),
    }).parse(req.params);

    const ride = await storage.getRide(rideId);
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Verify user has access to this ride
    if (ride.riderId !== req.user.userId && ride.driverId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({
      rideId,
      escrowId: (ride as any).escrowId || null,
      escrowAddress: (ride as any).escrowAddress || null,
      escrowStatus: (ride as any).escrowStatus || 'none',
      escrowAmount: (ride as any).escrowAmount || null,
      escrowTxHash: (ride as any).escrowTxHash || null,
      escrowReleaseTxHash: (ride as any).escrowReleaseTxHash || null,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('[Escrow] Failed to get escrow status:', error);
    res.status(500).json({ error: 'Failed to get escrow status' });
  }
});

export default router;
