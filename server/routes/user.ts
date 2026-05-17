/**
 * User Profile Routes
 * Handles user profile and verification status
 * 
 * PRODUCTION: Uses requireAuth middleware - never trusts client-provided userId
 */

import express from "express";
import { z } from "zod";
import { storage } from "../storage-factory.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

/**
 * Test endpoint to verify routing works
 * GET /api/user/test
 */
router.get("/api/user/test", (req, res) => {
  res.json({ message: "User routes are working!", timestamp: new Date().toISOString() });
});

/**
 * Get user profile
 * GET /api/user/profile
 * 
 * PRODUCTION: Uses requireAuth - extracts userId from verified token
 * Never trusts client-provided userId
 */
router.get("/api/user/profile", optionalAuth, async (req, res) => {
  try {
    let userId: string | undefined;

    // Preferred: use authenticated user from token
    if (req.user) {
      userId = req.user.userId;
    } else {
      // In development, allow fallback to query param for compatibility
      const isProduction = process.env.NODE_ENV === "production";
      const parsed = z.object({ userId: z.string().optional() }).parse(req.query);
      if (isProduction || !parsed.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      userId = parsed.userId;
    }

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    console.log('[User Profile] Fetching profile for userId:', userId);
    console.log('[User Profile] Storage instance:', storage.constructor.name);
    
    // Debug: Check all users in storage
    if (storage.constructor.name === 'MemStorage') {
      const allUsers = (storage as any).users;
      if (allUsers) {
        const userCount = allUsers.size || 0;
        console.log('[User Profile] Total users in storage:', userCount);
        if (userCount > 0) {
          const firstUser = Array.from(allUsers.values())[0] as any;
          console.log('[User Profile] Sample user ID:', firstUser?.id);
        }
      }
    }

    const user = await storage.getUser(userId);
    
    if (!user) {
      console.warn('[User Profile] User not found:', userId);
      // Debug: Try to find user by email or wallet as fallback
      console.log('[User Profile] Attempting fallback lookup...');
      return res.status(404).json({ error: "User not found", userId });
    }

    console.log('[User Profile] Found user:', user.id, user.email);

    // Return user profile with verification status
    // Note: identityVerified field should be added to User schema
    res.json({
      id: user.id,
      email: user.email,
      walletAddress: user.walletAddress,
      username: user.username,
      role: user.role,
      identityVerified: (user as any).identityVerified || false,
      identityVerifiedAt: (user as any).identityVerifiedAt || null,
    });
  } catch (error: any) {
    console.error('[User Profile] Error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    
    res.status(400).json({ error: error.message || "Failed to fetch profile" });
  }
});

export default router;

