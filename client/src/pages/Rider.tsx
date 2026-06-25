import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPlaceholder } from '@/components/MapPlaceholder';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useRiderRide } from '@/hooks/useRiderRide';
import { useEscrowStatus } from '@/hooks/useEscrowStatus';
import { useEscrowDeposit } from '@/hooks/useEscrowDeposit';
import { getRiderViewState } from '@/lib/riderViewState';
import { FindingDriverPanel } from '@/components/FindingDriverPanel';
import { RiderEscrowPaymentCard } from '@/components/rider/RiderEscrowPaymentCard';
import { DriverAssignedPanel } from '@/components/DriverAssignedPanel';
import { RideInProgressPanel } from '@/components/RideInProgressPanel';
import { RideCompleteSummary } from '@/components/RideCompleteSummary';
import DemoRiderFlow from '@/components/demo/DemoRiderFlow';

function isAuthenticated(): boolean {
  try {
    // Check for Firebase auth token in localStorage (any firebase:authUser key)
    return Object.keys(localStorage).some((k) => k.startsWith('firebase:authUser'));
  } catch {
    return false;
  }
}

export default function Rider() {
  // Get rideId from URL query params
  const searchParams = new URLSearchParams(window.location.search);
  const rideId = searchParams.get('rideId');
  const isDemoMode = !isAuthenticated();

  // Hooks: REST for truth, WS for signals (disabled in demo mode)
  const ride = useRiderRide(isDemoMode ? '' : (rideId || ''));
  const escrow = useEscrowStatus(isDemoMode ? '' : (rideId || ''), !isDemoMode && !!rideId);
  const deposit = useEscrowDeposit(isDemoMode ? '' : (rideId || ''));

  // Deterministic state
  const viewState = getRiderViewState(ride.data, escrow.data);

  // Handlers
  const handlePay = () => {
    deposit.deposit();
  };

  const handleBookAgain = () => {
    window.location.href = '/book';
  };

  const handleSOS = () => {
    console.log('[Rider] SOS triggered for ride:', rideId);
    // TODO: Implement full SOS flow
    alert('SOS alert sent to support team');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link href="/" className="text-2xl font-bold bg-gradient-neon bg-clip-text text-transparent">
            Libre Rider
          </Link>
          <div className="flex items-center gap-3">
            {isDemoMode && (
              <span className="text-xs text-muted-foreground border border-white/10 rounded-full px-3 py-1">
                Demo · Base Sepolia
              </span>
            )}
            <Link href="/profile" asChild>
              <Button variant="ghost" size="sm">
                Profile
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Demo mode: no Firebase auth */}
        {isDemoMode ? (
          <div className="max-w-7xl mx-auto">
            <DemoRiderFlow />
          </div>
        ) : /* Authenticated ride flow */ !rideId || (ride.isLoading && !ride.data) ? (
          <Card className="p-8 bg-white/5 backdrop-blur-lg border-white/10 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-neon-teal" />
            <p className="text-muted-foreground">Loading ride details...</p>
          </Card>
        ) : ride.error ? (
          <Card className="p-8 bg-destructive/10 border-destructive/20">
            <div className="flex gap-4">
              <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-destructive mb-2">Error Loading Ride</h3>
                <p className="text-sm text-destructive/80 mb-4">{ride.error.message}</p>
                <Link href="/" asChild>
                  <Button size="sm" variant="outline">
                    Go Home
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ) : rideId && ride.data ? (
          <div className="grid md:grid-cols-3 gap-8">
            {/* Map - 2 columns */}
            <div className="md:col-span-2">
              <MapPlaceholder className="h-96" />
            </div>

            {/* Ride Status Panel - 1 column */}
            <div>
              {viewState === 'LOADING' && <FindingDriverPanel />}

              {viewState === 'FINDING_DRIVER' && <FindingDriverPanel />}

              {viewState === 'PAYMENT_REQUIRED' && (
                <RiderEscrowPaymentCard
                  amount={ride.data.estimatedPrice}
                  onDeposit={handlePay}
                  isLoading={deposit.isLoading}
                  error={deposit.error?.message}
                  status={deposit.status}
                  statusLabel={deposit.statusLabel}
                  isWalletReady={deposit.isWalletReady}
                  walletAddress={deposit.walletAddress}
                  approvalHash={deposit.approvalHash}
                  depositHash={deposit.depositHash}
                />
              )}

              {viewState === 'DRIVER_ASSIGNED' && (
                <DriverAssignedPanel
                  driver={ride.data.driver}
                  estimatedArrival={ride.data.estimatedDuration}
                />
              )}

              {viewState === 'IN_PROGRESS' && (
                <RideInProgressPanel
                  ride={ride.data}
                  onSOS={handleSOS}
                />
              )}

              {viewState === 'COMPLETED' && (
                <RideCompleteSummary
                  ride={ride.data}
                  onBookAgain={handleBookAgain}
                />
              )}

              {viewState === 'UNKNOWN' && (
                <Card className="p-6 bg-white/5 backdrop-blur-lg border-white/10 text-center space-y-4">
                  <p className="text-muted-foreground">Unknown ride state</p>
                  <Button
                    onClick={() => ride.refetch()}
                    variant="outline"
                    className="w-full"
                  >
                    Refresh
                  </Button>
                </Card>
              )}
            </div>
          </div>
        ) : !rideId ? (
          <Card className="p-8 bg-white/5 backdrop-blur-lg border-white/10 text-center space-y-4">
            <p className="text-muted-foreground">No ride selected</p>
            <Link href="/book" asChild>
              <Button>Book a Ride</Button>
            </Link>
          </Card>
        ) : null /* end authenticated flow */}
      </div>
    </div>
  );
}
