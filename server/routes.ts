import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage-factory.js";
import { z } from "zod";
import authRoutes from "./routes/auth.js";
import referralRoutes from "./routes/referrals.js";
import identityRoutes from "./routes/identity.js";
import userRoutes from "./routes/user.js";
import adminRoutes from "./routes/admin.js";
import { sendEmail, generateOnboardingStartedEmail, generateVerificationCompleteEmail, generateDocumentRejectedEmail, generateRideReceiptEmail } from "./email";
import {
  insertWaitlistSchema,
  insertRideSchema,
  insertDriverSchema,
  insertSOSAlertSchema,
  insertDisputeSchema,
  insertDriverPhotosSchema,
  insertVehiclePhotosSchema,
  insertInsuranceDocumentsSchema,
  insertBackgroundCheckDocumentsSchema,
  ORLANDO_LOCATIONS,
  SURGE_TIERS,
  FLORIDA_COMPLIANCE,
} from "@shared/schema";
import {
  authenticateSocket,
  registerHandlers,
  heartbeat,
  onPong,
  type AuthenticatedSocket,
} from "./ws/index";

interface WebSocketClient extends WebSocket {
  userId?: string;
  role?: "rider" | "driver";
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Auth routes (AA signup, wallet management)
  app.use(authRoutes);
  
  // Referral routes
  app.use(referralRoutes);

  // Identity verification routes
  app.use(identityRoutes);

  // User profile routes
  app.use(userRoutes);

  // Admin routes (stats, drivers, rides, users)
  app.use(adminRoutes);

  // Wallet linking routes
  const walletRoutes = (await import('./routes/wallet.js')).default;
  app.use(walletRoutes);

  // Driver verification routes
  const driverRoutes = (await import('./routes/driver.js')).default;
  app.use(driverRoutes);

  // Rides routes (matching, acceptance)
  const ridesRoutes = (await import('./routes/rides.js')).default;
  app.use(ridesRoutes);

  // Escrow routes
  const escrowRoutes = (await import('./routes/escrow.js')).default;
  app.use(escrowRoutes);

  // SIWE (Sign-In With Ethereum) routes
  const siweRoutes = (await import('./routes/siwe.js')).default;
  app.use(siweRoutes);

  if (process.env.NODE_ENV !== 'production') {
    const { registerDevRoutes } = await import('./routes.dev.js');
    registerDevRoutes(app);
  }

  // WebSocket Server for real-time features
  // Use noServer: true to manually handle upgrades and avoid conflicts with Vite HMR
  const wss = new WebSocketServer({ 
    noServer: true,
    path: "/ws"
  });

  const clients = new Set<AuthenticatedSocket>();

  wss.on("connection", async (ws: AuthenticatedSocket) => {
    // Socket is now authenticated (userId + role attached by upgrade handler)
    if (!ws.user) {
      console.warn('[WS] Connection without authenticated user');
      ws.close(4001, 'Not authenticated');
      return;
    }

    console.log(`[WS] Connected: user=${ws.user.userId}, role=${ws.user.role}`);
    clients.add(ws);

    // Mark as alive for heartbeat monitoring
    ws.isAlive = true;

    // Register event handlers
    registerHandlers(ws, wss);

    // Handle pong responses (heartbeat)
    ws.on('pong', () => {
      onPong(ws);
    });

    ws.on("close", () => {
      clients.delete(ws);
      console.log(`[WS] Disconnected: user=${ws.user?.userId}`);
    });

    ws.on('error', (err) => {
      console.error(`[WS] Error for user ${ws.user?.userId}:`, err);
    });
  });

