/**
 * useRideStart Hook
 *
 * Start an accepted ride (transition to IN_PROGRESS).
 * Requires: escrow.status = 'locked'
 *
 * Calls: POST /api/rides/:id/start
 * Middleware: requireAuth + requireWallet + requireSIWE
 *
 * Returns:
 * - startRide: Function to start (rideId)
 * - isStarting: Request pending
 * - error: Server errors + user-friendly messages
 * - success: Ride started successfully
 */

import { useState, useCallback } from 'react';
import { resolveApiUrl } from '@/lib/queryClient';

export interface RideStartError {
  type:
    | 'escrow_required'
    | 'not_authorized'
    | 'invalid_state'
    | 'not_found'
    | 'network_error'
    | 'unknown';
  message: string;
  code?: string;
  escrowStatus?: string;
}

export function useRideStart() {
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<RideStartError | null>(null);
  const [success, setSuccess] = useState(false);

  const startRide = useCallback(async (rideId: string) => {
    setIsStarting(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem('firebase_token');
      const siweSignature = localStorage.getItem('siwe_signature');

      if (!token || !siweSignature) {
        setError({
          type: 'network_error',
          message: 'Authentication not complete',
        });
        setIsStarting(false);
        return;
      }

      const response = await fetch(resolveApiUrl(`/api/rides/${rideId}/start`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-SIWE-Signature': siweSignature,
        },
      });

      const data = (await response.json()) as any;

      // Map status codes to errors
      if (response.status === 402) {
        setError({
          type: 'escrow_required',
          message: data.error || 'Payment not received yet',
          code: data.code,
          escrowStatus: data.escrowStatus,
        });
      } else if (response.status === 403) {
        setError({
          type: 'not_authorized',
          message: data.error || 'Not authorized to start this ride',
        });
      } else if (response.status === 404) {
        setError({
          type: 'not_found',
          message: data.error || 'Ride not found',
        });
      } else if (response.status === 409) {
        setError({
          type: 'invalid_state',
          message: data.error || 'Ride not ready to start',
        });
      } else if (response.status === 200) {
        setSuccess(true);
        setError(null);
      } else {
        setError({
          type: 'unknown',
          message: data.error || 'Failed to start ride',
        });
      }
    } catch (err) {
      setError({
        type: 'network_error',
        message: err instanceof Error ? err.message : 'Network error',
      });
    } finally {
      setIsStarting(false);
    }
  }, []);

  return {
    startRide,
    isStarting,
    error,
    success,
  };
}
