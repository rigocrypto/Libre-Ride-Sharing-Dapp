import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MapPlaceholder } from "@/components/MapPlaceholder";
import { TrendingUp, DollarSign, Star, Clock, CheckCircle, MapPin } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Web3Connect } from "@/components/Web3Connect";

export default function Driver() {
  const [isOnline, setIsOnline] = useState(false);
  const [showRideRequest, setShowRideRequest] = useState(false);

  const handleGoOnline = (checked: boolean) => {
    setIsOnline(checked);
    if (checked) {
      // Simulate ride request appearing after going online
      setTimeout(() => setShowRideRequest(true), 2000);
    } else {
      setShowRideRequest(false);
    }
  };

  const handleAcceptRide = () => {
    setShowRideRequest(false);
    // Would navigate to active ride view
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
          <Link href="/">
            <a className="text-2xl font-bold bg-gradient-neon bg-clip-text text-transparent" data-testid="link-home">
              Libre Driver
            </a>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/profile">
              <Button variant="ghost" size="sm" data-testid="button-profile">
                Profile
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="border-accent text-accent" data-testid="button-connect-wallet">
              Connect Wallet
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Go Online Toggle */}
        <Card className="max-w-2xl mx-auto mb-8 bg-white/5 backdrop-blur-lg border-white/10 p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {isOnline ? (
                  <span className="text-neon-teal">You're Online</span>
                ) : (
                  <span>Go Online to Start Earning</span>
                )}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isOnline ? "Ready to accept rides" : "Toggle to start receiving ride requests"}
              </p>
            </div>
            <Switch
              checked={isOnline}
              onCheckedChange={handleGoOnline}
              className="data-[state=checked]:bg-neon-teal"
              data-testid="switch-go-online"
            />
          </div>
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
            ) : !showRideRequest ? (
              <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-8 text-center">
                <div className="animate-pulse">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-neon-teal" />
                  <p className="text-muted-foreground">Searching for riders...</p>
                </div>
              </Card>
            ) : (
              <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-6 border-neon-pink animate-pulse-glow" data-testid="card-ride-request">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-neon-pink">New Request</Badge>
                  <Badge variant="outline" className="text-neon-teal border-neon-teal">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    15% Surge
                  </Badge>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-neon-pink mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Pickup</p>
                      <p className="font-medium text-sm">Disney Springs</p>
                      <p className="text-xs text-muted-foreground">0.8 mi away</p>
                    </div>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Est. Earnings</span>
                    <span className="text-xl font-bold text-neon-teal" data-testid="text-request-earnings">$24.50</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Distance</span>
                    <span className="font-medium">8.2 mi</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowRideRequest(false)}
                    data-testid="button-decline-ride"
                  >
                    Decline
                  </Button>
                  <Button
                    className="flex-1 bg-neon-teal hover:bg-neon-teal/90"
                    onClick={handleAcceptRide}
                    data-testid="button-accept-ride"
                  >
                    Accept
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  Auto-decline in 15s
                </p>
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