  // Heartbeat monitor (detect dead connections)
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws: AuthenticatedSocket) => {
      if (!ws.isAlive) {
        ws.terminate();
        return;
      }
      heartbeat(ws);
    });
  }, 30000); // Every 30 seconds

  // Store wss on httpServer for broadcast access
  (httpServer as any).wss = wss;

  // Broadcast stats periodically (online drivers count, etc.)
  setInterval(async () => {
    try {
      const onlineDrivers = await storage.getOnlineDrivers();
      broadcast({ type: 'stats', onlineDriversCount: onlineDrivers.length });
    } catch (error: any) {
      // Silently fail stats broadcasts - they're not critical
      if (error.message !== 'Query timeout') {
        console.error("[WebSocket] Stats broadcast error:", error.message);
      }
    }
  }, 10000); // Every 10 seconds

  // Legacy helper functions (deprecated - prefer WS broadcast utilities)
  function broadcast(message: any) {
    const data = JSON.stringify(message);
    wss.clients.forEach((client: AuthenticatedSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  function broadcastToDrivers(message: any) {
    const data = JSON.stringify(message);
    wss.clients.forEach((client: AuthenticatedSocket) => {
      if (client.readyState === WebSocket.OPEN && client.user?.role === "driver") {
        client.send(data);
      }
    });
  }

  function sendToUser(userId: string, message: any) {
    const data = JSON.stringify(message);
    wss.clients.forEach((client: AuthenticatedSocket) => {
      if (client.readyState === WebSocket.OPEN && client.user?.userId === userId) {
        client.send(data);
      }
    });
  }

  // Waitlist API
  app.post("/api/waitlist", async (req, res) => {
    try {
      const data = insertWaitlistSchema.parse(req.body);
      const waitlist = await storage.addToWaitlist(data);
      res.json(waitlist);
    } catch (error) {
      res.status(400).json({ error: "Invalid waitlist data" });
    }
  });

  app.get("/api/waitlist", async (req, res) => {
    const waitlist = await storage.getWaitlist();
    res.json(waitlist);
  });

  // Import wallet middleware before defining protected routes
  const { requireAuth, requireWallet } = await import('./middleware/auth.js');

  // Import identity middleware
  const { requireIdentity } = await import('./middleware/auth.js');

  // Rides API - Requires authenticated user with verified wallet and identity
  app.post("/api/rides", requireAuth, requireWallet, requireIdentity, async (req, res) => {
    try {
      // Calculate surge pricing based on demand (before validation)
      const activeRides = await storage.getActiveRides();
      const surgeMultiplier = calculateSurge(activeRides.length);

      // Calculate estimated price (before validation)
      const distance = calculateDistance(req.body.pickupLocation, req.body.dropoffLocation);
      const basePrice = 5.0;
      const pricePerMile = 2.5;
      const estimatedPrice = (basePrice + distance * pricePerMile) * surgeMultiplier;

      // Check for airport fee
      let airportFee = 0;
      if (isNearAirport(req.body.pickupLocation) || isNearAirport(req.body.dropoffLocation)) {
        airportFee = 3.5;
      }

      // Add required fields from auth and calculations before validation
      const rideData = {
        ...req.body,
        riderId: req.user!.userId, // From requireAuth middleware
        estimatedPrice: estimatedPrice + airportFee,
        status: "OFFERED",
      };

      // Now validate with complete data
      const data = insertRideSchema.parse(rideData);

      const ride = await storage.createRide({
        ...data,
        surgeMultiplier,
        distance,
        airportFee,
      });

      // Broadcast to online drivers via WebSocket
      broadcastToDrivers({ type: "new_ride_request", ride });

      res.json(ride);
    } catch (error: any) {
      console.error('[Rides] Validation error:', error);
      // Provide more detailed error message if it's a Zod validation error
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid ride data",
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }
      res.status(400).json({ error: "Invalid ride data" });
    }
  });

  app.get("/api/rides", async (req, res) => {
    const { userId, role, status } = req.query;

    if (userId && role) {
      const rides = await storage.getRidesByUser(userId as string, role as "rider" | "driver");
      res.json(rides);
    } else if (status === "active") {
      const rides = await storage.getActiveRides();
      res.json(rides);
    } else {
      const rides = await storage.getAllRides();
      res.json(rides);
    }
  });

  app.get("/api/rides/:id", async (req, res) => {
    const ride = await storage.getRide(req.params.id);
    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }
    res.json({ success: true, data: ride });
  });

  app.patch("/api/rides/:id", async (req, res) => {
    const ride = await storage.updateRide(req.params.id, req.body);
    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    // Notify users via WebSocket
    if (ride.riderId) {
      sendToUser(ride.riderId, { type: "ride_updated", ride });
    }
    if (ride.driverId) {
      sendToUser(ride.driverId, { type: "ride_updated", ride });
    }

    res.json(ride);
  });

  app.post("/api/rides/:id/match", async (req, res) => {
    const { driverId } = req.body;
    const ride = await storage.matchRide(req.params.id, driverId);

    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    // Notify rider
    sendToUser(ride.riderId, { type: "driver_assigned", ride });

    res.json(ride);
  });

  app.post("/api/rides/:id/complete", async (req, res) => {
    const ride = await storage.updateRide(req.params.id, {
      status: "COMPLETED",
      completedAt: new Date(),
      finalPrice: req.body.finalPrice,
      escrowStatus: "released",
    });

    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    sendToUser(ride.riderId, { type: "ride.completed", rideId: ride.id, ride });
    if (ride.driverId) {
      sendToUser(ride.driverId, { type: "ride.completed", rideId: ride.id, ride });
    }

    // Award badges if milestones reached
    if (ride.driverId) {
      const driver = await storage.getDriver(ride.driverId);
      if (driver) {
        await storage.updateDriver(ride.driverId, {
          totalRides: (driver.totalRides || 0) + 1,
          totalEarnings: (driver.totalEarnings || 0) + (ride.finalPrice || 0) * 0.97,
        });
        const newBadges = await storage.checkAndAwardBadges(ride.driverId);

        // Notify driver of new badges
        if (newBadges.length > 0) {
          sendToUser(ride.driverId, { type: "badges_earned", badges: newBadges });
        }
      }
    }

    res.json(ride);
  });

  // Badges API
  app.get("/api/badges/:userId", async (req, res) => {
    const badges = await storage.getBadgesByUser(req.params.userId);
    res.json(badges);
  });

  // SOS Alerts API
  app.post("/api/sos", async (req, res) => {
    try {
      const data = insertSOSAlertSchema.parse(req.body);
      const alert = await storage.createSOSAlert(data);

      // Broadcast to all admins
      broadcast({ type: "sos_alert", alert });

      res.json(alert);
    } catch (error) {
      res.status(400).json({ error: "Invalid SOS alert data" });
    }
  });

  app.get("/api/sos", async (req, res) => {
    const { resolved } = req.query;
    const alerts = await storage.getSOSAlerts(
      resolved === "true" ? true : resolved === "false" ? false : undefined
    );
    res.json(alerts);
  });

  app.patch("/api/sos/:id/resolve", async (req, res) => {
    const alert = await storage.resolveSOSAlert(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: "SOS alert not found" });
    }
    res.json(alert);
  });

  // Disputes API
  app.post("/api/disputes", async (req, res) => {
    try {
      const data = insertDisputeSchema.parse(req.body);
      const dispute = await storage.createDispute(data);
      res.json(dispute);
    } catch (error) {
      res.status(400).json({ error: "Invalid dispute data" });
    }
  });

  app.get("/api/disputes", async (req, res) => {
    const { status } = req.query;
    const disputes = await storage.getDisputes(status as string | undefined);
    res.json(disputes);
  });

  app.patch("/api/disputes/:id", async (req, res) => {
    const dispute = await storage.updateDispute(req.params.id, req.body);
    if (!dispute) {
      return res.status(404).json({ error: "Dispute not found" });
    }
    res.json(dispute);
  });

  // Referrals API
  app.post("/api/referrals", async (req, res) => {
    const { userId } = req.body;
    const referralCode = `LIBRE${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const referral = await storage.createReferral({
      referrerId: userId,
      referralCode,
      rewardAmount: 5.0,
      claimed: false,
    });

    res.json(referral);
  });

  app.get("/api/referrals/:userId", async (req, res) => {
    const referrals = await storage.getReferralsByUser(req.params.userId);
    res.json(referrals);
  });

  app.post("/api/referrals/:code/claim", async (req, res) => {
    const { userId } = req.body;
    const referral = await storage.claimReferral(req.params.code, userId);

    if (!referral) {
      return res.status(404).json({ error: "Referral not found or already claimed" });
    }

    res.json(referral);
  });

  // Admin Stats API
  app.get("/api/admin/stats", async (req, res) => {
    const allRides = await storage.getAllRides();
    const activeRides = await storage.getActiveRides();
    const drivers = await storage.getOnlineDrivers();
    const sosAlerts = await storage.getSOSAlerts(false);
    const disputes = await storage.getDisputes("pending");

    const totalRevenue = allRides
      .filter((r) => r.finalPrice)
      .reduce((sum, r) => sum + (r.finalPrice || 0), 0);

    res.json({
      totalRevenue,
      activeRides: activeRides.length,
      totalDrivers: drivers.length,
      sosAlerts: sosAlerts.length,
      pendingDisputes: disputes.length,
    });
  });

  // Photo Upload APIs (FL TNC Compliance) with Resend emails
  app.post("/api/driver/photos", async (req, res) => {
    try {
      const data = insertDriverPhotosSchema.parse(req.body);
      const photo = await storage.uploadDriverPhoto(data);
      
      // Send verification email on profile photo upload
      if (data.photoType === "profile") {
        const driver = await storage.getDriver(data.driverId);
        if (driver) {
          const user = await storage.getUser(driver.userId);
          if (user?.email) {
            await sendEmail({
              to: user.email,
              subject: "Welcome to Libre! Complete Your Profile",
              html: generateOnboardingStartedEmail(user.username || "Driver"),
            });
          }
        }
      }
      
      res.json(photo);
    } catch (error) {
      res.status(400).json({ error: "Invalid photo data" });
    }
  });

  app.get("/api/driver/:driverId/photos", async (req, res) => {
    const photos = await storage.getDriverPhotos(req.params.driverId);
    res.json(photos);
  });

  app.post("/api/vehicle/photos", async (req, res) => {
    try {
      const data = insertVehiclePhotosSchema.parse(req.body);
      const photo = await storage.uploadVehiclePhoto(data);
      res.json(photo);
    } catch (error) {
      res.status(400).json({ error: "Invalid vehicle photo data" });
    }
  });

  app.get("/api/vehicle/:driverId/photos", async (req, res) => {
    const photos = await storage.getVehiclePhotos(req.params.driverId);
    res.json(photos);
  });

  app.post("/api/insurance/document", async (req, res) => {
    try {
      const data = insertInsuranceDocumentsSchema.parse(req.body);
      const doc = await storage.uploadInsuranceDocument(data);
      res.json(doc);
    } catch (error) {
      res.status(400).json({ error: "Invalid insurance document" });
    }
  });

  app.post("/api/background-check/document", async (req, res) => {
    try {
      const data = insertBackgroundCheckDocumentsSchema.parse(req.body);
      const doc = await storage.uploadBackgroundCheckDocument(data);
      res.json(doc);
    } catch (error) {
      res.status(400).json({ error: "Invalid background check document" });
    }
  });

  // Compliance email notification (when all docs approved)
  app.post("/api/driver/approve", async (req, res) => {
    try {
      const { driverId, approvalType } = z.object({ 
        driverId: z.string(), 
        approvalType: z.enum(["verification_complete", "document_rejected"]),
        rejectReason: z.string().optional(),
      }).parse(req.body);

      const driver = await storage.getDriver(driverId);
      if (!driver) return res.status(404).json({ error: "Driver not found" });

      const user = await storage.getUser(driver.userId);
      if (!user?.email) return res.status(400).json({ error: "No email on file" });

      if (approvalType === "verification_complete") {
        await sendEmail({
          to: user.email,
          subject: "Your Libre Profile is Verified! 🎉",
          html: generateVerificationCompleteEmail(user.username || "Driver"),
        });
      } else if (approvalType === "document_rejected" && req.body.rejectReason) {
        await sendEmail({
          to: user.email,
          subject: "Document Review - Resubmission Needed",
          html: generateDocumentRejectedEmail(user.username || "Driver", req.body.rejectReason),
        });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Invalid approval request" });
    }
  });

  // Send ride receipt email
  app.post("/api/ride/send-receipt", async (req, res) => {
    try {
      const { rideId } = z.object({ rideId: z.string() }).parse(req.body);
      const ride = await storage.getRide(rideId);
      if (!ride) return res.status(404).json({ error: "Ride not found" });

      const rider = await storage.getUser(ride.riderId);
      const driver = ride.driverId ? await storage.getDriver(ride.driverId) : null;
      const driverUser = driver ? await storage.getUser(driver.userId) : null;

      if (!rider?.email) return res.status(400).json({ error: "No rider email" });

      await sendEmail({
        to: rider.email,
        subject: "Your Libre Receipt",
        html: generateRideReceiptEmail(
          rider.username || "Rider",
          driverUser?.username || "Driver",
          ride.finalPrice || 0,
          ride.distance || 0,
          ride.duration || 0
        ),
      });

      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to send receipt" });
    }
  });

  // Compliance Constants API (for frontend validation)
  app.get("/api/compliance/constants", (req, res) => {
    res.json(FLORIDA_COMPLIANCE);
  });

  /**
   * WebSocket Upgrade Handler
   *
   * This runs when a client attempts to upgrade to WS.
   * We authenticate with Firebase token before allowing upgrade.
   */
  httpServer.on('upgrade', async (request, socket, head) => {
    // Parse URL to get path
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    
    // Only handle /ws upgrades
    if (url.pathname === '/ws') {
      try {
        // Extract token from query param or Authorization header
        const token = url.searchParams.get('token') || 
          request.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        // Authenticate socket with Firebase token
        const authenticated = await authenticateSocket(
          { close: () => socket.destroy() } as unknown as AuthenticatedSocket,
          token
        );

        if (!authenticated) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        // Extract user from token (we already verified it)
        const adminAuth = (await import('./lib/firebase/admin')).getFirebaseAdmin();
        if (!adminAuth) {
          socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
          socket.destroy();
          return;
        }

        const decodedToken = await adminAuth.verifyIdToken(token);

        // Proceed with upgrade
        const ws = wss.handleUpgrade(request, socket, head, (ws: AuthenticatedSocket) => {
          // Attach user to socket
          ws.user = {
            userId: decodedToken.uid,
            role: (decodedToken.role || 'rider') as 'rider' | 'driver' | 'admin',
          };
          wss.emit('connection', ws, request);
        });
      } catch (err) {
        console.error('[WS Upgrade] Authentication failed:', err);
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
      }
    } else {
      // Not a WS request, pass to next handler
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
    }
  });

  // Cleanup on server close
  httpServer.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  return httpServer;
}

// Helper functions
function calculateDistance(
  pickup: { lat: number; lng: number },
  dropoff: { lat: number; lng: number }
): number {
  // Haversine formula for distance calculation
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(dropoff.lat - pickup.lat);
  const dLon = toRad(dropoff.lng - pickup.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(pickup.lat)) *
      Math.cos(toRad(dropoff.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function calculateSurge(activeRidesCount: number): number {
  // Simple surge calculation based on active rides
  if (activeRidesCount > 100) return SURGE_TIERS[4]; // 25%
  if (activeRidesCount > 75) return SURGE_TIERS[3]; // 15%
  if (activeRidesCount > 50) return SURGE_TIERS[2]; // 10%
  if (activeRidesCount > 25) return SURGE_TIERS[1]; // 5%
  return SURGE_TIERS[0]; // No surge
}

function isNearAirport(location: { lat: number; lng: number }): boolean {
  const mco = ORLANDO_LOCATIONS.MCO_AIRPORT;
  const distance = calculateDistance(mco, location);
  return distance < 2; // Within 2 miles of MCO
}
