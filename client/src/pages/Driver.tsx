import { DriverDashboard } from "@/components/driver/DriverDashboard";
import DemoDriverDashboard from "@/components/demo/DemoDriverDashboard";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <span className="text-2xl font-bold bg-gradient-neon bg-clip-text text-transparent cursor-pointer">
              Libre Driver
            </span>
          </Link>
          <span className="text-xs text-muted-foreground border border-white/10 rounded-full px-3 py-1">
            Demo · Base Sepolia
          </span>
        </div>
      </header>
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <DemoDriverDashboard />
      </div>
    </div>
  );
}
