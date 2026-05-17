/**
 * DriverRideOfferCard Component
 *
 * Display incoming ride offer.
 * Shows pickup/dropoff, distance, price.
 * Triggers accept action.
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, DollarSign, Navigation } from 'lucide-react';
import type { RideOffer } from '@/hooks/useRideOffers';

interface DriverRideOfferCardProps {
  offer: RideOffer;
  onAccept: (rideId: string) => Promise<void>;
  isAccepting?: boolean;
  error?: string;
}

export function DriverRideOfferCard({
  offer,
  onAccept,
  isAccepting = false,
  error,
}: DriverRideOfferCardProps) {
  return (
    <Card className="p-6 border-2 border-primary animate-pulse">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold">🎯 New Ride Offer</h2>
        <p className="text-sm text-muted-foreground">
          {offer.estimatedMiles.toFixed(1)} miles
        </p>
      </div>

      {/* Locations */}
      <div className="space-y-3 mb-6">
        {/* Pickup */}
        <div className="flex gap-3">
          <MapPin className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-muted-foreground">
              Pickup
            </p>
            <p className="text-sm truncate">{offer.pickup.address}</p>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <Navigation className="w-4 h-4 text-muted-foreground rotate-90" />
        </div>

        {/* Dropoff */}
        <div className="flex gap-3">
          <MapPin className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-muted-foreground">
              Dropoff
            </p>
            <p className="text-sm truncate">{offer.dropoff.address}</p>
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="mb-6 p-3 rounded-lg bg-primary/10 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-primary" />
        <div>
          <p className="text-sm text-muted-foreground">Estimated Fare</p>
          <p className="text-2xl font-bold">${offer.estimatedPrice.toFixed(2)}</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={() => onAccept(offer.rideId)}
          disabled={isAccepting}
          size="lg"
          className="flex-1"
        >
          {isAccepting ? 'Accepting...' : '✓ Accept Ride'}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          disabled={isAccepting}
        >
          Decline
        </Button>
      </div>
    </Card>
  );
}
