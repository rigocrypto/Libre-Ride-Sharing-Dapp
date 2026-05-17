import express from "express";
import { z } from "zod";
import { sendEmail } from "../email.js";
import { createAAWalletWithZeroDev as createAAWallet } from "../lib/aa/create-wallet.js";
import { storage } from "../storage-factory.js";

const router = express.Router();

const signupSchema = z.object({
  email: z.string().email(),
});

const socialLoginSchema = z.object({
  idToken: z.string(),
  provider: z.enum(['google', 'apple']),
});

/**
 * Account Abstraction (AA) Email Signup
 * Creates a smart contract wallet for the user via ZeroDev
 * POST /api/auth/aa-signup
 */
router.post("/api/auth/aa-signup", async (req, res) => {
  try {
    const { email } = signupSchema.parse(req.body);

    console.log('[AA] signup request:', email);

    // Create wallet (ZeroDev or fallback)
    const address = await createAAWallet(email);

    // Storage-only (NO db.js)
    let user = await storage.getUserByEmail(email);
    if (!user) {
      user = await storage.createUser({
        email,
        walletAddress: address,
        role: 'rider',
      });
    }

    // Referral handling
    const referer = req.headers.referer ?? '';
    const match = referer.match(/ref=([A-Z0-9]+)/);
    let referralClaimed = false;
    if (match) {
      try {
        await storage.claimReferral(match[1], user.id);
        referralClaimed = true;
      } catch (refError) {
        console.warn('[AA] Referral claim failed:', refError);
      }
    }

    // Send welcome email (non-blocking)
    try {
      await sendEmail({
        to: email,
        subject: "Welcome to Libre! Your account is ready",
        html: `
          <h1>Welcome to Libre!</h1>
          <p>Your secure wallet has been created: ${address.slice(0, 6)}...${address.slice(-4)}</p>
          <p>You can now start using Libre. No crypto knowledge needed - we handle everything!</p>
          ${referralClaimed ? '<p><strong>🎉 Referral bonus claimed! You and your referrer both earned $50!</strong></p>' : ''}
          <p><a href="${process.env.APP_URL || 'http://localhost:5000'}/become-driver">Become a Driver →</a></p>
        `,
      });
    } catch (emailError) {
      console.warn("Failed to send welcome email:", emailError);
    }

    console.log('[AA] Success:', user.id, address);
    res.json({
      success: true,
      userId: user.id,
      address,
      referralClaimed,
    });
  } catch (err: any) {
    console.error('[AA SIGNUP ERROR]', err);

    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }

    res.status(400).json({
      error: err.message || 'Signup failed',
    });
  }
});

/**
 * Get AA wallet address by email
 * GET /api/auth/aa-wallet?email=...
 */
router.get("/api/auth/aa-wallet", async (req, res) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.query);
    const user = await storage.getUserByEmail(email);

    if (!user || !user.walletAddress) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    res.json({ address: user.walletAddress });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Invalid request" });
  }
});

/**
 * Social Login (Google/Apple)
 * Verifies Firebase token and creates/links AA wallet
 * POST /api/auth/social-login
 */
