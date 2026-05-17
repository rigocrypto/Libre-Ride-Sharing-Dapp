/**
 * Authentication Middleware
 * 
 * Production-grade token verification for all authenticated endpoints.
 * Verifies Firebase ID tokens and attaches user context to requests.
 * 
 * SECURITY: Never trusts client-provided userId. Always extracts from verified token.
 */

import { Request, Response, NextFunction } from 'express';
import { getFirebaseAdmin } from '../lib/firebase/admin';
import { storage } from '../storage-factory';

// Extend Express Request type to include authenticated user
declare global {
      namespace Express {
    interface Request {
      user?: {
        firebaseUid: string;
        userId: string;
        email: string | null;
        role: string;
        walletAddress?: string; // Set by requireWallet middleware
        walletVerifiedAt?: Date | string; // Set by requireWallet middleware
        siweVerifiedAt?: Date | string; // Set by requireSIWE middleware
      };
    }
  }
}

/**
 * Extract Firebase ID token from Authorization header
 * Supports: "Bearer <token>" or just "<token>"
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  
  // Support both "Bearer <token>" and direct token
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return authHeader;
}

/**
 * Require authentication middleware
 * 
 * Verifies Firebase ID token and attaches user to req.user
 * 
 * In production: Requires valid Firebase Admin SDK
 * In development: Falls back to dev mode if Admin SDK not configured
 * 
 * @throws 401 if token is missing or invalid
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const isProduction = process.env.NODE_ENV === 'production';
  const adminAuth = getFirebaseAdmin();

  // In production, Firebase Admin MUST be configured
  if (isProduction && !adminAuth) {
    console.error('[Auth] FATAL: Firebase Admin not configured in production!');
    res.status(500).json({
      error: 'Server configuration error',
      message: 'Authentication service unavailable',
    });
    return;
  }

  const token = extractToken(req);

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing authentication token',
    });
    return;
  }

  // Dev token override: allow seeded dev tokens (e.g., 'dev-token') to be
  // recognized in local development even if Firebase Admin SDK is present.
  // This keeps E2E tests deterministic while preserving production security.
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { getDevUser } = await import('../lib/devAuth');
      const devUser = getDevUser(token);
      if (devUser) {
        console.log('[Auth] Dev token mapped to user:', devUser.userId);
        req.user = {
          firebaseUid: devUser.firebaseUid,
          userId: devUser.userId,
          email: devUser.email || null,
          role: devUser.role || 'rider',
          walletAddress: devUser.walletAddress,
          walletVerifiedAt: devUser.walletVerifiedAt as any,
          siweVerifiedAt: devUser.siweVerifiedAt as any,
        } as any;
        next();
        return;
      }
    } catch (err: any) {
      console.warn('[Auth] Dev token check failed:', err?.message || err);
    }
  }

  // Dev mode fallback (only if Admin SDK not configured)
  if (!adminAuth) {
    // In dev mode, try to map a provided dev token to a seeded user so endpoints
    // that rely on req.user will work. If no dev token mapping exists, fall back
    // to a permissive skip (previous behavior) but warn.
    try {
      const token = extractToken(req);
      if (token) {
        const { getDevUser } = await import('../lib/devAuth');
        const devUser = getDevUser(token);
        if (devUser) {
          req.user = {
            firebaseUid: devUser.firebaseUid,
            userId: devUser.userId,
            email: devUser.email || null,
            role: devUser.role || 'rider',
            walletAddress: devUser.walletAddress,
            walletVerifiedAt: devUser.walletVerifiedAt as any,
            siweVerifiedAt: devUser.siweVerifiedAt as any,
          } as any;
          next();
          return;
        }
      }
    } catch (err: any) {
      console.warn('[Auth] Dev mode: dev token resolution failed:', err?.message || err);
    }

    console.warn('[Auth] Dev mode: Skipping token verification');
    // In dev mode, we still need to extract user info from token payload
    // For now, allow request but log warning
    next();
    return;
  }

  try {
    // Verify Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Extract user info from token
    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email || null;

    // Lookup user in database by firebaseUid
    // Note: This requires storage to have getUserByFirebaseUid method
    if (!storage.getUserByFirebaseUid) {
      console.error('[Auth] Storage does not support getUserByFirebaseUid');
      res.status(500).json({
        error: 'Server configuration error',
        message: 'User lookup not available',
      });
      return;
    }

    console.log('[Auth] Looking up user for firebaseUid:', firebaseUid);
    console.log('[Auth] Storage instance type:', storage.constructor.name);
    
    const user = await storage.getUserByFirebaseUid(firebaseUid);

    if (!user) {
      console.warn('[Auth] User not found for firebaseUid:', firebaseUid);
      console.warn('[Auth] Storage type:', storage.constructor.name);
      console.warn('[Auth] This usually means the user was not created during social login, or storage instance mismatch');
      
      // Try to verify user exists in database directly (debug)
      try {
        const allUsers = await (storage as any).getAllUsers?.();
        if (allUsers) {
          console.log('[Auth] All users in storage:', allUsers.map((u: any) => ({ id: u.id, firebaseUid: u.firebaseUid, email: u.email })));
        }
      } catch (e) {
        // Ignore debug errors
      }
      
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User profile not found. Please try logging in again.',
      });
      return;
    }
    
    console.log('[Auth] User found:', { id: user.id, email: user.email, firebaseUid: (user as any).firebaseUid });

    // Attach user to request
    req.user = {
      firebaseUid,
      userId: user.id,
      email: user.email || email,
      role: user.role || 'rider',
    };

    next();
  } catch (error: any) {
    console.error('[Auth] Token verification failed:', error.message);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/id-token-expired') {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expired',
      });
      return;
    }

    if (error.code === 'auth/id-token-revoked') {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Token revoked',
      });
      return;
    }

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid authentication token',
    });
  }
}

/**
 * Optional authentication middleware
 * 
 * Attaches user if token is present and valid, but doesn't require it.
 * Useful for endpoints that work for both authenticated and anonymous users.
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req);
  
  if (!token) {
    // No token, continue without user
    next();
    return;
  }

  // Try to verify and attach user, but don't fail if it doesn't work
  try {
    await requireAuth(req, res, next);
  } catch {
    // If auth fails, continue without user
    next();
  }
}

/**
 * Require specific role middleware
 * 
 * Must be used AFTER requireAuth
 * 
 * @param allowedRoles Array of roles that can access this endpoint
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      });
      return;
    }

    next();
  };
}

/**
 * Require wallet verification middleware
 * 
 * Must be used AFTER requireAuth.
 * Ensures user has a verified wallet linked to their account.
 * 
 * @throws 403 if wallet is not verified
 */
