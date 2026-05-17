/**
 * StartRideButton Component
 *
 * Button to transition ride from ACCEPTED to IN_PROGRESS.
 * Gated: Disabled until escrow is LOCKED (rider paid).
 *
 * Props:
 * - rideId: The ride to start
 * - escrowStatus: Must be 'locked' to enable
 * - onSuccess: Callback after successful start
 * - onError: Error handler for API failures
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface StartRideButtonProps {
  rideId: string;
  escrowStatus: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function StartRideButton({
  rideId,
  escrowStatus,
  onSuccess,
  onError,
}: StartRideButtonProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canStart = escrowStatus === 'locked';

  const handleStart = async () => {
    if (!canStart) {
      const msg = 'Waiting for rider payment...';
      setError(msg);
      onError?.(msg);
      return;
    }

    setIsStarting(true);
    setError(null);

    try {
      const token = localStorage.getItem('firebaseToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/rides/${rideId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        let errorMsg = data.error || 'Failed to start ride';

        // Map status codes to UX messages
        if (response.status === 402) {
          errorMsg = '⚠️ Payment not received yet';
        } else if (response.status === 403) {
          errorMsg = '⚠️ You are not assigned to this ride';
        } else if (response.status === 404) {
          errorMsg = '⚠️ Ride not found';
        } else if (response.status === 409) {
          errorMsg = '⚠️ Ride state invalid';
        }

        throw new Error(errorMsg);
      }

      onSuccess?.();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleStart}
        disabled={!canStart || isStarting}
        size="lg"
        className="w-full"
      >
        {isStarting && (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        )}
        {isStarting ? 'Starting...' : '▶ Start Ride'}
      </Button>

      {error && (
        <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {!canStart && (
        <p className="text-xs text-center text-muted-foreground">
          ⏳ Button will enable when rider secures payment
        </p>
      )}
    </div>
  );
}
