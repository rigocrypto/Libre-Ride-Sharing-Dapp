import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Car } from "lucide-react";

interface DriverCardProps {
  driverName: string;
  profilePhotoUrl?: string;
  rating: number;
  vehiclePhoto?: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleColor: string;
  licensePlate: string;
  driverId: string;
}

/**
 * Rider-facing driver card displaying required FL TNC compliance information
 * Visible to riders BEFORE accepting ride
 */
export function DriverCard({
  driverName,
  profilePhotoUrl,
  rating,
  vehiclePhoto,
  vehicleMake,
  vehicleModel,
  vehicleColor,
  licensePlate,
  driverId,
}: DriverCardProps) {
  return (
    <Card className="p-4 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border-white/20">
      <div className="grid grid-cols-2 gap-4">
        {/* Driver Identity Section */}
        <div className="flex flex-col items-center gap-3">
          <Avatar className="w-16 h-16 border-2 border-neon-pink">
            <AvatarImage src={profilePhotoUrl} />
            <AvatarFallback className="bg-gradient-neon text-white text-lg">
              {driverName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <p className="font-bold text-sm" data-testid="text-driver-name">
              {driverName}
            </p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <Star className="w-4 h-4 fill-neon-pink text-neon-pink" />
              <span className="text-xs font-semibold" data-testid="text-driver-rating">
                {rating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Vehicle Information Section */}
        <div className="flex flex-col justify-between">
          {vehiclePhoto && (
            <div className="mb-2 rounded border border-white/10 overflow-hidden">
              <img
                src={vehiclePhoto}
                alt="Vehicle"
                className="w-full h-20 object-cover"
                data-testid="img-vehicle"
              />
            </div>
          )}
          <div className="text-xs space-y-1">
            <p className="font-semibold" data-testid="text-vehicle-info">
              {vehicleColor} {vehicleMake} {vehicleModel}
            </p>
            <Badge variant="outline" className="text-xs" data-testid="badge-license-plate">
              <Car className="w-3 h-3 mr-1" />
              {licensePlate}
            </Badge>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        Driver verified • Florida TNC Compliant • Licensed Insurance
      </p>
    </Card>
  );
}