export async function requireWallet(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
    return;
  }

  try {
    const user = await storage.getUserByFirebaseUid(req.user.firebaseUid);
    
    if (!user) {
      res.status(404).json({
        error: 'User not found',
        message: 'User profile not found',
      });
      return;
    }

    const walletVerifiedAt = (user as any).walletVerifiedAt;
    const walletAddress = user.walletAddress;

    if (!walletAddress || !walletVerifiedAt) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Wallet verification required. Please link and verify your wallet first.',
        details: {
          hasWallet: !!walletAddress,
          isVerified: !!walletVerifiedAt,
        },
      });
      return;
    }

    // Attach wallet info to request for convenience
    (req.user as any).walletAddress = walletAddress;
    (req.user as any).walletVerifiedAt = walletVerifiedAt;

    next();
  } catch (error: any) {
    console.error('[Auth] Failed to check wallet verification:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to verify wallet status',
    });
  }
}

/**
 * Require identity verification middleware
 * 
 * Must be used AFTER requireAuth.
 * Ensures user has completed identity verification (Persona/KYC).
 * 
 * In development: Can be bypassed via SKIP_IDENTITY_CHECK=true
 * 
 * @throws 403 if identity is not verified
 */
export async function requireIdentity(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
    return;
  }

  // Development bypass (explicit env flag)
  const skipInDev = process.env.NODE_ENV === 'development' && process.env.SKIP_IDENTITY_CHECK === 'true';
  if (skipInDev) {
    console.log('[Auth] Dev mode: Skipping identity verification (SKIP_IDENTITY_CHECK=true)');
    next();
    return;
  }

  try {
    const user = await storage.getUserByFirebaseUid(req.user.firebaseUid);
    
    if (!user) {
      res.status(404).json({
        error: 'User not found',
        message: 'User profile not found',
      });
      return;
    }

    const identityVerified = (user as any).identityVerified || false;
    const identityVerifiedAt = (user as any).identityVerifiedAt;

    if (!identityVerified || !identityVerifiedAt) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Identity verification required. Please complete identity verification first.',
        code: 'IDENTITY_NOT_VERIFIED',
        details: {
          isVerified: identityVerified,
          verifiedAt: identityVerifiedAt,
        },
      });
      return;
    }

    // Attach identity info to request for convenience
    (req.user as any).identityVerified = identityVerified;
    (req.user as any).identityVerifiedAt = identityVerifiedAt;

    next();
  } catch (error: any) {
    console.error('[Auth] Failed to check identity verification:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to verify identity status',
    });
  }
}

/**
 * Require SIWE verification middleware
 * 
 * Must be used AFTER requireAuth and requireWallet.
 * Ensures user has completed SIWE (Sign-In With Ethereum) verification.
 * 
 * SIWE is required for privileged actions like:
 * - Escrow deposits/releases
 * - Admin actions
 * - High-value transactions
 * 
 * @throws 403 if SIWE is not verified
 */
export async function requireSIWE(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
    return;
  }

  try {
    const user = await storage.getUserByFirebaseUid(req.user.firebaseUid);
    
    if (!user) {
      res.status(404).json({
        error: 'User not found',
        message: 'User profile not found',
      });
      return;
    }

    const siweVerifiedAt = (user as any).siweVerifiedAt;

    if (!siweVerifiedAt) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'SIWE verification required. Please complete Sign-In With Ethereum first.',
        code: 'SIWE_NOT_VERIFIED',
        details: {
          isSIWEVerified: false,
        },
      });
      return;
    }

    // Attach SIWE info to request for convenience
    (req.user as any).siweVerifiedAt = siweVerifiedAt;

    next();
  } catch (error: any) {
    console.error('[Auth] Failed to check SIWE verification:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to verify SIWE status',
    });
  }
}

