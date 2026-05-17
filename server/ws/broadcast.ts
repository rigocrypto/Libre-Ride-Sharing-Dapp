/**
 * WebSocket Broadcast Utilities
 *
 * Send events to clients based on role/subscription.
 * Never mutates DB — WS is read-only signaling.
 */

import type { WebSocketServer } from 'ws';
import type { AuthenticatedSocket } from './auth';
import { getOnlineDriversNearby } from '../services/rideAcceptance';
import type { Ride } from '@shared/schema';

/**
 * Broadcast ride.offered to nearby online drivers
 *
 * This is called AFTER ride transitions to OFFERED in REST layer.
 * WS picks it up and broadcasts to eligible drivers.
 *
 * Does NOT write to DB.
 * Does NOT require dedup (offers are idempotent).
 */
export async function broadcastRideOffered(
  wss: WebSocketServer,
  ride: Ride & { estimatedMiles?: number }
): Promise<void> {
  try {
    // Extract coordinates from pickupLocation
    const pickupLat = typeof ride.pickupLocation === 'object' 
      ? ride.pickupLocation.lat 
      : 28.5; // Default to Orlando
    const pickupLng = typeof ride.pickupLocation === 'object' 
      ? ride.pickupLocation.lng 
      : -81.4;

    // Get drivers online and within radius
    const nearbyDrivers = await getOnlineDriversNearby(
      pickupLat,
      pickupLng,
      10 // 10 mile radius (configurable)
    );

    console.log(`[WS Broadcast] Offering ride ${ride.id} to ${nearbyDrivers.length} nearby drivers`);

    // Send to each driver individually
    nearbyDrivers.forEach((driver) => {
      const pickupObj = typeof ride.pickupLocation === 'object' 
        ? ride.pickupLocation 
        : { lat: 28.5, lng: -81.4, address: '' };
      
      const dropoffObj = typeof ride.dropoffLocation === 'object' 
        ? ride.dropoffLocation 
        : { lat: 28.5, lng: -81.4, address: '' };

      const payload = {
        type: 'ride.offered',
        rideId: ride.id,
        pickup: {
          lat: pickupObj.lat,
          lng: pickupObj.lng,
          address: pickupObj.address,
        },
        dropoff: {
          lat: dropoffObj.lat,
          lng: dropoffObj.lng,
          address: dropoffObj.address,
        },
        estimatedMiles: ride.estimatedMiles || 0,
        estimatedPrice: ride.estimatedPrice || 0,
      };

      // Send to driver's personal room
      wss.clients.forEach((client: AuthenticatedSocket) => {
        if (
          client.user?.userId === driver.driverId &&
          client.user?.role === 'driver' &&
          client.readyState === 1 // WebSocket.OPEN
        ) {
          client.send(JSON.stringify(payload));
        }
      });
    });
  } catch (err) {
    console.error('[WS Broadcast] broadcastRideOffered failed:', err);
  }
}

/**
 * Notify rider that ride was accepted
 *
 * Called AFTER acceptRideAtomic succeeds.
 * Deduped to prevent storm if acceptance is retried.
 */
export function notifyRiderAccepted(
  wss: WebSocketServer,
  riderId: string,
  rideId: string,
  driverId: string
): void {
  const payload = {
    type: 'ride.accepted',
    rideId,
    driverId,
  };

  console.log(`[WS Broadcast] Rider ${riderId}: ride ${rideId} accepted by ${driverId}`);

  wss.clients.forEach((client: AuthenticatedSocket) => {
    if (
      client.user?.userId === riderId &&
      client.user?.role === 'rider' &&
      client.readyState === 1
    ) {
      client.send(JSON.stringify(payload));
    }
  });
}

/**
 * Notify accepted driver of confirmation
 *
 * Called AFTER acceptRideAtomic succeeds.
 * Deduped.
 */
export function notifyDriverAccepted(
  wss: WebSocketServer,
  driverId: string,
  rideId: string
): void {
  const payload = {
    type: 'ride.accepted',
    rideId,
    driverId,
  };

  console.log(`[WS Broadcast] Driver ${driverId}: confirmed acceptance of ${rideId}`);

  wss.clients.forEach((client: AuthenticatedSocket) => {
    if (
      client.user?.userId === driverId &&
      client.user?.role === 'driver' &&
      client.readyState === 1
    ) {
      client.send(JSON.stringify(payload));
    }
  });
}

/**
 * Notify OTHER drivers that ride was accepted
 *
 * Called AFTER acceptRideAtomic succeeds.
 * Deduped.
 */
export function broadcastRideWithdrawn(
  wss: WebSocketServer,
  rideId: string
): void {
  const payload = {
    type: 'ride.withdrawn',
    rideId,
  };

  console.log(`[WS Broadcast] All drivers: ride ${rideId} withdrawn`);

  wss.clients.forEach((client: AuthenticatedSocket) => {
    if (client.user?.role === 'driver' && client.readyState === 1) {
      client.send(JSON.stringify(payload));
    }
  });
}
