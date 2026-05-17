/**
 * useRideAcceptance Hook
 *
 * Driver accept a ride via WebSocket.
 * Sends ride.accept event and waits for confirmation.
 *
 * Returns:
 * - acceptRide: Accept function (rideId)
 * - isAccepting: Request pending
 * - error: Errors from server
 * - acceptedRideId: ID of accepted ride (for nav)
 */

import { useState, useCallback } from 'react';

export interface AcceptanceError {
  type: 'ride_not_found' | 'already_accepted' | 'network_error' | 'unknown';
  message: string;
  code?: string;
}

export function useRideAcceptance(ws: WebSocket | null) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<AcceptanceError | null>(null);
  const [acceptedRideId, setAcceptedRideId] = useState<string | null>(null);

  const acceptRide = useCallback(
    async (rideId: string) => {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        setError({
          type: 'network_error',
          message: 'WebSocket not connected',
        });
        return;
      }

      setIsAccepting(true);
      setError(null);

      return new Promise<void>((resolve) => {
        // Set timeout for response
        const timeout = setTimeout(() => {
          setIsAccepting(false);
          setError({
            type: 'network_error',
            message: 'Acceptance request timeout',
          });
          resolve();
        }, 10000);

        // Listen for response
        const handler = (event: Event) => {
          if (!(event instanceof MessageEvent)) return;

          try {
            const message = JSON.parse(event.data);

            // Accept success
            if (message.type === 'ride.accept_success') {
              if (message.rideId === rideId) {
                clearTimeout(timeout);
                setIsAccepting(false);
                setAcceptedRideId(rideId);
                setError(null);

                // Remove this listener
                ws.removeEventListener('message', handler);
                resolve();
              }
            }

            // Accept failed
            if (message.type === 'ride.accept_failed') {
              if (message.error) {
                clearTimeout(timeout);
                setIsAccepting(false);

                // Map server error to user-friendly message
                let errType: AcceptanceError['type'] = 'unknown';
                if (message.error.includes('not found')) {
                  errType = 'ride_not_found';
                } else if (message.error.includes('already accepted')) {
                  errType = 'already_accepted';
                }

                setError({
                  type: errType,
                  message: message.error,
                });

                ws.removeEventListener('message', handler);
                resolve();
              }
            }
          } catch (err) {
            // Ignore parse errors (not for us)
          }
        };

        ws.addEventListener('message', handler);

        // Send accept event
        try {
          ws.send(
            JSON.stringify({
              type: 'ride.accept',
              rideId,
            })
          );
        } catch (err) {
          clearTimeout(timeout);
          setIsAccepting(false);
          setError({
            type: 'network_error',
            message: 'Failed to send acceptance',
          });
          ws.removeEventListener('message', handler);
          resolve();
        }
      });
    },
    [ws]
  );

  return {
    acceptRide,
    isAccepting,
    error,
    acceptedRideId,
  };
}
