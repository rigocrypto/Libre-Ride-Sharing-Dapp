/**
 * SIWE (Sign-In With Ethereum) Routes
 * 
 * EIP-4361 compliant wallet-based authentication upgrade.
 * 
 * Flow:
 * 1. User is authenticated via Firebase (has firebaseUid)
 * 2. User has verified wallet linked (walletAddress exists)
 * 3. Backend generates SIWE message with nonce
 * 4. User signs SIWE message with wallet
 * 5. Backend verifies signature and binds SIWE session
 * 
 * SIWE augments Firebase auth - it doesn't replace it.
 * Firebase remains the primary session authority.
 */

import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireWallet } from '../middleware/auth';
import { storage } from '../storage-factory';
import crypto from 'node:crypto';
import { recoverMessageAddress } from 'viem';
import { db } from '../db/client';
import { authEvents } from '../db/schema/authEvents';

const router = Router();

/**
 * Get domain from environment or default to localhost in dev
 */
function getDomain(): string {
  if (process.env.SIWE_DOMAIN) {
    return process.env.SIWE_DOMAIN;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SIWE_DOMAIN must be set in production');
  }
  return 'localhost:5000';
}

/**
 * Get chain ID from environment or default to Base Sepolia (84532)
 */
function getChainId(): number {
  if (process.env.SIWE_CHAIN_ID) {
    return parseInt(process.env.SIWE_CHAIN_ID, 10);
  }
  // Default to Base Sepolia for development
  return 84532;
}

/**
 * Format SIWE message according to EIP-4361
 * 
 * Format:
 * {domain} wants you to sign in with your Ethereum account:
 * {address}
 * 
 * {statement}
 * 
 * URI: {uri}
 * Version: {version}
 * Chain ID: {chainId}
 * Nonce: {nonce}
 * Issued At: {issuedAt}
 */
function formatSIWEMessage(params: {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
}): string {
  const {
    domain,
    address,
    statement,
    uri,
    version,
    chainId,
    nonce,
    issuedAt,
  } = params;

  return `${domain} wants you to sign in with your Ethereum account:
${address}

${statement}

URI: ${uri}
Version: ${version}
Chain ID: ${chainId}
Nonce: ${nonce}
Issued At: ${issuedAt}`;
}

/**
 * POST /api/auth/siwe/start
 * 
 * Generate a SIWE message for the user to sign.
 * 
 * Requires:
 * - Firebase authentication (requireAuth)
 * - Verified wallet (requireWallet)
 * 
 * Returns: { message, nonce, domain, chainId }
 */
router.post('/api/auth/siwe/start', requireAuth, requireWallet, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { firebaseUid, walletAddress } = req.user;
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet not linked' });
    }

    // Get user to verify wallet is actually verified
    const user = await storage.getUserByFirebaseUid(firebaseUid);
    if (!user || !user.walletAddress || !(user as any).walletVerifiedAt) {
      return res.status(400).json({ error: 'Wallet not verified' });
    }

    // Generate cryptographically secure nonce
    const nonce = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store nonce in database (reuse wallet nonce system)
    if (storage.setWalletNonce) {
      await storage.setWalletNonce(firebaseUid, nonce, expiresAt);
    } else {
      console.warn('[SIWE] Storage does not support persistent nonces');
      return res.status(500).json({ error: 'Nonce storage not available' });
    }

    // Build SIWE message parameters
    const domain = getDomain();
    const chainId = getChainId();
    const uri = process.env.SIWE_URI || (process.env.NODE_ENV === 'production' 
      ? `https://${domain}` 
      : `http://${domain}`);
    const version = '1';
    const issuedAt = new Date().toISOString();
    const statement = 'Sign in with Ethereum to Libre RideShare. This will grant your wallet additional privileges for escrow, payouts, and admin actions.';

    // Format SIWE message
    const message = formatSIWEMessage({
      domain,
      address: walletAddress,
      statement,
      uri,
      version,
      chainId,
      nonce,
      issuedAt,
    });

    res.json({
      message,
      nonce,
      domain,
      chainId,
      uri,
      version,
      issuedAt,
    });
  } catch (error: any) {
    console.error('[SIWE] Failed to generate SIWE message:', error);
    res.status(500).json({ error: 'Failed to generate SIWE message' });
  }
});