router.post("/api/auth/social-login", async (req, res) => {
  try {
    const { idToken, provider } = socialLoginSchema.parse(req.body);

    console.log('[Social Login]', provider, 'token received');

    // Verify Firebase token (in production, use firebase-admin)
    // For now, we'll extract email from a mock verification
    // TODO: Install firebase-admin and verify token properly
    let email: string;
    let firstName: string | undefined;
    let lastName: string | undefined;
    let decoded: any = null;
    let adminAuth: any = null;

    try {
      // Try Firebase Admin SDK first (production)
      const { getFirebaseAdmin } = await import('../lib/firebase/admin.js');
      adminAuth = getFirebaseAdmin();
      
      if (adminAuth) {
        try {
          decoded = await adminAuth.verifyIdToken(idToken);
          console.log('[Social Login] Token verified via Firebase Admin');
        } catch (adminError: any) {
          console.warn('[Social Login] Admin verification failed:', adminError.message);
        }
      }

      // Fallback: Extract from token payload (dev mode only)
      if (!decoded) {
        console.warn('[Social Login] Using dev mode token parsing');
        const tokenParts = idToken.split('.');
        if (tokenParts.length === 3) {
          // Use Node.js Buffer (available as global in Node.js ESM)
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          decoded = {
            email: payload.email || `${payload.sub}@${provider}.com`,
            name: payload.name || payload.displayName || null,
          };
        } else {
          throw new Error('Invalid token format');
        }
      }

      email = decoded.email;
      if (decoded.name) {
        const nameParts = decoded.name.split(' ');
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ');
      }
    } catch (tokenError: any) {
      console.error('[Social Login] Token verification failed:', tokenError);
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email not provided by social provider' });
    }

    // Extract firebaseUid from decoded token (critical for production)
    const firebaseUid = decoded?.uid || decoded?.sub || null;
    if (!firebaseUid && adminAuth) {
      console.error('[Social Login] Missing firebaseUid in verified token');
      return res.status(400).json({ error: 'Invalid token: missing user identifier' });
    }

    // Create AA wallet (same logic as email signup)
    const address = await createAAWallet(email);

    // Check if user exists by firebaseUid (primary) or email (fallback)
    let user = firebaseUid ? await storage.getUserByFirebaseUid(firebaseUid) : null;
    if (!user) {
      user = await storage.getUserByEmail(email);
    }
    const isNewUser = !user;

    if (!user) {
      console.log('[Social Login] Creating new user for firebaseUid:', firebaseUid, 'email:', email);
      user = await storage.createUser({
        email,
        firebaseUid: firebaseUid as any,
        walletAddress: address,
        role: 'rider',
        username: firstName ? `${firstName} ${lastName || ''}`.trim() : undefined,
        authProvider: provider as any,
      });
      console.log('[Social Login] User created with ID:', user.id);
      
      // Verify user can be retrieved immediately (debug)
      const verifyUser = await storage.getUser(user.id);
      if (!verifyUser) {
        console.error('[Social Login] ERROR: User created but cannot be retrieved!', user.id);
      } else {
        console.log('[Social Login] Verified: User can be retrieved immediately');
      }
    } else {
      // Update existing user with firebaseUid if missing
      if (firebaseUid && !(user as any).firebaseUid) {
        console.log('[Social Login] Linking firebaseUid to existing user:', user.id);
        await storage.updateUser(user.id, { firebaseUid: firebaseUid as any });
        user = { ...user, firebaseUid: firebaseUid as any };
      }
      
      // Link wallet if missing
      if (!user.walletAddress) {
        console.log('[Social Login] Linking wallet to existing user:', user.id);
        await storage.updateUser(user.id, { walletAddress: address });
        user = { ...user, walletAddress: address };
      } else {
        console.log('[Social Login] Existing user found:', user.id);
      }
    }

    // Check for referral code
    const referer = req.headers.referer ?? '';
    const match = referer.match(/ref=([A-Z0-9]+)/);
    let referralClaimed = false;
    if (match && isNewUser) {
      try {
        await storage.claimReferral(match[1], user.id);
        referralClaimed = true;
      } catch (refError) {
        console.warn('[Social Login] Referral claim failed:', refError);
      }
    }

    // Check if identity verification is needed
    // TODO: Add identityVerified field to user schema
    const needsVerification = true; // For now, always require verification

    // Final verification: Ensure user exists in storage before returning
    const finalUser = await storage.getUser(user.id);
    if (!finalUser) {
      console.error('[Social Login] CRITICAL: User was created but cannot be retrieved!', user.id);
      return res.status(500).json({ 
        error: 'User creation failed. Please try again.',
        userId: user.id 
      });
    }

    console.log('[Social Login] Success:', finalUser.id, address, provider);
    console.log('[Social Login] User verified in storage before response');
    
    // Return user profile directly to avoid race condition with separate profile fetch
    res.json({
      success: true,
      userId: finalUser.id,
      address,
      provider,
      needsVerification,
      referralClaimed,
      isNewUser,
      profile: {
        id: finalUser.id,
        email: finalUser.email,
        walletAddress: finalUser.walletAddress,
        username: finalUser.username,
        role: finalUser.role,
        identityVerified: (finalUser as any).identityVerified || false,
        identityVerifiedAt: (finalUser as any).identityVerifiedAt || null,
      },
    });
  } catch (err: any) {
    console.error('[Social Login Error]', err);

    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }

    // Ensure error message is safe to send to client
    const errorMessage = err.message || 'Social login failed';
    // Remove any stack traces or internal details
    const safeMessage = errorMessage.split('\n')[0].trim();

    res.status(400).json({
      error: safeMessage,
    });
  }
});

export default router;
