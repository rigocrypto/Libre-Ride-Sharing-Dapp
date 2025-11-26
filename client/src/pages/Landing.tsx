import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CountdownWidget } from "@/components/CountdownWidget";
import { WaitlistForm } from "@/components/WaitlistForm";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Car, Shield, Zap, DollarSign, TrendingUp, Users } from "lucide-react";
import { Link } from "wouter";
import orlandoSkyline from "@assets/generated_images/orlando_skyline_dusk_panorama.png";
import driverPhoto from "@assets/generated_images/professional_rideshare_driver_portrait.png";
import fleetCollage from "@assets/generated_images/modern_fleet_vehicle_collage.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/40 border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-neon flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-neon bg-clip-text text-transparent">
              Libre
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="/rider" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-rider">
              For Riders
            </Link>
            <Link href="/driver" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-driver">
              For Drivers
            </Link>
            <LanguageToggle />
          </div>

          <div className="flex items-center gap-4">
            <Link href="/rider" asChild>
              <Button variant="outline" size="sm" className="border-accent text-accent" data-testid="button-nav-ride">
                Request Ride
              </Button>
            </Link>
            <Link href="/driver" asChild>
              <Button size="sm" className="bg-neon-pink hover:bg-neon-pink/90" data-testid="button-nav-drive">
                Drive with Libre
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${orlandoSkyline})` }}
        />
        <div className="absolute inset-0 bg-gradient-dark-overlay" />
        
        {/* Animated cars */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Car className="absolute top-1/3 w-8 h-8 text-neon-teal opacity-60 animate-slide-left" style={{ left: '0%' }} />
          <Car className="absolute top-2/3 w-8 h-8 text-neon-pink opacity-60 animate-slide-right" style={{ right: '0%' }} />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-neon bg-clip-text text-transparent">
              Web3 Ride-Sharing
            </span>
            <br />
            <span className="text-foreground">Powered by You</span>
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto mb-12">
            The future of ridesharing is here. Earn more as a driver, pay less as a rider.
            <br />
            <span className="text-neon-teal font-semibold">Launching in Orlando, Florida</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/driver" asChild>
              <Button size="lg" className="bg-neon-pink hover:bg-neon-pink/90 text-white font-semibold px-8 py-6 text-lg rounded-full" data-testid="button-hero-driver">
                Become a Driver
              </Button>
            </Link>
            <Link href="/rider" asChild>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-neon-teal text-neon-teal hover:bg-neon-teal/10 font-semibold px-8 py-6 text-lg rounded-full"
                data-testid="button-hero-rider"
              >
                Request a Ride
              </Button>
            </Link>
          </div>

          <div className="max-w-2xl mx-auto">
            <CountdownWidget />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            How <span className="bg-gradient-neon bg-clip-text text-transparent">Libre</span> Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Instant Matching",
                description: "Advanced algorithms match you with nearby drivers in seconds using real-time data.",
              },
              {
                icon: DollarSign,
                title: "USDC Payments",
                description: "Pay with USDC on Base. Instant, transparent, and secure blockchain payments.",
              },
              {
                icon: Shield,
                title: "Complete Safety",
                description: "End-to-end encryption, verified drivers, and 24/7 SOS support for peace of mind.",
              },
            ].map((feature) => (
              <Card key={feature.title} className="bg-white/5 backdrop-blur-lg border-white/10 p-8 hover-elevate" data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="w-16 h-16 rounded-2xl bg-gradient-neon flex items-center justify-center mb-6">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Driver Benefits */}
      <section className="py-24 bg-muted/5">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src={driverPhoto}
                alt="Professional driver"
                className="rounded-2xl w-full h-auto object-cover"
              />
            </div>
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-8">
                Drive. Earn. <span className="text-neon-teal">Thrive.</span>
              </h2>
              <div className="space-y-6">
                {[
                  { icon: TrendingUp, title: "97-100% of Fare", description: "Keep almost every dollar you earn. No hidden fees." },
                  { icon: Zap, title: "Instant Payouts", description: "Get paid immediately in USDC after every ride." },
                  { icon: Users, title: "Flexible Schedule", description: "Drive when you want. Be your own boss." },
                  { icon: Shield, title: "Insurance Included", description: "Full coverage while you're on the road." },
                ].map((benefit) => (
                  <div key={benefit.title} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                      <p className="text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/driver">
                <Button size="lg" className="mt-8 bg-neon-pink hover:bg-neon-pink/90 px-8" data-testid="button-become-driver">
                  Start Driving Today
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Fleet */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-8">
            Premium Fleet
          </h2>
          <p className="text-xl text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            All vehicles are verified, insured, and maintained to the highest standards.
          </p>
          <img
            src={fleetCollage}
            alt="Libre fleet vehicles"
            className="rounded-2xl w-full max-w-5xl mx-auto"
          />
        </div>
      </section>

      {/* Waitlist CTA */}
      <section className="py-24 bg-gradient-neon relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Join the Revolution
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            Be the first to experience Web3 ridesharing when we launch in Orlando.
          </p>
          <WaitlistForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background/40 backdrop-blur-xl border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-neon flex items-center justify-center">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Libre</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Web3 ride-sharing for the future.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Riders</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/rider"><a className="hover:text-foreground transition-colors">Request Ride</a></Link></li>
                <li><Link href="/profile"><a className="hover:text-foreground transition-colors">My Profile</a></Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Drivers</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/driver"><a className="hover:text-foreground transition-colors">Drive with Us</a></Link></li>
                <li><Link href="/profile"><a className="hover:text-foreground transition-colors">Dashboard</a></Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Safety</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground pt-8 border-t border-white/10">
            <p>&copy; 2025 Libre. Built on Base. Powered by Web3.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
