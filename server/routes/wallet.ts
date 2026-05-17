/**
 * Wallet Linking Routes
 * 
 * Secure wallet ↔ Firebase account linking via signature verification.
 * 
 * Flow:
 * 1. User logs in via Firebase (has firebaseUid)
 * 2. Backend generates nonce bound to firebaseUid
 * 3. User signs nonce with wallet
 * 4. Backend verifies signature
 * 5. Wallet address linked to user profile
 */

import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { storage } from '../storage-factory';
import crypto from 'node:crypto';
import { verifyMessage, recoverMessageAddress } from 'viem';
import { db } from '../db/client';
import { authEvents } from '../db/schema/authEvents';
import { eq } from 'drizzle-orm';

const router = Router();

// Nonces are now stored in database via DrizzleStorage
// No in-memory storage needed

/**
 * POST /api/wallet/nonce
 * 
 * Generate a nonce for wallet linking.
 * Nonce is bound to the authenticated user's firebaseUid.
 * 
 * Returns: { nonce, message }
 */
router.post('/api/wallet/nonce', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { firebaseUid } = req.user;

    // Check if user already has a verified wallet
    const user = await storage.getUserByFirebaseUid(firebaseUid);
    if (user?.walletAddress && (user as any).walletVerifiedAt) {
      return res.status(400).json({
        error: 'Wallet already linked',
        walletAddress: user.walletAddress,
      });
    }

    // Generate cryptographically secure nonce
    const nonce = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store nonce in database (persistent, survives restarts)
    if (storage.setWalletNonce) {
      await storage.setWalletNonce(firebaseUid, nonce, expiresAt);
    } else {
      // Fallback for MemStorage (shouldn't happen in production)
      console.warn('[Wallet] Storage does not support persistent nonces');
      return res.status(500).json({ error: 'Nonce storage not available' });
    }

    // Message to sign (EIP-191 format)
    const message = `Sign this message to link your wallet to Libre RideShare.\n\nNonce: ${nonce}\nFirebase UID: ${firebaseUid}`;

    res.json({
      nonce,
      message,
      expiresAt,
    });
  } catch (error: any) {
    console.error('[Wallet] Failed to generate nonce:', error);
    res.status(500).json({ error: 'Failed to generate nonce' });
  }
});

/**
 * POST /api/wallet/link
 * 
 * Link wallet address to authenticated user via signature verification.
 * 
 * Body: { signature, walletAddress }
 * 
 * Verifies:
 * - Nonce is valid and not expired
 * - Signature matches wallet address
 * - Wallet is not already linked to another account
 */
