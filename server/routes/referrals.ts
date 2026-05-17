import express from "express";
import { z } from "zod";
import { sendReferralBonus } from "../payments/referral-bonus.js";
import { storage } from "../storage-factory.js";

const router = express.Router();

/**
 * Generate a unique referral code for a user
 * Format: LIBRE{userId.slice(0,6).toUpperCase()}
 */
function generateReferralCode(userId: string): string {
  // Use first 6 chars of userId, or generate random if needed
  const shortId = userId.slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `LIBRE${shortId}`;
}

/**
 * Create or get referral code for a user
 * POST /api/referrals/create
 */
router.post("/api/referrals/create", async (req, res) => {
  try {
    const { userId } = z.object({ userId: z.string() }).parse(req.body);

    // Check if user exists
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate referral code
    const code = generateReferralCode(userId);

    // Check if referral code already exists
    const existing = await storage.getReferralByCode(code);
    
    if (!existing) {
      // Create referral record
      await storage.createReferral({
        referrerId: userId,
        referralCode: code,
        rewardAmount: 50.0,
        claimed: false,
      });
    }

    res.json({ 
      code,
      message: "Referral code created",
      shareUrl: `${process.env.APP_URL || 'http://localhost:5000'}/become-driver?ref=${code}`
    });
  } catch (error: any) {
    console.error("[referrals/create]", error);
    res.status(400).json({ error: error.message || "Failed to create referral code" });
  }
});

/**
 * Claim referral bonus when a new user signs up with a referral code
 * POST /api/referrals/claim
 */
router.post("/api/referrals/claim", async (req, res) => {
  try {
    const { code, newUserId } = z.object({ 
      code: z.string(),
      newUserId: z.string()
    }).parse(req.body);

    // Find referral by code
    const referral = await storage.getReferralByCode(code);
    
    if (!referral) {
      return res.status(404).json({ error: "Invalid referral code" });
    }

    // Check if already claimed
    if (referral.claimed) {
      return res.status(400).json({ error: "Referral already claimed" });
    }

    // Check if new user exists
    const newUser = await storage.getUser(newUserId);
    if (!newUser) {
      return res.status(404).json({ error: "New user not found" });
    }

    // Get referrer's wallet address
    const referrer = await storage.getUser(referral.referrerId);

    if (!referrer || !referrer.walletAddress) {
      return res.status(400).json({ 
        error: "Referrer wallet address not found. Please ensure referrer has connected wallet." 
      });
    }

    // Claim referral (updates referredUserId and claimed flag)
    const claimedReferral = await storage.claimReferral(code, newUserId);
    
    if (!claimedReferral) {
      return res.status(400).json({ error: "Failed to claim referral" });
    }

    // Send USDC bonus to referrer's wallet
    let txHash: string | null = null;
    let paymentError: string | null = null;
    
    try {
      txHash = await sendReferralBonus(referrer.walletAddress, referral.rewardAmount || 50);
      console.log(`[Referral] Bonus sent: $${referral.rewardAmount || 50} USDC to ${referrer.walletAddress}, tx: ${txHash}`);
    } catch (error: any) {
      console.error('[Referral] Payment failed:', error);
      paymentError = error.message;
      // Don't fail the claim if payment fails - we can retry later
    }

    // TODO: Send notification to referrer (email/SMS)
    // TODO: Send notification to new user

    const bonusAmount = referral.rewardAmount || 50;

    res.json({ 
      success: true,
      bonus: bonusAmount,
      referrerId: referral.referrerId,
      txHash,
      paymentError,
      message: txHash 
        ? `🎉 $${bonusAmount} USDC sent! Tx: ${txHash.slice(0, 10)}...`
        : `Referral bonus of $${bonusAmount} will be credited (payment ${paymentError ? 'failed, will retry' : 'pending'})`
    });
  } catch (error: any) {
    console.error("[referrals/claim]", error);
    res.status(400).json({ error: error.message || "Failed to claim referral" });
  }
});

/**
 * Get referral stats for a user
 * GET /api/referrals/stats?userId=...
 */
router.get("/api/referrals/stats", async (req, res) => {
  try {
    const { userId } = z.object({ userId: z.string() }).parse(req.query);

    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const code = generateReferralCode(userId);

    // Get referral stats
    const userReferrals = await storage.getReferralsByUser(userId);

    const totalReferrals = userReferrals.filter(r => r.claimed).length;
    const totalEarned = userReferrals
      .filter(r => r.claimed)
      .reduce((sum, r) => sum + (r.rewardAmount || 0), 0);
    const pendingBonus = userReferrals
      .filter(r => !r.claimed)
      .reduce((sum, r) => sum + (r.rewardAmount || 0), 0);

    // Get recent referral transactions
    const recentReferrals = userReferrals
      .filter(r => r.claimed)
      .slice(-5)
      .map(r => ({
        code: r.referralCode,
        claimed: r.claimed,
        rewardAmount: r.rewardAmount,
      }));

    res.json({
      code,
      totalReferrals,
      totalEarned,
      pendingBonus,
      recentReferrals,
      shareUrl: `${process.env.APP_URL || 'http://localhost:5000'}/become-driver?ref=${code}`
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to get referral stats" });
  }
});

export default router;

