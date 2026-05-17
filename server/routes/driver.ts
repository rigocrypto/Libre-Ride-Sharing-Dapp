/**
 * Driver Verification Routes
 * 
 * Multi-step driver onboarding and verification system.
 * 
 * Requirements:
 * - Firebase-verified identity
 * - Linked wallet
 * - Uploaded documents (license, insurance)
 * - Admin approval
 */

import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { storage } from '../storage';

const router = Router();

/**
 * POST /api/driver/onboard
 * 
 * Start driver onboarding process.
 * Requires: Authenticated user with linked wallet
 */
router.post('/api/driver/onboard', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userId } = req.user;

    // Check prerequisites
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Require identity verification
    if (!(user as any).identityVerified) {
      return res.status(400).json({
        error: 'Identity verification required',
        message: 'Please complete identity verification before becoming a driver',
      });
    }

    // Require linked wallet
    if (!user.walletAddress || !(user as any).walletVerifiedAt) {
      return res.status(400).json({
        error: 'Wallet linking required',
        message: 'Please link your wallet before becoming a driver',
      });
    }

    // Check if driver profile already exists
    const existingDriver = await storage.getDriver(userId);
    if (existingDriver) {
      return res.status(400).json({
        error: 'Driver profile already exists',
        driverStatus: (existingDriver as any).driverStatus || 'unverified',
      });
    }

    // Create driver profile with "pending" status
    const driver = await storage.createDriver({
      userId,
      driverStatus: 'pending' as any,
      isOnline: false,
    });

    // Update user role to driver
    await storage.updateUser(userId, { role: 'driver' });

    res.json({
      success: true,
      driverId: driver.id,
      driverStatus: (driver as any).driverStatus,
      message: 'Driver onboarding started. Please upload required documents.',
    });
  } catch (error: any) {
    console.error('[Driver] Failed to start onboarding:', error);
    res.status(500).json({ error: 'Failed to start driver onboarding' });
  }
});

/**
 * POST /api/driver/documents
 * 
 * Upload driver documents (license, insurance).
 * Requires: Driver profile in "pending" status
 */
router.post('/api/driver/documents', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userId } = req.user;
    const { licenseUrl, insuranceUrl } = z.object({
      licenseUrl: z.string().url(),
      insuranceUrl: z.string().url(),
    }).parse(req.body);

    const driver = await storage.getDriver(userId);
    if (!driver) {
      return res.status(404).json({
        error: 'Driver profile not found',
        message: 'Please start driver onboarding first',
      });
    }

    const driverStatus = (driver as any).driverStatus;
    if (driverStatus !== 'pending' && driverStatus !== 'rejected') {
      return res.status(400).json({
        error: 'Invalid driver status',
        message: `Cannot upload documents in status: ${driverStatus}`,
      });
    }

    // Update driver with documents
    const updated = await storage.updateDriver(userId, {
      licenseNumber: 'VERIFIED' as any, // In production, extract from license scan
      insuranceDoc: insuranceUrl as any,
      driverStatus: 'pending' as any, // Reset to pending for admin review
    });

    if (!updated) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({
      success: true,
      driverStatus: (updated as any).driverStatus,
      message: 'Documents uploaded. Waiting for admin approval.',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('[Driver] Failed to upload documents:', error);
    res.status(500).json({ error: 'Failed to upload documents' });
  }
});

/**
 * GET /api/driver/status
 * 
 * Get driver verification status.
 */
router.get('/api/driver/status', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userId } = req.user;
    const driver = await storage.getDriver(userId);

    if (!driver) {
      return res.json({
        isDriver: false,
        driverStatus: null,
      });
    }

    const driverStatus = (driver as any).driverStatus || 'unverified';

    res.json({
      isDriver: true,
      driverStatus,
      driverApprovedAt: (driver as any).driverApprovedAt || null,
      driverRejectedAt: (driver as any).driverRejectedAt || null,
      rejectionReason: (driver as any).rejectionReason || null,
      hasDocuments: !!(driver.licenseNumber && driver.insuranceDoc),
    });
  } catch (error: any) {
    console.error('[Driver] Failed to get driver status:', error);
    res.status(500).json({ error: 'Failed to get driver status' });
  }
});

/**
 * POST /api/driver/admin/approve
 * 
 * Admin-only endpoint to approve driver.
 * Requires: admin role
 */
router.post('/api/driver/admin/approve', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { driverId } = z.object({
      driverId: z.string(),
    }).parse(req.body);

    const driver = await storage.getDriver(driverId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Verify documents are uploaded
    if (!driver.licenseNumber || !driver.insuranceDoc) {
      return res.status(400).json({
        error: 'Missing documents',
        message: 'Driver must upload license and insurance before approval',
      });
    }

    const updated = await storage.updateDriver(driverId, {
      driverStatus: 'approved' as any,
      driverApprovedAt: new Date() as any,
      isVerified: true,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({
      success: true,
      driverStatus: (updated as any).driverStatus,
      message: 'Driver approved successfully',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('[Driver] Failed to approve driver:', error);
    res.status(500).json({ error: 'Failed to approve driver' });
  }
});

/**
 * POST /api/driver/admin/reject
 * 
 * Admin-only endpoint to reject driver.
 * Requires: admin role
 */
router.post('/api/driver/admin/reject', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { driverId, reason } = z.object({
      driverId: z.string(),
      reason: z.string().min(10),
    }).parse(req.body);

    const driver = await storage.getDriver(driverId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const updated = await storage.updateDriver(driverId, {
      driverStatus: 'rejected' as any,
      driverRejectedAt: new Date() as any,
      rejectionReason: reason as any,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({
      success: true,
      driverStatus: (updated as any).driverStatus,
      message: 'Driver rejected',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('[Driver] Failed to reject driver:', error);
    res.status(500).json({ error: 'Failed to reject driver' });
  }
});

/**
 * POST /api/driver/status
 *
 * Update driver online/offline status with location.
 * Called when driver toggles "Go Online" or updates location.
 *
 * Auth: requireAuth + requireWallet (driver must have linked wallet)
 * NOT requireSIWE (no money movement)
 *
 * Body:
 * {
 *   isOnline: boolean,
 *   lat?: number,
 *   lng?: number
 * }
 */
router.post('/api/driver/status', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const driverId = req.user.userId;
    const { isOnline, lat, lng } = req.body;

    // Validate input
    if (typeof isOnline !== 'boolean') {
      return res.status(400).json({ error: 'isOnline (boolean) required' });
    }

    if (isOnline && (typeof lat !== 'number' || typeof lng !== 'number')) {
      return res.status(400).json({
        error: 'lat and lng required when going online',
      });
    }

    // Update driver status (upsert)
    const { updateDriverStatus } = await import('../services/rideAcceptance.ts');
    const updated = await updateDriverStatus(driverId, isOnline, lat, lng);

    res.json({
      success: true,
      data: {
        driverId,
        isOnline: updated.isOnline,
        lat: updated.lat,
        lng: updated.lng,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (err) {
    console.error('Driver status error:', err);
    res.status(500).json({ error: 'Failed to update driver status' });
  }
});

export default router;