router.post('/api/wallet/link', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { firebaseUid, userId } = req.user;
    const { signature, walletAddress } = z.object({
      signature: z.string(),
      walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    }).parse(req.body);

    // Get stored nonce from database
    const storedNonce = storage.getWalletNonce 
      ? await storage.getWalletNonce(firebaseUid)
      : null;
    
    if (!storedNonce) {
      return res.status(400).json({ error: 'Nonce expired or not found' });
    }

    // Verify signature using viem (EIP-191)
    const message = `Sign this message to link your wallet to Libre RideShare.\n\nNonce: ${storedNonce}\nFirebase UID: ${firebaseUid}`;
    
    try {
      console.log('[Wallet] Verifying signature...');
      console.log('[Wallet] Message:', message);
      console.log('[Wallet] Signature:', signature);
      console.log('[Wallet] Wallet address:', walletAddress);
      
      // Recover the address from the signature
      // viem's recoverMessageAddress is synchronous and handles personal_sign format
      let recoveredAddress: string;
      
      try {
        const result = recoverMessageAddress({
          message,
          signature: signature as `0x${string}`,
        });
        
        // Handle both string and Promise<string> cases
        if (typeof result === 'string') {
          recoveredAddress = result;
        } else if (result && typeof result === 'object' && 'then' in result) {
          // It's a Promise, await it
          recoveredAddress = await result;
        } else {
          // Try to extract address from object
          recoveredAddress = (result as any)?.address || String(result);
        }
        
        // Ensure it's a valid address string
        if (typeof recoveredAddress !== 'string' || !recoveredAddress.startsWith('0x')) {
          throw new Error(`Invalid recovered address type: ${typeof recoveredAddress}, value: ${recoveredAddress}`);
        }
      } catch (recoverError: any) {
        console.error('[Wallet] Address recovery failed:', recoverError);
        throw new Error(`Failed to recover address: ${recoverError.message}`);
      }

      console.log('[Wallet] Recovered address:', recoveredAddress);
      console.log('[Wallet] Provided address:', walletAddress);
      console.log('[Wallet] Addresses match:', recoveredAddress.toLowerCase() === walletAddress.toLowerCase());

      // Compare recovered address with provided wallet address (case-insensitive)
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        console.warn('[Wallet] Signature mismatch:', {
          recovered: recoveredAddress,
          provided: walletAddress,
          recoveredLower: recoveredAddress.toLowerCase(),
          providedLower: walletAddress.toLowerCase(),
        });
        return res.status(400).json({ 
          error: 'Invalid signature: recovered address does not match wallet address',
          details: {
            recovered: recoveredAddress,
            provided: walletAddress,
          }
        });
      }
      
      console.log('[Wallet] ✅ Signature verified successfully');
    } catch (verifyError: any) {
      console.error('[Wallet] ❌ Signature verification failed:', verifyError);
      console.error('[Wallet] Error details:', {
        message: verifyError.message,
        stack: verifyError.stack,
        name: verifyError.name,
        cause: verifyError.cause,
      });
      return res.status(400).json({ 
        error: 'Invalid signature',
        details: verifyError.message || 'Signature verification failed'
      });
    }

    // Check if wallet is already linked to another account (server-side check before DB write)
    const existingUser = await storage.getUserByWallet(walletAddress);
    if (existingUser && existingUser.id !== userId) {
      // Log failed attempt
      try {
        await db.insert(authEvents).values({
          userId,
          eventType: 'wallet_link_attempt',
          metadata: {
            walletAddress,
            error: 'Wallet already linked to another account',
            ipAddress: req.ip || req.socket.remoteAddress || undefined,
          },
        });
      } catch (auditError) {
        // Don't fail the request if audit logging fails
        console.error('[Wallet] Failed to log audit event:', auditError);
      }

      return res.status(409).json({
        error: 'Wallet already linked',
        message: 'This wallet is already linked to another account. Each wallet can only be linked to one account.',
        code: 'WALLET_ALREADY_LINKED',
      });
    }

    // Link wallet to user
    try {
      const updated = await storage.updateUser(userId, {
        walletAddress,
        walletVerifiedAt: new Date() as any,
      });

      if (!updated) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Clear nonce from database
      if (storage.clearWalletNonce) {
        await storage.clearWalletNonce(firebaseUid);
      }

      // Log successful wallet link
      try {
        await db.insert(authEvents).values({
          userId,
          eventType: 'wallet_linked',
          metadata: {
            walletAddress,
            ipAddress: req.ip || req.socket.remoteAddress || undefined,
            userAgent: req.headers['user-agent'] || undefined,
          },
        });
      } catch (auditError) {
        // Don't fail the request if audit logging fails
        console.error('[Wallet] Failed to log audit event:', auditError);
      }

      res.json({
        success: true,
        walletAddress,
        walletVerifiedAt: (updated as any).walletVerifiedAt,
      });
    } catch (dbError: any) {
      // Handle database constraint violations (unique constraint)
      if (dbError.code === '23505' || dbError.constraint === 'users_wallet_address_unique') {
        // Log failed attempt due to DB constraint
        try {
          await db.insert(authEvents).values({
            userId,
            eventType: 'wallet_link_attempt',
            metadata: {
              walletAddress,
              error: 'Database unique constraint violation',
            },
          });
        } catch (auditError) {
          console.error('[Wallet] Failed to log audit event:', auditError);
        }

        return res.status(409).json({
          error: 'Wallet already linked',
          message: 'This wallet is already linked to another account. Each wallet can only be linked to one account.',
          code: 'WALLET_ALREADY_LINKED',
        });
      }
      // Re-throw other database errors
      throw dbError;
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('[Wallet] Failed to link wallet:', error);
    res.status(500).json({ error: 'Failed to link wallet' });
  }
});

/**
 * GET /api/wallet/status
 * 
 * Get wallet linking status for authenticated user.
 */
router.get('/api/wallet/status', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await storage.getUserByFirebaseUid(req.user.firebaseUid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const walletVerifiedAt = (user as any).walletVerifiedAt;

    res.json({
      walletAddress: user.walletAddress || null,
      isLinked: !!user.walletAddress && !!walletVerifiedAt,
      walletVerifiedAt: walletVerifiedAt || null,
    });
  } catch (error: any) {
    console.error('[Wallet] Failed to get wallet status:', error);
    res.status(500).json({ error: 'Failed to get wallet status' });
  }
});

export default router;

