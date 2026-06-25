import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import DemoRiderProfile from '@/components/demo/DemoRiderProfile';

export default function RiderProfile() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-4">
          <Link href="/" className="bg-gradient-neon bg-clip-text text-2xl font-bold text-transparent">
            Libre Rider
          </Link>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground">
              Demo · Base Sepolia
            </span>
            <Link href="/rider" asChild>
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <DemoRiderProfile />
      </div>
    </div>
  );
}