/**
 * POST /api/auth/siwe/verify
 * 
 * Verify a signed SIWE message and bind SIWE session to user.
 * 
 * Requires:
 * - Firebase authentication (requireAuth)
 * - Verified wallet (requireWallet)
 * 
 * Body: { message, signature }
 * 
 * Verifies:
 * - Nonce is valid and not expired
 * - Signature matches wallet address
 * - Message fields match expected values
 * - Chain ID matches configured chain
 */
router.post('/api/auth/siwe/verify', requireAuth, requireWallet, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { firebaseUid, userId, walletAddress } = req.user;
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet not linked' });
    }

    const { message, signature } = z.object({
      message: z.string(),
      signature: z.string().regex(/^0x[a-fA-F0-9]{130}$/), // 65 bytes hex
    }).parse(req.body);

    // Get stored nonce from database
    const storedNonce = storage.getWalletNonce 
      ? await storage.getWalletNonce(firebaseUid)
      : null;
    
    if (!storedNonce) {
      // Log failed attempt
      try {
        await db.insert(authEvents).values({
          userId,
          eventType: 'siwe_failed',
          metadata: {
            reason: 'nonce_expired',
            walletAddress,
            ipAddress: req.ip || req.socket.remoteAddress || undefined,
          },
        } as any);
      } catch (auditError) {
        console.error('[SIWE] Failed to log audit event:', auditError);
      }

      return res.status(400).json({ error: 'Nonce expired or not found' });
    }

    // Parse SIWE message to extract fields
    const messageLines = message.split('\n');
    let extractedAddress: string | null = null;
    let extractedNonce: string | null = null;
    let extractedChainId: number | null = null;
    let extractedDomain: string | null = null;

    // Extract address (second line after "wants you to sign in...")
    for (let i = 0; i < messageLines.length; i++) {
      const line = messageLines[i].trim();
      if (line.startsWith('0x') && line.length === 42) {
        extractedAddress = line;
      }
      if (line.startsWith('Nonce: ')) {
        extractedNonce = line.replace('Nonce: ', '').trim();
      }
      if (line.startsWith('Chain ID: ')) {
        extractedChainId = parseInt(line.replace('Chain ID: ', '').trim(), 10);
      }
      if (line.includes(' wants you to sign in')) {
        extractedDomain = line.split(' wants')[0].trim();
      }
    }

    // Validate extracted fields
    if (!extractedAddress || !extractedNonce || extractedChainId === null || !extractedDomain) {
      return res.status(400).json({ 
        error: 'Invalid SIWE message format',
        details: 'Message must follow EIP-4361 format'
      });
    }

    // Verify nonce matches
    if (extractedNonce !== storedNonce) {
      // Log failed attempt
      try {
        await db.insert(authEvents).values({
          userId,
          eventType: 'siwe_failed',
          metadata: {
            reason: 'nonce_mismatch',
            walletAddress,
            expectedNonce: storedNonce,
            providedNonce: extractedNonce,
          },
        } as any);
      } catch (auditError) {
        console.error('[SIWE] Failed to log audit event:', auditError);
      }

      return res.status(400).json({ error: 'Nonce mismatch' });
    }

    // Verify address matches user's wallet
    if (extractedAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(400).json({ 
        error: 'Address mismatch',
        details: 'Message address does not match your linked wallet'
      });
    }

    // Verify chain ID matches configured chain
    const expectedChainId = getChainId();
    if (extractedChainId !== expectedChainId) {
      return res.status(400).json({ 
        error: 'Chain ID mismatch',
        details: `Expected chain ID ${expectedChainId}, got ${extractedChainId}`
      });
    }

    // Verify domain matches
    const expectedDomain = getDomain();
    if (extractedDomain !== expectedDomain) {
      return res.status(400).json({ 
        error: 'Domain mismatch',
        details: `Expected domain ${expectedDomain}, got ${extractedDomain}`
      });
    }

    // Verify signature using viem
    try {
      const recoveredAddress = await recoverMessageAddress({
        message,
        signature: signature as `0x${string}`,
      });

      // Ensure recovered address matches
      const recoveredAddressStr = typeof recoveredAddress === 'string' 
        ? recoveredAddress 
        : String(recoveredAddress);

      if (recoveredAddressStr.toLowerCase() !== walletAddress.toLowerCase()) {
        // Log failed attempt
        try {
          await db.insert(authEvents).values({
            userId,
            eventType: 'siwe_failed',
            metadata: {
              reason: 'signature_invalid',
              walletAddress,
              recoveredAddress: recoveredAddressStr,
            },
          } as any);
        } catch (auditError) {
          console.error('[SIWE] Failed to log audit event:', auditError);
        }

        return res.status(400).json({ 
          error: 'Invalid signature',
          details: 'Recovered address does not match wallet address'
        });
      }
    } catch (verifyError: any) {
      console.error('[SIWE] Signature verification failed:', verifyError);
      
      // Log failed attempt
      try {
        await db.insert(authEvents).values({
          userId,
          eventType: 'siwe_failed',
          metadata: {
            reason: 'signature_verification_error',
            walletAddress,
            error: verifyError.message,
          },
        } as any);
      } catch (auditError) {
        console.error('[SIWE] Failed to log audit event:', auditError);
      }

      return res.status(400).json({ 
        error: 'Signature verification failed',
        details: verifyError.message || 'Invalid signature format'
      });
    }

    // All checks passed - update user with SIWE verification
    try {
      const updated = await storage.updateUser(userId, {
        siweVerifiedAt: new Date() as any,
      });

      if (!updated) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Clear nonce from database
      if (storage.clearWalletNonce) {
        await storage.clearWalletNonce(firebaseUid);
      }

      // Log successful SIWE verification
      try {
        await db.insert(authEvents).values({
          userId,
          eventType: 'siwe_login',
          metadata: {
            walletAddress,
            chainId: extractedChainId,
            domain: extractedDomain,
            ipAddress: req.ip || req.socket.remoteAddress || undefined,
            userAgent: req.headers['user-agent'] || undefined,
          },
        } as any);
      } catch (auditError) {
        // Don't fail the request if audit logging fails
        console.error('[SIWE] Failed to log audit event:', auditError);
      }

      res.json({
        success: true,
        siweVerifiedAt: (updated as any).siweVerifiedAt,
        walletAddress,
      });
    } catch (dbError: any) {
      console.error('[SIWE] Failed to update user:', dbError);
      res.status(500).json({ error: 'Failed to complete SIWE verification' });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('[SIWE] Failed to verify SIWE message:', error);
    res.status(500).json({ error: 'Failed to verify SIWE message' });
  }
});

/**
 * GET /api/auth/siwe/status
 * 
 * Get SIWE verification status for authenticated user.
 * 
 * Requires: Firebase authentication (requireAuth)
 */
router.get('/api/auth/siwe/status', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await storage.getUserByFirebaseUid(req.user.firebaseUid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const siweVerifiedAt = (user as any).siweVerifiedAt;

    res.json({
      isSIWEVerified: !!siweVerifiedAt,
      siweVerifiedAt: siweVerifiedAt || null,
      walletAddress: user.walletAddress || null,
    });
  } catch (error: any) {
    console.error('[SIWE] Failed to get SIWE status:', error);
    res.status(500).json({ error: 'Failed to get SIWE status' });
  }
});

export default router;

