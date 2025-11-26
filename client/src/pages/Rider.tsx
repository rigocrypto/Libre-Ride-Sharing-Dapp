import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPlaceholder } from "@/components/MapPlaceholder";
import { SOSButton } from "@/components/SOSButton";
import { RideStatusFlow } from "@/components/RideStatusFlow";
import { MapPin, Navigation, DollarSign, TrendingUp, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Web3Connect } from "@/components/Web3Connect";
import { ORLANDO_LOCATIONS, SURGE_TIERS } from "@shared/schema";

export default function Rider() {
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [pickupLocation, setPickupLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [surgeMultiplier, setSurgeMultiplier] = useState(1.0);
  const [rideStatus, setRideStatus] = useState<"idle" | "matching" | "en_route" | "arrived" | "on_trip" | "completed">("idle");
  const [isDisneyWorld, setIsDisneyWorld] = useState(false);

  const handlePickupSelect = (address: string) => {
    setPickupAddress(address);
    // Check for Disney World Easter egg
    if (address.toLowerCase().includes("disney")) {
      setIsDisneyWorld(true);
      setPickupLocation({ ...ORLANDO_LOCATIONS.DISNEY_WORLD, address });
    } else {
      setIsDisneyWorld(false);
      // Mock location for demo
      setPickupLocation({ lat: 28.5383, lng: -81.3792, address });
    }
    calculatePrice();
  };

  const handleDropoffSelect = (address: string) => {
    setDropoffAddress(address);
    setDropoffLocation({ lat: 28.4567, lng: -81.4694, address });
    calculatePrice();
  };

  const calculatePrice = () => {
    // Mock price calculation
    const basePrice = 12.5;
    const distance = Math.random() * 15 + 3; // 3-18 miles
    const pricePerMile = 2.5;
    const surge = SURGE_TIERS[Math.floor(Math.random() * SURGE_TIERS.length)];
    setSurgeMultiplier(surge);
    const total = (basePrice + distance * pricePerMile) * surge;
    setEstimatedPrice(Math.round(total * 100) / 100);
  };

  const handleRequestRide = () => {
    if (pickupLocation && dropoffLocation) {
      setRideStatus("matching");
      // Mock progression through ride states
      setTimeout(() => setRideStatus("en_route"), 3000);
    }
  };

  const cashbackPercent = 10;
  const cashbackAmount = estimatedPrice ? (estimatedPrice * cashbackPercent) / 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <a className="text-2xl font-bold bg-gradient-neon bg-clip-text text-transparent" data-testid="link-home">
              Libre
            </a>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/profile">
              <Button variant="ghost" size="sm" data-testid="button-profile">
                Profile
              </Button>
            </Link>
            <Web3Connect />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {rideStatus === "idle" ? (
          <>
            {/* Address Inputs */}
            <div className="max-w-2xl mx-auto mb-8 space-y-4">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neon-pink" />
                <Input
                  placeholder="Enter pickup location"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  onBlur={() => pickupAddress && handlePickupSelect(pickupAddress)}
                  className="pl-12 h-14 bg-white/5 backdrop-blur-lg border-white/10 focus:border-neon-pink"
                  data-testid="input-pickup-location"
                />
                {/* Mock autocomplete suggestions */}
                {pickupAddress && !pickupLocation && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-popover backdrop-blur-xl border border-popover-border rounded-lg overflow-hidden">
                    {Object.values(ORLANDO_LOCATIONS).map((loc) => (
                      <button
                        key={loc.name}
                        onClick={() => handlePickupSelect(loc.name)}
                        className="w-full px-4 py-3 text-left hover-elevate flex items-center gap-3"
                        data-testid={`suggestion-pickup-${loc.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{loc.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neon-purple" />
                <Input
                  placeholder="Enter dropoff location"
                  value={dropoffAddress}
                  onChange={(e) => setDropoffAddress(e.target.value)}
                  onBlur={() => dropoffAddress && handleDropoffSelect(dropoffAddress)}
                  className="pl-12 h-14 bg-white/5 backdrop-blur-lg border-white/10 focus:border-neon-purple"
                  data-testid="input-dropoff-location"
                />
                {dropoffAddress && !dropoffLocation && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-popover backdrop-blur-xl border border-popover-border rounded-lg overflow-hidden">
                    {Object.values(ORLANDO_LOCATIONS).slice(1).map((loc) => (
                      <button
                        key={loc.name}
                        onClick={() => handleDropoffSelect(loc.name)}
                        className="w-full px-4 py-3 text-left hover-elevate flex items-center gap-3"
                        data-testid={`suggestion-dropoff-${loc.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <Navigation className="w-4 h-4 text-muted-foreground" />
                        <span>{loc.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Map */}
            <MapPlaceholder
              pickupLocation={pickupLocation || undefined}
              dropoffLocation={dropoffLocation || undefined}
              showRoute={!!(pickupLocation && dropoffLocation)}
              isDisneyWorld={isDisneyWorld}
              className="h-[60vh] mb-8"
            />

            {/* Price Estimate */}
            {estimatedPrice && (
              <Card className="max-w-2xl mx-auto bg-white/5 backdrop-blur-lg border-white/10 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold flex items-center gap-2" data-testid="text-estimated-price">
                      <DollarSign className="w-6 h-6 text-neon-teal" />
                      ${estimatedPrice.toFixed(2)}
                    </h3>
                    <p className="text-sm text-muted-foreground">Estimated fare</p>
                  </div>
                  {surgeMultiplier > 1 && (
                    <Badge variant="destructive" className="text-base px-4 py-2" data-testid="badge-surge">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      {((surgeMultiplier - 1) * 100).toFixed(0)}% Surge
                    </Badge>
                  )}
                </div>

                {cashbackAmount > 0 && (
                  <div className="flex items-center justify-between p-4 bg-neon-teal/10 rounded-lg border border-neon-teal/20">
                    <span className="text-sm font-medium">Cashback Rewards</span>
                    <Badge className="bg-neon-teal text-white" data-testid="badge-cashback">
                      +${cashbackAmount.toFixed(2)} USDC
                    </Badge>
                  </div>
                )}

                <Button
                  size="lg"
                  onClick={handleRequestRide}
                  className="w-full bg-neon-pink hover:bg-neon-pink/90 text-white font-semibold h-14 text-lg"
                  data-testid="button-request-ride"
                >
                  Request Ride
                </Button>
              </Card>
            )}
          </>
        ) : (
          <>
            {/* Active Ride View */}
            <RideStatusFlow currentStatus={rideStatus as any} />
            
            <div className="grid md:grid-cols-2 gap-8 mt-8">
              <MapPlaceholder
                pickupLocation={pickupLocation || undefined}
                dropoffLocation={dropoffLocation || undefined}
                showRoute
                isDisneyWorld={isDisneyWorld}
                className="h-96"
              />

              <div className="space-y-6">
                <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center text-white font-bold text-xl">
                      JD
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg" data-testid="text-driver-name">John D.</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span data-testid="text-driver-vehicle">Toyota Camry - ABC 1234</span>
                        <Badge variant="outline" className="text-neon-teal border-neon-teal">
                          ⭐ 4.9
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ETA</span>
                      <span className="font-semibold" data-testid="text-driver-eta">3 min</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Distance</span>
                      <span className="font-semibold" data-testid="text-trip-distance">0.8 mi</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full mt-6 border-accent text-accent"
                    data-testid="button-message-driver"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message Driver
                  </Button>
                </Card>

                <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-6">
                  <h3 className="font-semibold mb-4">Trip Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-neon-pink mt-0.5" />
                      <div>
                        <p className="text-muted-foreground text-xs">Pickup</p>
                        <p className="font-medium" data-testid="text-trip-pickup">{pickupLocation?.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Navigation className="w-5 h-5 text-neon-purple mt-0.5" />
                      <div>
                        <p className="text-muted-foreground text-xs">Dropoff</p>
                        <p className="font-medium" data-testid="text-trip-dropoff">{dropoffLocation?.address}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            <SOSButton rideId="mock-ride-id" />
          </>
        )}
      </div>
    </div>
  );
}
