/**
 * RideInProgressPanel Component
 *
 * Shows active trip state:
 * - Driver location + ETA
 * - Rider location (pickup/dropoff)
 * - Trip progress
 * - SOS button
 *
 * Props:
 * - ride: Full ride data
 * - onSOS: Callback for emergency button
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, AlertCircle, MessageCircle, Phone } from 'lucide-react';

interface RideInProgressPanelProps {
  ride: {
    id: string;
    status: string;
    driver?: {
      name: string;
      vehicle: string;
      latitude?: number;
      longitude?: number;
    };
    pickupLocation: string;
    dropoffLocation: string;
    estimatedDuration: number;
    estimatedDistance: number;
  };
  onSOS?: () => void;
}

export function RideInProgressPanel({ ride, onSOS }: RideInProgressPanelProps) {
  const tripProgress = 50; // Placeholder: actual would calculate from GPS

  return (
    <Card className="p-6 bg-white/5 backdrop-blur-lg border-white/10">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Driver On The Way</h2>
          <Badge className="bg-neon-teal animate-pulse">In progress</Badge>
        </div>

        {/* Map placeholder */}
        <div className="h-48 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">📍 Map View (Integration Required)</p>
        </div>

        {/* Driver info */}
        {ride.driver && (
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <p className="text-sm text-muted-foreground mb-2">Your Driver</p>
            <p className="font-semibold">{ride.driver.name}</p>
            <p className="text-sm text-muted-foreground">{ride.driver.vehicle}</p>
          </div>
        )}

        {/* Trip details */}
        <div className="space-y-3">
          {/* Pickup */}
          <div className="flex gap-3">
            <MapPin className="w-5 h-5 text-neon-teal flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Pickup</p>
              <p className="text-sm font-medium">{ride.pickupLocation}</p>
            </div>
          </div>

          {/* Progress line */}
          <div className="flex justify-center py-2">
            <div className="h-8 w-1 bg-gradient-to-b from-neon-teal to-neon-pink" />
          </div>

          {/* Dropoff */}
          <div className="flex gap-3">
            <MapPin className="w-5 h-5 text-neon-pink flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Dropoff</p>
              <p className="text-sm font-medium">{ride.dropoffLocation}</p>
            </div>
          </div>
        </div>

        {/* ETA */}
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <p className="text-sm text-muted-foreground">Estimated arrival</p>
          <p className="text-lg font-semibold">
            {ride.estimatedDuration} min · {ride.estimatedDistance.toFixed(1)} mi
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" size="sm">
            <MessageCircle className="w-4 h-4 mr-2" />
            Message
          </Button>
          <Button variant="outline" className="flex-1" size="sm">
            <Phone className="w-4 h-4 mr-2" />
            Call
          </Button>
          <Button
            variant="outline"
            className="flex-1 text-destructive hover:text-destructive"
            size="sm"
            onClick={onSOS}
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            SOS
          </Button>
        </div>
      </div>
    </Card>
  );
}
