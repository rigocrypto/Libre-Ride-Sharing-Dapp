/**
 * WebSocket Event Handlers
 *
 * Receive WS events from clients.
 * Delegate all business logic to services (REST layer).
 * WS is **signaling only** — zero DB writes here.
 *
 * Handler Pattern:
 * 1. Validate client sent valid data + correct role
 * 2. Call service function (acceptRideAtomic, etc.)
 * 3. Broadcast results only AFTER service succeeds
 * 4. Always dedup broadcasts
 */

import type { AuthenticatedSocket } from './auth';
import { emitOnce } from './dedup';
import {
  notifyRiderAccepted,
  notifyDriverAccepted,
  broadcastRideWithdrawn,
} from './broadcast';
import {
  acceptRideAtomic,
  RideAlreadyAcceptedError,
  RideNotFoundError,
} from '../services/rideAcceptance';
import type { WebSocketServer } from 'ws';

/**
 * Handle: ride.accept
 *
 * Driver accepts a ride offer.
 * This MUST delegate to acceptRideAtomic() for atomicity.
 *
 * Error handling:
 * - RideNotFoundError: Ride doesn't exist or no longer offered
 * - RideAlreadyAcceptedError: Another driver won
 *
 * Broadcasting is deduped (emitOnce) to prevent storms on retry.
 */
export async function handleRideAccept(
  socket: AuthenticatedSocket,
  wss: WebSocketServer,
  message: { rideId: string }
): Promise<void> {
  try {
    // Validate: only drivers can accept
    if (socket.user?.role !== 'driver') {
      socket.send(
        JSON.stringify({
          type: 'ride.accept_failed',
          error: 'Only drivers can accept rides',
        })
      );
      return;
    }

    const { rideId } = message;
    const driverId = socket.user.userId;

    if (!rideId || rideId.length < 36) {
      socket.send(
        JSON.stringify({
          type: 'ride.accept_failed',
          error: 'Invalid ride ID',
        })
      );
      return;
    }

    console.log(`[WS Handler] Driver ${driverId} accepting ride ${rideId}`);

    /**
     * Call atomic transaction
     * This is where DB safety happens.
     */
    const result = await acceptRideAtomic(rideId, driverId);

    /**
     * Success: broadcast acceptance
     * Use emitOnce with dedup key to prevent duplicate broadcasts
     * if handler is called multiple times (e.g., retry logic).
     */
    const dedupKey = `ride:${rideId}:accepted`;

    emitOnce(dedupKey, () => {
      // Notify rider (we need to fetch riderId from DB or pass it)
      // For now, broadcast to all and let frontend filter
      notifyRiderAccepted(wss, rideId, rideId, driverId);

      // Confirm to accepting driver
      notifyDriverAccepted(wss, driverId, rideId);
    });

    // Withdraw from other drivers
    const withdrawKey = `ride:${rideId}:withdrawn`;
    emitOnce(withdrawKey, () => {
      broadcastRideWithdrawn(wss, rideId);
    });

    // Send confirmation back to client
    socket.send(
      JSON.stringify({
        type: 'ride.accept_success',
        rideId,
        acceptedAt: result.acceptedAt,
      })
    );
  } catch (err) {
    /**
     * Specific error handling
     */
    if (err instanceof RideNotFoundError) {
      socket.send(
        JSON.stringify({
          type: 'ride.accept_failed',
          error: 'Ride not found or no longer available',
        })
      );
      return;
    }

    if (err instanceof RideAlreadyAcceptedError) {
      socket.send(
        JSON.stringify({
          type: 'ride.accept_failed',
          error: 'Another driver already accepted this ride',
        })
      );
      return;
    }

    /**
     * Unknown error: log and notify
     */
    console.error('[WS Handler] ride.accept error:', err);
    socket.send(
      JSON.stringify({
        type: 'ride.accept_failed',
        error: 'Internal error accepting ride',
      })
    );
  }
}

/**
 * Register all WS event listeners on a socket
 *
 * Usage:
 * ```
 * wss.on('connection', (ws) => {
 *   registerHandlers(ws, wss);
 * });
 * ```
 */
export function registerHandlers(
  socket: AuthenticatedSocket,
  wss: WebSocketServer
): void {
  socket.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'ride.accept':
          await handleRideAccept(socket, wss, message);
          break;

        default:
          console.warn(`[WS Handler] Unknown message type: ${message.type}`);
      }
    } catch (err) {
      console.error('[WS Handler] Message parse error:', err);
    }
  });
}
