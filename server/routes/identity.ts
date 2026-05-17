/**
 * Identity Verification Routes
 * Handles Persona/Stripe Identity verification flow
 */

import express from "express";
import { z } from "zod";
import { storage } from "../storage-factory.js";
import { requireAuth } from "../middleware/auth.js";
import { createPersonaInquiry, getPersonaInquiry, verifyPersonaWebhook } from "../lib/persona/client.js";
import { sendEmail } from "../email.js";

const router = express.Router();

/**
 * Start identity verification
 * Creates verification session and returns redirect URL
 * POST /api/identity/start
 */
router.post("/api/identity/start", async (req, res) => {
  try {
    console.log('[Identity] Route hit! Body:', req.body);
    
    // Get userId from request body (sent from frontend)
    const userId = req.body.userId;

    if (!userId) {
      console.warn('[Identity] No userId provided in request');
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log('[Identity] Starting verification for user:', userId);

    // Get user info for Persona
    const user = await storage.getUser(userId);
    if (!user || !user.email) {
      console.warn('[Identity] User not found:', userId);
      return res.status(404).json({ error: 'User not found. Please log in first.' });
    }
    
    console.log('[Identity] User found:', user.id, user.email);

    const templateId = process.env.PERSONA_TEMPLATE_ID;
    if (!templateId) {
      console.warn('[Identity] PERSONA_TEMPLATE_ID not configured, using mock');
      // Fallback to mock URL for development
      const mockUrl = `https://verify.persona.inquiry/start?template_id=mock&reference_id=${userId}`;
      return res.json({
        success: true,
        verificationUrl: mockUrl,
        provider: 'persona',
        mock: true,
      });
    }

    // Create Persona inquiry
    try {
      const inquiry = await createPersonaInquiry({
        templateId,
        referenceId: userId,
        fields: {
          email_address: user.email,
          name_first: user.username?.split(' ')[0],
          name_last: user.username?.split(' ').slice(1).join(' '),
        },
      });

      const verificationUrl = inquiry.data.attributes.redirect_url;
      const inquiryId = inquiry.data.id;

      console.log('[Identity] Persona inquiry created:', inquiryId, verificationUrl);

      res.json({
        success: true,
        verificationUrl,
        provider: 'persona',
        inquiryId,
      });
    } catch (personaError: any) {
      console.error('[Identity] Persona API error:', personaError);
      // Fallback to mock for development
      if (process.env.NODE_ENV === 'development') {
        return res.json({
          success: true,
          verificationUrl: `https://verify.persona.inquiry/start?template_id=${templateId}&reference_id=${userId}`,
          provider: 'persona',
          mock: true,
          error: personaError.message,
        });
      }
      throw personaError;
    }
  } catch (error: any) {
    console.error('[Identity] Failed to start verification:', error);
    res.status(500).json({
      error: error.message || 'Failed to start verification',
    });
  }
});

/**
 * Webhook handler for Persona verification results
 * POST /webhooks/persona
 */
router.post("/webhooks/persona", async (req, res) => {
  try {
    const event = req.body;
    const signature = req.headers['persona-signature'] as string;
    const webhookSecret = process.env.PERSONA_WEBHOOK_SECRET;

    console.log('[Persona Webhook] Event received:', event.type);

    // Verify webhook signature (production)
    if (webhookSecret && signature) {
      const bodyString = JSON.stringify(req.body);
      const isValid = verifyPersonaWebhook(signature, bodyString, webhookSecret);
      
      if (!isValid) {
        console.error('[Persona Webhook] Invalid signature');
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    } else if (process.env.NODE_ENV === 'production') {
      console.warn('[Persona Webhook] No webhook secret configured in production!');
    }

    // Handle inquiry completion
    if (event.type === 'inquiry.completed' || event.type === 'inquiry.status-changed') {
      const inquiry = event.data.attributes;
      const userId = inquiry.reference_id;
      const status = inquiry.status;
      const inquiryId = event.data.id;

      console.log('[Persona Webhook] Inquiry status:', status, 'for user:', userId);

      const user = await storage.getUser(userId);
      if (!user) {
        console.error('[Persona Webhook] User not found:', userId);
        return res.sendStatus(200); // Acknowledge to prevent retries
      }

      if (status === 'passed' || status === 'approved') {
        // Update user verification status
        await storage.updateUser(userId, {
          identityVerified: true as any,
          identityVerifiedAt: new Date() as any,
        });

        console.log('[Persona Webhook] User verified:', userId);

        // Send verification success email
        try {
          await sendEmail({
            to: user.email || '',
            subject: 'Identity Verified - Welcome to Libre!',
            html: `
              <h1>🎉 Identity Verified!</h1>
              <p>Your identity has been successfully verified. You can now:</p>
              <ul>
                <li>✅ Request rides</li>
                <li>✅ Become a driver</li>
                <li>✅ Withdraw rewards</li>
              </ul>
              <p><a href="${process.env.APP_URL || 'http://localhost:5000'}/rider">Start Riding →</a></p>
            `,
          });
        } catch (emailError) {
          console.warn('[Persona Webhook] Failed to send verification email:', emailError);
        }
      } else if (status === 'failed' || status === 'declined') {
        // Send failure notification
        try {
          await sendEmail({
            to: user.email || '',
            subject: 'Identity Verification - Action Required',
            html: `
              <h1>Verification Review Needed</h1>
              <p>Your identity verification was ${status}. Please try again or contact support.</p>
              <p><a href="${process.env.APP_URL || 'http://localhost:5000'}/verify">Try Again →</a></p>
            `,
          });
        } catch (emailError) {
          console.warn('[Persona Webhook] Failed to send failure email:', emailError);
        }
      }

      res.sendStatus(200);
    } else {
      // Acknowledge other event types
      console.log('[Persona Webhook] Acknowledged event:', event.type);
      res.sendStatus(200);
    }
  } catch (error: any) {
    console.error('[Persona Webhook] Error:', error);
    // Still return 200 to prevent Persona from retrying invalid requests
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * DEV ONLY: Mock identity verification endpoint
 * 
 * POST /api/identity/mock-verify
 * 
 * In development, allows manually setting identity verification status.
 * Requires authentication.
 * 
 * Body: { userId? } (optional, defaults to authenticated user)
 */
router.post("/api/identity/mock-verify", requireAuth, async (req, res) => {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Mock verification not available in production',
    });
  }

  try {
    // Use authenticated user's ID by default, allow override in dev
    const targetUserId = req.body.userId || req.user?.userId;

    if (!targetUserId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'userId is required',
      });
    }

    // Verify user exists
    const user = await storage.getUser(targetUserId);
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    // Set verification status
    const updated = await storage.updateUser(targetUserId, {
      identityVerified: true as any,
      identityVerifiedAt: new Date() as any,
    });

    if (!updated) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update user',
      });
    }

    console.log('[Identity] Mock verification completed for user:', targetUserId);

    res.json({
      success: true,
      message: 'Identity verification mocked successfully (DEV ONLY)',
      userId: targetUserId,
      identityVerified: true,
      identityVerifiedAt: (updated as any).identityVerifiedAt,
    });
  } catch (error: any) {
    console.error('[Identity] Mock verification failed:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to mock verify identity',
    });
  }
});

export default router;
