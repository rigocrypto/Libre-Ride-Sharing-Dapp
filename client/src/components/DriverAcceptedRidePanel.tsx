/**
 * DriverAcceptedRidePanel Component
 *
 * Shows accepted ride details and start button.
 * Gated: Start button disabled until escrow is FUNDED.
 *
 * Props:
 * - rideId: The accepted ride
 * - status: Ride status (ACCEPTED | IN_PROGRESS | etc)
 * - escrowStatus: Escrow status (pending | locked | released)
 * - pickup, dropoff: Location details
 * - price: Final estimated price
 * - onStart: Callback when start is clicked
 * - isStarting: Loading state
 * - error: Error message (402, 403, etc)
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, AlertTriangle, Clock } from 'lucide-react';

interface DriverAcceptedRidePanelProps {
  rideId: string;
  status: string;
  escrowStatus: string;
  pickup: { lat: number; lng: number; address: string };
  dropoff: { lat: number; lng: number; address: string };
  price: number;
  onStart: () => Promise<void>;
  isStarting?: boolean;
  error?: string;
}

export function DriverAcceptedRidePanel({
  rideId,
  status,
  escrowStatus,
  pickup,
  dropoff,
  price,
  onStart,
  isStarting = false,
  error,
}: DriverAcceptedRidePanelProps) {
  // Gate: Start button enabled only when escrow is locked
  const canStart = status === 'ACCEPTED' && escrowStatus === 'locked';

  // UX: Show why button is disabled
  const startButtonLabel = () => {
    if (isStarting) return 'Starting...';
    if (escrowStatus !== 'locked') return '⏳ Waiting for payment';
    if (status !== 'ACCEPTED') return 'Ride not ready';
    return '▶ Start Ride';
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold">✓ Ride Accepted</h2>
        <p className="text-sm text-muted-foreground">
          ID: {rideId.slice(0, 8)}...
        </p>
      </div>

      {/* Status Badges */}
      <div className="flex gap-2 mb-6">
        <div className="px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-xs font-semibold text-blue-600">
            Status: {status}
          </p>
        </div>
        <div
          className={`px-2 py-1 rounded-lg ${
            escrowStatus === 'locked'
              ? 'bg-green-500/10 border border-green-500/20'
              : 'bg-yellow-500/10 border border-yellow-500/20'
          }`}
        >
          <p
            className={`text-xs font-semibold ${
              escrowStatus === 'locked'
                ? 'text-green-600'
                : 'text-yellow-600'
            }`}
          >
            Payment: {escrowStatus === 'locked' ? '✓ Received' : '⏳ Pending'}
          </p>
        </div>
      </div>

      {/* Locations */}
      <div className="space-y-3 mb-6">
        <div className="flex gap-3">
          <MapPin className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-muted-foreground">
              Pickup
            </p>
            <p className="text-sm">{pickup.address}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <MapPin className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-muted-foreground">
              Dropoff
            </p>
            <p className="text-sm">{dropoff.address}</p>
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="mb-6 p-3 rounded-lg bg-primary/10">
        <p className="text-sm text-muted-foreground">Estimated Fare</p>
        <p className="text-2xl font-bold">${price.toFixed(2)}</p>
      </div>

      {/* Error States */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <div className="text-sm text-destructive">{error}</div>
        </div>
      )}

      {/* Payment Waiting State */}
      {!canStart && escrowStatus !== 'locked' && (
        <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-2">
          <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-600">
            Waiting for rider to secure payment
          </div>
        </div>
      )}

      {/* Start Button */}
      <Button
        onClick={onStart}
        disabled={!canStart || isStarting}
        size="lg"
        className="w-full"
      >
        {startButtonLabel()}
      </Button>

      {/* Info */}
      <p className="text-xs text-muted-foreground mt-3 text-center">
        Keep the app open while searching for the rider
      </p>
    </Card>
  );
}
