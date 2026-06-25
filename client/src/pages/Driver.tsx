import { DriverDashboard } from "@/components/driver/DriverDashboard";
import DemoDriverDashboard from "@/components/demo/DemoDriverDashboard";
import { Link } from "wouter";
import { Bell, Car } from "lucide-react";

function isAuthenticated(): boolean {
  try {
    return Object.keys(localStorage).some((k) => k.startsWith("firebase:authUser"));
  } catch {
    return false;
  }
}

export default function Driver() {
  const isDemoMode = !isAuthenticated();

  if (!isDemoMode) return <DriverDashboard />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link href="/">
            <span className="text-2xl font-bold bg-gradient-neon bg-clip-text text-transparent cursor-pointer">
              Libre Driver
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground border border-white/10 rounded-full px-3 py-1">
              Demo · Base Sepolia
            </span>
            <button
              type="button"
              aria-label="Notifications"
              className="relative rounded-full border border-white/10 p-2 text-muted-foreground hover:text-foreground"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-neon-pink" />
            </button>
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 px-2 py-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-neon">
                <Car className="h-4 w-4 text-white" />
              </span>
              <span className="pr-1 text-sm font-medium">Carlos M.</span>
            </div>
          </div>
        </div>
      </header>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <DemoDriverDashboard />
      </div>
    </div>
  );
}
