import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPlaceholder } from "@/components/MapPlaceholder";
import { TrendingUp, DollarSign, Star, Clock, CheckCircle, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Web3Connect } from "@/components/Web3Connect";
import { DriverStatusToggle } from "@/components/DriverStatusToggle";
import { DriverRideOfferCard } from "@/components/DriverRideOfferCard";
import { DriverAcceptedRidePanel } from "@/components/DriverAcceptedRidePanel";
import { StartRideButton } from "@/components/StartRideButton";
import { useRideOffers } from "@/hooks/useRideOffers";
import { useRideAcceptance } from "@/hooks/useRideAcceptance";
import { useRideStart } from "@/hooks/useRideStart";
import { useDriverStatus } from "@/hooks/useDriverStatus";

export default function Driver() {
  // Hook: Manage ride offers (WS)
  const { currentOffer, isLoading: isLoadingOffers, error: offerError, ws } = useRideOffers();
  
  // Hook: Manage driver status (online/offline)
  const { isOnline, setIsOnline, error: statusError } = useDriverStatus();
  
  // Hook: Handle ride acceptance (WS event-based)
  const { acceptRide, isAccepting, error: acceptError, acceptedRideId } = useRideAcceptance(ws);
  
  // Hook: Handle ride start (REST + SIWE + escrow gate)
  const { startRide, isStarting, error: startError, success: startSuccess } = useRideStart();

  // Local state: Track accepted ride with full details
  const [acceptedRide, setAcceptedRide] = useState<{
    id: string;
    status: string;
    escrowStatus: string;
    pickup: { lat: number; lng: number; address: string };
    dropoff: { lat: number; lng: number; address: string };
    price: number;
  } | null>(null);

  // Effect: When acceptance succeeds, fetch full ride details
  useEffect(() => {
    if (acceptedRideId && !acceptedRide) {
      // Fetch full ride details from API
      const token = localStorage.getItem('firebaseToken');
      if (!token) return;

      fetch(`/api/rides/${acceptedRideId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.data) {
            const ride = data.data;
            setAcceptedRide({
              id: ride.id,
              status: ride.status,
              escrowStatus: ride.escrowStatus,
              pickup: {
                lat: ride.pickupLat,
                lng: ride.pickupLng,
                address: ride.pickupLocation,
              },
              dropoff: {
                lat: ride.dropoffLat,
                lng: ride.dropoffLng,
                address: ride.dropoffLocation,
              },
              price: ride.estimatedPrice,
            });
          }
        })
        .catch((err) => console.error('Failed to fetch ride:', err));
    }
  }, [acceptedRideId, acceptedRide]);

  // Effect: When ride starts successfully, clear accepted state
  useEffect(() => {
    if (startSuccess) {
      setAcceptedRide(null);
    }
  }, [startSuccess]);

  // Handler: Accept incoming offer
  const handleAcceptOffer = async () => {
    if (!currentOffer) return;
    try {
      await acceptRide(currentOffer.rideId);
      // Accepted state will be shown after ride details load
    } catch (err) {
      console.error('Accept failed:', err);
    }
  };

  // Handler: Start accepted ride
  const handleStartRide = async () => {
    if (!acceptedRide) return;
    try {
      await startRide(acceptedRide.id);
      // Success effect clears acceptedRide state above
    } catch (err) {
      console.error('Start failed:', err);
    }
  };

  const driverStats = {
    weeklyEarnings: 1247.50,
    todayRides: 8,
    acceptanceRate: 94,
    rating: 4.9,
    onTimeRate: 97,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold bg-gradient-neon bg-clip-text text-transparent" data-testid="link-home">
            Libre Driver
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/profile" asChild>
              <Button variant="ghost" size="sm" data-testid="button-profile">
                Profile
              </Button>
            </Link>
            <Web3Connect />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Go Online Toggle */}
        <Card className="max-w-2xl mx-auto mb-8 bg-white/5 backdrop-blur-lg border-white/10 p-8">
          <DriverStatusToggle />
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "This Week", value: `$${driverStats.weeklyEarnings.toFixed(2)}`, icon: DollarSign, color: "text-neon-teal" },
            { label: "Today's Rides", value: driverStats.todayRides, icon: MapPin, color: "text-neon-pink" },
            { label: "Rating", value: driverStats.rating, icon: Star, color: "text-yellow-500" },
            { label: "Acceptance", value: `${driverStats.acceptanceRate}%`, icon: CheckCircle, color: "text-neon-purple" },
            { label: "On-Time", value: `${driverStats.onTimeRate}%`, icon: Clock, color: "text-accent" },
          ].map((stat) => (
            <Card key={stat.label} className="bg-white/5 backdrop-blur-lg border-white/10 p-4" data-testid={`card-stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p>
              </div>
              <p className="text-2xl font-bold" data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>{stat.value}</p>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Map - 2 columns */}
          <div className="md:col-span-2 space-y-6">
            <MapPlaceholder className="h-96" />
            
            {/* Surge Heat Map Legend */}
            {isOnline && (
              <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Surge Pricing Zones</h3>
                  <Badge className="bg-gradient-to-r from-neon-pink to-neon-purple" data-testid="badge-surge-active">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { zone: "Downtown", surge: "25%", color: "from-neon-pink to-red-500" },
                    { zone: "I-Drive", surge: "15%", color: "from-neon-purple to-neon-pink" },
                    { zone: "Airport", surge: "10%", color: "from-neon-teal to-neon-purple" },
                  ].map((zone) => (
                    <div key={zone.zone} className="text-center">
                      <div className={`h-2 rounded-full bg-gradient-to-r ${zone.color} mb-2`} />
                      <p className="text-xs font-medium">{zone.zone}</p>
                      <p className="text-xs text-neon-teal font-semibold">{zone.surge}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Ride Requests - 1 column */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Ride Requests</h3>
            
            {!isOnline ? (
              <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-8 text-center">
                <p className="text-muted-foreground">Go online to see ride requests</p>
              </Card>
            ) : isLoadingOffers ? (
              <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-8 text-center">
                <div className="animate-pulse">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-neon-teal" />
                  <p className="text-muted-foreground">Searching for riders...</p>
                </div>
              </Card>
            ) : acceptedRide ? (
              // Show accepted ride panel with start button
              <DriverAcceptedRidePanel
                rideId={acceptedRide.id}
                status={acceptedRide.status}
                escrowStatus={acceptedRide.escrowStatus}
                pickup={acceptedRide.pickup}
                dropoff={acceptedRide.dropoff}
                price={acceptedRide.price}
                onStart={handleStartRide}
                isStarting={isStarting}
                error={startError?.message ?? undefined}
              />
            ) : currentOffer ? (
              // Show ride offer card with accept button
              <DriverRideOfferCard
                offer={currentOffer}
                onAccept={handleAcceptOffer}
                isAccepting={isAccepting}
                error={acceptError?.message ?? undefined}
              />
            ) : (
              <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-8 text-center">
                <div className="animate-pulse">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-neon-teal" />
                  <p className="text-muted-foreground">Searching for riders...</p>
                </div>
              </Card>
            )}

            {/* Error Messages */}
            {offerError && (
              <Card className="bg-destructive/10 border-destructive/20 p-4">
                <p className="text-sm text-destructive">Offer Error: {offerError}</p>
              </Card>
            )}
            {statusError && (
              <Card className="bg-destructive/10 border-destructive/20 p-4">
                <p className="text-sm text-destructive">Status Error: {statusError}</p>
              </Card>
            )}

            {/* Earnings Calculator */}
            <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-6">
              <h3 className="font-semibold mb-4">Weekly Projection</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Pace</span>
                  <span className="font-semibold text-neon-teal" data-testid="text-projection-weekly">$1,850/wk</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">If you drive +5h</span>
                  <span className="font-semibold text-neon-purple">$2,200/wk</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Goal</span>
                  <span className="font-bold text-lg">$8,000</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
