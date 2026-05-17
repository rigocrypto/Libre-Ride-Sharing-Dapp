/**
 * DriverAssignedPanel Component
 *
 * Shows driver details + waiting state.
 * Driver will start trip soon (once payment confirmed).
 *
 * Props:
 * - driver: Driver info (name, rating, vehicle)
 * - estimatedArrival: Minutes until driver arrives
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Clock, Phone } from 'lucide-react';

interface DriverAssignedPanelProps {
  driver?: {
    id: string;
    name: string;
    rating: number;
    vehicle: string;
    licensePlate: string;
    latitude?: number;
    longitude?: number;
  };
  estimatedArrival?: number;
}

export function DriverAssignedPanel({ driver, estimatedArrival }: DriverAssignedPanelProps) {
  if (!driver) {
    return (
      <Card className="p-8 bg-white/5 backdrop-blur-lg border-white/10 text-center">
        <p className="text-muted-foreground">Assigning driver...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white/5 backdrop-blur-lg border-white/10">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Driver on the way</h2>
          <Badge className="bg-neon-teal">Ready to go</Badge>
        </div>

        {/* Driver Card */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          {/* Name + Rating */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-lg font-semibold">{driver.name}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-semibold">{driver.rating.toFixed(1)}</span>
              </div>
            </div>
            {/* Placeholder avatar */}
            <div className="w-12 h-12 rounded-full bg-neon-purple/20 flex items-center justify-center">
              <span className="text-lg font-bold">{driver.name.charAt(0)}</span>
            </div>
          </div>

          {/* Vehicle */}
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              <span className="font-medium text-white">{driver.vehicle}</span>
            </p>
            <p className="text-muted-foreground">
              License Plate: <span className="font-mono">{driver.licensePlate}</span>
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-neon-teal" />
            <span>
              {estimatedArrival ? `Arriving in ${estimatedArrival} min` : 'Starting trip...'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-neon-pink" />
            <span>Heading to pickup</span>
          </div>
        </div>

        {/* Contact info (future) */}
        <button className="w-full p-3 rounded-lg border border-white/10 hover:bg-white/5 transition flex items-center justify-center gap-2">
          <Phone className="w-4 h-4" />
          <span className="text-sm">Contact Driver</span>
        </button>

        {/* Info */}
        <p className="text-xs text-center text-muted-foreground">
          Keep your phone open. We'll notify you when driver arrives.
        </p>
      </div>
    </Card>
  );
}
