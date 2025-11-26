import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertWaitlistSchema,
  insertRideSchema,
  insertDriverSchema,
  insertSOSAlertSchema,
  insertDisputeSchema,
  ORLANDO_LOCATIONS,
  SURGE_TIERS,
} from "@shared/schema";

interface WebSocketClient extends WebSocket {
  userId?: string;
  role?: "rider" | "driver";
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket Server for real-time features
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  const clients = new Set<WebSocketClient>();

  wss.on("connection", (ws: WebSocketClient) => {
    clients.add(ws);

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());

        // Handle different message types
        switch (message.type) {
          case "auth":
            ws.userId = message.userId;
            ws.role = message.role;
            broadcast({ type: "user_online", userId: message.userId, role: message.role });
            break;

          case "ride_request":
            // Broadcast to online drivers
            broadcastToDrivers({ type: "new_ride_request", ride: message.ride });
            break;

          case "ride_accepted":
            // Notify rider
            sendToUser(message.riderId, { type: "driver_assigned", driver: message.driver });
            break;

          case "chat_message":
            // Send to specific user
            sendToUser(message.toUserId, {
              type: "chat_message",
              from: message.from,
              message: message.message,
              timestamp: new Date().toISOString(),
            });
            break;

          case "location_update":
            // Broadcast location to matched rider/driver
            if (message.toUserId) {
              sendToUser(message.toUserId, {
                type: "location_update",
                location: message.location,
              });
            }
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      clients.delete(ws);
      if (ws.userId) {
        broadcast({ type: "user_offline", userId: ws.userId });
      }
    });
  });

  function broadcast(message: any) {
    const data = JSON.stringify(message);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  function broadcastToDrivers(message: any) {
    const data = JSON.stringify(message);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client.role === "driver") {
        client.send(data);
      }
    });
  }

  function sendToUser(userId: string, message: any) {
    const data = JSON.stringify(message);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client.userId === userId) {
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

  // Rides API
  app.post("/api/rides", async (req, res) => {
    try {
      const data = insertRideSchema.parse(req.body);

      // Calculate surge pricing based on demand
      const activeRides = await storage.getActiveRides();
      const surgeMultiplier = calculateSurge(activeRides.length);

      // Calculate estimated price
      const distance = calculateDistance(data.pickupLocation, data.dropoffLocation);
      const basePrice = 5.0;
      const pricePerMile = 2.5;
      const estimatedPrice = (basePrice + distance * pricePerMile) * surgeMultiplier;

      // Check for airport fee
      let airportFee = 0;
      if (isNearAirport(data.pickupLocation) || isNearAirport(data.dropoffLocation)) {
        airportFee = 3.5;
      }

      const ride = await storage.createRide({
        ...data,
        estimatedPrice: estimatedPrice + airportFee,
        surgeMultiplier,
        distance,
        airportFee,
        status: "matching",
      });

      // Broadcast to online drivers via WebSocket
      broadcastToDrivers({ type: "new_ride_request", ride });

      res.json(ride);
    } catch (error) {
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
    res.json(ride);
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
      status: "completed",
      completedAt: new Date(),
      finalPrice: req.body.finalPrice,
    });

    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
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

  // Drivers API
  app.post("/api/drivers", async (req, res) => {
    try {
      const data = insertDriverSchema.parse(req.body);
      const driver = await storage.createDriver(data);
      res.json(driver);
    } catch (error) {
      res.status(400).json({ error: "Invalid driver data" });
    }
  });

  app.get("/api/drivers/online", async (req, res) => {
    const drivers = await storage.getOnlineDrivers();
    res.json(drivers);
  });

  app.get("/api/drivers/:userId", async (req, res) => {
    const driver = await storage.getDriver(req.params.userId);
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }
    res.json(driver);
  });

  app.patch("/api/drivers/:userId", async (req, res) => {
    const driver = await storage.updateDriver(req.params.userId, req.body);
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    // Notify if going online/offline
    if ("isOnline" in req.body) {
      broadcast({
        type: req.body.isOnline ? "driver_online" : "driver_offline",
        driverId: req.params.userId,
      });
    }

    res.json(driver);
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
