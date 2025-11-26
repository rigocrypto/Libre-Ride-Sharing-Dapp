import { Card } from "@/components/ui/card";
import { MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

interface MapPlaceholderProps {
  pickupLocation?: { lat: number; lng: number; address?: string };
  dropoffLocation?: { lat: number; lng: number; address?: string };
  showRoute?: boolean;
  className?: string;
  isDisneyWorld?: boolean;
}

export function MapPlaceholder({
  pickupLocation,
  dropoffLocation,
  showRoute,
  className,
  isDisneyWorld,
}: MapPlaceholderProps) {
  return (
    <Card className={cn("relative bg-muted/20 backdrop-blur-sm border-white/10 overflow-hidden", className)} data-testid="map-placeholder">
      {/* Simulated map background */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/40 to-muted/20">
        <div className="absolute inset-0 opacity-20">
          {/* Grid pattern to simulate map */}
          <svg className="w-full h-full">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-8 h-full flex flex-col items-center justify-center gap-6">
        {pickupLocation && (
          <div className="flex items-center gap-3 bg-background/80 backdrop-blur-md px-6 py-3 rounded-full">
            {isDisneyWorld ? (
              <div className="w-6 h-6 flex items-center justify-center">
                <span className="text-xl">🐭</span>
              </div>
            ) : (
              <MapPin className="w-6 h-6 text-neon-pink" />
            )}
            <span className="text-sm font-medium">
              {pickupLocation.address || `${pickupLocation.lat.toFixed(4)}, ${pickupLocation.lng.toFixed(4)}`}
            </span>
          </div>
        )}

        {showRoute && pickupLocation && dropoffLocation && (
          <div className="flex items-center justify-center">
            <div className="w-1 h-16 bg-gradient-to-b from-neon-pink via-neon-purple to-neon-teal rounded-full" />
          </div>
        )}

        {dropoffLocation && (
          <div className="flex items-center gap-3 bg-background/80 backdrop-blur-md px-6 py-3 rounded-full">
            <Navigation className="w-6 h-6 text-neon-purple" />
            <span className="text-sm font-medium">
              {dropoffLocation.address || `${dropoffLocation.lat.toFixed(4)}, ${dropoffLocation.lng.toFixed(4)}`}
            </span>
          </div>
        )}

        {!pickupLocation && !dropoffLocation && (
          <div className="text-center text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Map will appear here</p>
            <p className="text-xs mt-1">Powered by Mapbox GL JS</p>
          </div>
        )}
      </div>
    </Card>
  );
}
