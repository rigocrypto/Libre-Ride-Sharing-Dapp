import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  MapPin,
  ArrowRight,
  Loader2,
  Shield,
  ShieldCheck,
  Car,
  Star,
  CheckCircle2,
  Circle,
  Zap,
  RotateCcw,
  Receipt,
  BadgeCheck,
  Palmtree,
  Wallet,
  Bell,
  Sparkles,
  Share2,
  Siren,
  KeyRound,
  MessageCircle,
  Navigation,
  Clock,
  Plane,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import {
  RIDER_PROFILE,
  TRUST_BADGES,
  ORLANDO_DESTINATIONS,
  RIDE_PACKAGES,
  ESCROW_FLOW_STEPS,
  RIDER_STATUS_STEPS,
  getRiderStatusStep,
  DRIVER_MATCH,
  SAFETY_FEATURES,
  RIDER_NOTIFICATIONS,
  AI_TRAVEL_TIPS,
  ITINERARY,
  RECENT_RIDES,
  RIDER_WALLET,
  RIDER_MAP_HOTSPOTS,
  QUICK_PICKUPS,
  QUICK_DESTINATIONS,
  type OrlandoDestination,
  type RiderStage,
} from '@/lib/demoRiderData';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function demoFetch<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = `${res.status}`;
    try { msg = JSON.parse(text).error ?? msg; } catch { msg = text.slice(0, 80) || msg; }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

interface FareEstimate {
  fareUsd: number;
  fareUsdc: number;
  distanceMiles: number;
  durationMin: number;
  platformFeeUsd: number;
  driverPayoutUsd: number;
  platformFeeBps: number;
  currency: string;
  chain: string;
}

interface DemoRide {
  id: string;
  riderName: string;
  pickup: string;
  destination: string;
  fareUsd: number;
  fareUsdc: number;
  distanceMiles: number;
  durationMin: number;
  platformFeeUsd: number;
  driverPayoutUsd: number;
  status: string;
  escrowTxHash?: string;
  driverName?: string;
  vehicle?: string;
  createdAt: string;
}

const glass = 'bg-white/5 backdrop-blur-lg border-white/10';

const TRUST_ICONS: Record<string, LucideIcon> = { ShieldCheck, Receipt, BadgeCheck, Palmtree };
const SAFETY_ICONS: Record<string, LucideIcon> = { Share2, Siren, KeyRound, MessageCircle };

// ─── Step 1: Request form (controlled by root so presets can prefill) ──────
function RequestForm({
  name,
  pickup,
  destination,
  setName,
  setPickup,
  setDestination,
  onEstimate,
}: {
  name: string;
  pickup: string;
  destination: string;
  setName: (v: string) => void;
  setPickup: (v: string) => void;
  setDestination: (v: string) => void;
  onEstimate: () => void;
}) {
  return (
    <Card className={cn(glass, 'space-y-5 p-6')} data-testid="rider-booking">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Book Your Ride</h2>
        <Badge variant="outline" className="border-neon-teal/40 text-xs text-neon-teal">
          Demo · Base Sepolia
        </Badge>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-muted-foreground">
        Plan your first Orlando ride — choose a popular destination below or enter pickup
        and drop-off. This demo shows how LIBRE protects riders and drivers with
        escrow-confirmed rides.
      </div>

      <div className="space-y-1">
        <label className="text-xs uppercase tracking-wide text-muted-foreground">Your name</label>
        <Input
          placeholder="e.g. Alex (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-muted/20"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wide text-muted-foreground">Pickup</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-400" />
          <Input
            placeholder="Where are you?"
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
            className="bg-muted/20 pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PICKUPS.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setPickup(loc)}
              className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs transition-colors hover:bg-white/10"
            >
              {loc.split('(')[0].trim().split(',')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wide text-muted-foreground">Destination</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-400" />
          <Input
            placeholder="Where to?"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="bg-muted/20 pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_DESTINATIONS.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setDestination(loc)}
              className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs transition-colors hover:bg-white/10"
            >
              {loc.split(',')[0]}
            </button>
          ))}
        </div>
      </div>

      <Button className="w-full bg-gradient-neon" disabled={!pickup || !destination} onClick={onEstimate}>
        Get Fare Estimate <ArrowRight className="ml-2 h-4 w-4" />
      </Button>

      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
        New here?
        <Link href="/driver" className="inline-flex items-center font-medium text-neon-teal hover:underline">
          Open Driver Demo <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </Card>
  );
}

// ─── Step 2: Fare estimate card ────────────────────────────────────────────
function FareCard({
  pickup,
  destination,
  onBack,
  onConfirm,
}: {
  pickup: string;
  destination: string;
  onBack: () => void;
  onConfirm: (est: FareEstimate) => void;
}) {
  const { data: est, isLoading, error } = useQuery<FareEstimate>({
    queryKey: ['demo', 'estimate', pickup, destination],
    queryFn: () => demoFetch('POST', '/api/demo/rides/estimate', { pickup, destination }),
    staleTime: 60_000,
  });

  if (isLoading)
    return (
      <Card className={cn(glass, 'p-8 text-center')} data-testid="rider-booking">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-neon-teal" />
        <p className="mt-3 text-muted-foreground">Calculating fare…</p>
      </Card>
    );

  if (error || !est)
    return (
      <Card className={cn(glass, 'space-y-4 p-6')} data-testid="rider-booking">
        <p className="text-destructive">{error?.message ?? 'Failed to load estimate'}</p>
        <Button variant="outline" onClick={onBack}>Try again</Button>
      </Card>
    );

  return (
    <Card className={cn(glass, 'space-y-5 p-6')} data-testid="rider-booking">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Fare Estimate</h2>
        <Badge className="border-neon-teal/30 bg-neon-teal/20 text-neon-teal">{est.chain}</Badge>
      </div>

      <div className="space-y-1 text-sm text-muted-foreground">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" />
          <span>{pickup}</span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
          <span>{destination}</span>
        </div>
      </div>

      <div className="py-4 text-center">
        <p className="text-5xl font-bold">{est.fareUsdc}</p>
        <p className="mt-1 text-muted-foreground">USDC · Estimated (Demo)</p>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Distance</span>
          <span>{est.distanceMiles} mi</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Est. time</span>
          <span>{est.durationMin} min</span>
        </div>
        <Separator className="opacity-20" />
        <div className="flex justify-between text-green-400">
          <span>Driver payout</span>
          <span className="font-semibold">{est.driverPayoutUsd} USDC</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Platform fee (3%)</span>
          <span>{est.platformFeeUsd} USDC</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onBack}>Back</Button>
        <Button className="flex-1" onClick={() => onConfirm(est)}>
          Confirm & Pay <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

// ─── Step 3: Escrow payment UI ─────────────────────────────────────────────
function EscrowPayCard({
  rideId,
  fareUsdc,
  onDone,
}: {
  rideId: string;
  fareUsdc: number;
  onDone: () => void;
}) {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [simulating, setSimulating] = useState(false);

  const verifyMut = useMutation({
    mutationFn: (txHash?: string) =>
      demoFetch<{ status: string; escrowTxHash: string }>('POST', `/api/demo/rides/${rideId}/escrow-verify`, { txHash }),
    onSuccess: onDone,
  });

  const steps = [
    { label: 'Connect Wallet', sublabel: 'RainbowKit · Base Sepolia' },
    { label: 'Approve USDC Spend', sublabel: `Allow escrow contract to spend ${fareUsdc} USDC` },
    { label: `Deposit ${fareUsdc} USDC`, sublabel: 'Funds held until ride completes' },
  ];

  async function handleSimulate() {
    setSimulating(true);
    for (let i = 0; i <= 3; i++) {
      await new Promise<void>((r) => setTimeout(r, 500));
      setStep(i as 0 | 1 | 2 | 3);
    }
    verifyMut.mutate(undefined);
  }

  return (
    <Card className={cn(glass, 'space-y-5 p-6')} data-testid="rider-booking">
      <div>
        <h2 className="text-xl font-bold">Secure Escrow Payment</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your fare is held in a smart contract — released only when your ride completes.
        </p>
      </div>

      <div className="space-y-3">
        {steps.map((s, i) => {
          const done = step > i;
          const active = step === i;
          return (
            <div
              key={s.label}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                done ? 'border-green-500/20 bg-green-500/10' : active ? 'border-white/20 bg-white/10' : 'border-transparent',
              )}
            >
              {done ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
              ) : (
                <Circle className={cn('mt-0.5 h-5 w-5 shrink-0', active ? 'text-neon-teal' : 'text-muted-foreground/40')} />
              )}
              <div>
                <p className={cn('text-sm font-medium', done ? 'text-green-400' : active ? 'text-foreground' : 'text-muted-foreground')}>
                  {s.label}
                </p>
                <p className="text-xs text-muted-foreground">{s.sublabel}</p>
              </div>
            </div>
          );
        })}
      </div>

      {verifyMut.error && <p className="text-sm text-destructive">{verifyMut.error.message}</p>}

      <Button className="w-full" onClick={handleSimulate} disabled={simulating || verifyMut.isPending}>
        {simulating || verifyMut.isPending ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…</>
        ) : (
          <><Zap className="mr-2 h-4 w-4" /> Simulate Escrow Payment (Demo)</>
        )}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Real wallet? Connect via RainbowKit on Base Sepolia and the contract will be called automatically.
      </p>
    </Card>
  );
}

// ─── Step 4+: Live ride status ─────────────────────────────────────────────
function RideStatusCard({ rideId, onReset }: { rideId: string; onReset: () => void }) {
  const { data: ride, isLoading } = useQuery<DemoRide>({
    queryKey: ['demo', 'ride', rideId],
    queryFn: () => demoFetch('GET', `/api/demo/rides/${rideId}`),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status || status === 'completed' || status === 'cancelled') return false;
      return 3000;
    },
  });

  if (isLoading || !ride)
    return (
      <Card className={cn(glass, 'p-8 text-center')} data-testid="rider-booking">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-neon-teal" />
        <p className="mt-3 text-muted-foreground">Loading ride…</p>
      </Card>
    );

  if (ride.status === 'escrow_confirmed')
    return (
      <Card className={cn(glass, 'space-y-4 p-6 text-center')} data-testid="rider-booking">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
          <Shield className="h-8 w-8 text-green-400" />
        </div>
        <Badge className="border-green-500/30 bg-green-500/20 text-green-400">Escrow Confirmed ✓</Badge>
        <h3 className="text-lg font-bold">Finding your LIBRE driver…</h3>
        <p className="text-sm text-muted-foreground">
          {ride.fareUsdc} USDC is secured in the escrow contract. Only compliance-verified
          drivers can see your ride.
        </p>
        {ride.escrowTxHash && (
          <div className="rounded-lg bg-muted/20 p-3 text-left">
            <p className="mb-1 text-xs text-muted-foreground">Escrow TX</p>
            <p className="break-all font-mono text-xs text-neon-teal">
              {ride.escrowTxHash.slice(0, 20)}…{ride.escrowTxHash.slice(-10)}
            </p>
          </div>
        )}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Switch to the Driver tab to accept this ride</span>
        </div>
      </Card>
    );

  if (ride.status === 'driver_assigned')
    return (
      <Card className={cn(glass, 'space-y-4 p-6')} data-testid="rider-booking">
        <Badge className="border-blue-500/30 bg-blue-500/20 text-blue-400">Driver Assigned</Badge>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
            <Car className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-bold">{ride.driverName}</p>
            <p className="text-sm text-muted-foreground">{ride.vehicle}</p>
            <div className="mt-0.5 flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">4.9</span>
              <span className="text-xs text-muted-foreground">· Founding Driver</span>
            </div>
          </div>
        </div>
        <Separator className="opacity-20" />
        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Pickup</span><span>{ride.pickup}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Dropoff</span><span>{ride.destination}</span></div>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Driver is on the way. Switch to the Driver tab to start the ride.
        </p>
      </Card>
    );

  if (ride.status === 'in_progress')
    return (
      <Card className={cn(glass, 'space-y-4 p-6')} data-testid="rider-booking">
        <Badge className="animate-pulse border-neon-pink/30 bg-neon-pink/20 text-neon-pink">Ride In Progress</Badge>
        <div className="py-2 text-center">
          <Car className="mx-auto mb-2 h-12 w-12 text-neon-pink" />
          <p className="font-bold">{ride.pickup}</p>
          <ArrowRight className="mx-auto my-1 h-5 w-5 text-muted-foreground" />
          <p className="font-bold">{ride.destination}</p>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Your ride is in progress. Switch to the Driver tab to complete it.
        </p>
      </Card>
    );

  if (ride.status === 'completed')
    return (
      <Card className={cn(glass, 'space-y-4 p-6')} data-testid="rider-booking">
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-3 h-14 w-14 text-green-400" />
          <Badge className="border-green-500/30 bg-green-500/20 text-green-400">Ride Complete ✓</Badge>
          <h3 className="mt-3 text-xl font-bold">Payment Released</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between font-semibold"><span>Fare</span><span>{ride.fareUsdc} USDC</span></div>
          <Separator className="opacity-20" />
          <div className="flex justify-between text-green-400"><span>Driver received</span><span className="font-semibold">{ride.driverPayoutUsd} USDC</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Platform fee (3%)</span><span>{ride.platformFeeUsd} USDC</span></div>
        </div>
        {ride.escrowTxHash && (
          <div className="rounded-lg bg-muted/20 p-3">
            <p className="mb-1 text-xs text-muted-foreground">Escrow TX</p>
            <p className="break-all font-mono text-xs text-neon-teal">
              {ride.escrowTxHash.slice(0, 20)}…{ride.escrowTxHash.slice(-10)}
            </p>
          </div>
        )}
        <Button className="w-full" variant="outline" onClick={onReset}>
          <RotateCcw className="mr-2 h-4 w-4" /> Book Another Ride
        </Button>
      </Card>
    );

  return null;
}

// ─── Root dashboard ────────────────────────────────────────────────────────

type FlowStage =
  | { stage: 'request' }
  | { stage: 'estimate'; pickup: string; destination: string; riderName: string }
  | { stage: 'payment'; rideId: string; fareUsdc: number }
  | { stage: 'live'; rideId: string };

export default function DemoRiderFlow() {
  const [, setLocation] = useLocation();
  void setLocation;
  const qc = useQueryClient();

  const searchParams = new URLSearchParams(window.location.search);
  const urlRideId = searchParams.get('rideId');

  const [flow, setFlow] = useState<FlowStage>(
    urlRideId ? { stage: 'live', rideId: urlRideId } : { stage: 'request' },
  );

  // Lifted booking-form inputs so Orlando destination presets can prefill them.
  const [name, setName] = useState('');
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');

  useEffect(() => {
    if (flow.stage === 'live' || flow.stage === 'payment') {
      const id = 'rideId' in flow ? flow.rideId : '';
      const next = `?rideId=${id}`;
      if (window.location.search !== next) window.history.replaceState(null, '', next);
    }
  }, [flow]);

  const createMut = useMutation({
    mutationFn: (body: { riderName: string; pickup: string; destination: string; fareUsd: number; distanceMiles: number; durationMin: number }) =>
      demoFetch<{ id: string; status: string }>('POST', '/api/demo/rides', body),
    onSuccess: (data, vars) => setFlow({ stage: 'payment', rideId: data.id, fareUsdc: vars.fareUsd }),
  });

  // Read-only observer of the live ride (shares cache key with RideStatusCard,
  // which drives the polling) — powers the side stepper / driver match / wallet.
  const liveRideId = flow.stage === 'live' ? flow.rideId : '';
  const { data: liveRide } = useQuery<DemoRide>({
    queryKey: ['demo', 'ride', liveRideId],
    queryFn: () => demoFetch('GET', `/api/demo/rides/${liveRideId}`),
    enabled: !!liveRideId,
  });

  function handleEstimate() {
    if (!pickup || !destination) return;
    setFlow({ stage: 'estimate', pickup, destination, riderName: name || 'Demo Rider' });
  }

  function handleConfirmFare(est: FareEstimate) {
    if (flow.stage !== 'estimate') return;
    createMut.mutate({
      riderName: flow.riderName,
      pickup: flow.pickup,
      destination: flow.destination,
      fareUsd: est.fareUsd,
      distanceMiles: est.distanceMiles,
      durationMin: est.durationMin,
    });
  }

  function handleEscrowDone() {
    if (flow.stage !== 'payment') return;
    qc.invalidateQueries({ queryKey: ['demo', 'ride', flow.rideId] });
    setFlow({ stage: 'live', rideId: flow.rideId });
  }

  function handleReset() {
    window.history.replaceState(null, '', window.location.pathname);
    setFlow({ stage: 'request' });
  }

  function applyPreset(dest: OrlandoDestination) {
    setPickup(dest.pickup);
    setDestination(dest.destination);
    setFlow({ stage: 'request' });
    document.getElementById('rider-booking-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Resolve the active booking-flow card for the current stage.
  let bookingCard: JSX.Element;
  if (flow.stage === 'request') {
    bookingCard = (
      <RequestForm
        name={name}
        pickup={pickup}
        destination={destination}
        setName={setName}
        setPickup={setPickup}
        setDestination={setDestination}
        onEstimate={handleEstimate}
      />
    );
  } else if (flow.stage === 'estimate') {
    bookingCard = (
      <FareCard
        pickup={flow.pickup}
        destination={flow.destination}
        onBack={() => setFlow({ stage: 'request' })}
        onConfirm={handleConfirmFare}
      />
    );
  } else if (createMut.isPending) {
    bookingCard = (
      <Card className={cn(glass, 'p-8 text-center')} data-testid="rider-booking">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-neon-teal" />
        <p className="mt-3 text-muted-foreground">Creating ride…</p>
      </Card>
    );
  } else if (flow.stage === 'payment') {
    bookingCard = <EscrowPayCard rideId={flow.rideId} fareUsdc={flow.fareUsdc} onDone={handleEscrowDone} />;
  } else {
    bookingCard = <RideStatusCard rideId={flow.rideId} onReset={handleReset} />;
  }

  const activeStep = getRiderStatusStep(flow.stage as RiderStage, liveRide?.status);

  return (
    <div className="space-y-6" data-testid="rider-dashboard">
      <HeroBand />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <TripProfileBar />
          <div id="rider-booking-anchor">{bookingCard}</div>
          <OrlandoMapPanel ride={liveRide} pickup={pickup} destination={destination} />
        </div>
        <div className="space-y-6">
          <CurrentTripStepper activeStep={activeStep} ride={liveRide} />
          <DriverMatchPanel ride={liveRide} />
          <WalletPanel ride={liveRide} />
          <NotificationsPanel />
          <AiTipsPanel />
        </div>
      </div>

      <DestinationsSection onUse={applyPreset} />
      <PackagesSection />

      <div className="grid gap-6 lg:grid-cols-2">
        <HowItWorksPanel />
        <SafetyPanel />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ItineraryPanel />
        <RecentRidesPanel />
      </div>
    </div>
  );
}

/* ------------------------------- Hero ----------------------------------- */

function HeroBand() {
  return (
    <Card className={cn(glass, 'relative overflow-hidden p-6')}>
      <div className="absolute inset-0 -z-0 bg-gradient-to-br from-neon-purple/20 via-blue-600/10 to-neon-teal/15" />
      <div className="relative space-y-4">
        <p className="text-sm text-neon-teal">Welcome to LIBRE Rider</p>
        <h1 className="text-2xl font-black sm:text-3xl">
          Book transparent, escrow-protected rides across Orlando.
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Perfect for airport pickups, hotels, theme parks, conventions, and local trips.
        </p>
        <div className="flex flex-wrap gap-2">
          {TRUST_BADGES.map((b) => {
            const Icon = TRUST_ICONS[b.icon] ?? ShieldCheck;
            return (
              <span
                key={b.label}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium"
                data-testid="trust-badge"
              >
                <Icon className="h-3.5 w-3.5 text-neon-teal" />
                {b.label}
              </span>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

/* --------------------------- Trip profile ------------------------------- */

function TripProfileBar() {
  const items = [
    { label: 'Rider', value: RIDER_PROFILE.name },
    { label: 'Trip Type', value: RIDER_PROFILE.tripType },
    { label: 'Payment', value: RIDER_PROFILE.payment },
    { label: 'Safety Mode', value: RIDER_PROFILE.safetyMode },
    { label: 'Language', value: RIDER_PROFILE.language },
  ];
  return (
    <Card className={cn(glass, 'p-4')}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((it) => (
          <div key={it.label}>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{it.label}</p>
            <p className="truncate text-sm font-medium">{it.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* --------------------------- Live map mock ------------------------------ */

function OrlandoMapPanel({ ride, pickup, destination }: { ride?: DemoRide; pickup: string; destination: string }) {
  const pin = (kind: string) =>
    kind === 'pickup' ? 'text-green-400' : kind === 'destination' ? 'text-red-400' : 'text-neon-teal';
  return (
    <Card className={cn(glass, 'relative h-64 overflow-hidden p-0')}>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black">
        <svg className="h-full w-full opacity-[0.15]">
          <defs>
            <pattern id="rider-grid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M 36 0 L 0 0 0 36" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#rider-grid)" />
        </svg>
        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <line x1="72%" y1="70%" x2="24%" y2="60%" stroke="url(#riderRoute)" strokeWidth="2.5" strokeDasharray="6 6" />
          <defs>
            <linearGradient id="riderRoute" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {RIDER_MAP_HOTSPOTS.map((spot) => (
        <div key={spot.label} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ top: `${spot.top}%`, left: `${spot.left}%` }}>
          {spot.kind === 'hotspot' && <span className="absolute -inset-3 rounded-full bg-neon-teal/10" />}
          <span className="relative flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-[11px] font-medium backdrop-blur-md">
            <MapPin className={cn('h-3 w-3', pin(spot.kind))} />
            {spot.label}
          </span>
        </div>
      ))}

      <div className="absolute left-3 top-3 flex items-center gap-2">
        <Badge className="border-neon-teal/30 bg-neon-teal/20 text-neon-teal">
          <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-neon-teal" /> Live Orlando Map
        </Badge>
      </div>
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <span className="rounded-lg bg-background/70 px-3 py-1.5 text-xs backdrop-blur-md">
          {ride ? `${ride.pickup} → ${ride.destination}` : pickup && destination ? `${pickup} → ${destination}` : 'Nearby verified drivers'}
        </span>
        <Badge className="border-white/10 bg-background/70 text-foreground backdrop-blur-md">ETA 18 min</Badge>
      </div>
    </Card>
  );
}

/* ------------------------- Current trip stepper ------------------------- */

function CurrentTripStepper({ activeStep, ride }: { activeStep: number; ride?: DemoRide }) {
  return (
    <Card className={cn(glass, 'space-y-4 p-5')} data-testid="rider-status-stepper">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Your Current Trip</h3>
        {ride && <Badge className="border-green-500/30 bg-green-500/20 text-green-400">Escrow Confirmed</Badge>}
      </div>
      <ol className="space-y-3">
        {RIDER_STATUS_STEPS.map((label, i) => {
          const state = i < activeStep ? 'done' : i === activeStep ? 'active' : 'todo';
          return (
            <li key={label} className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                  state === 'done' && 'bg-green-500/20 text-green-400',
                  state === 'active' && 'animate-pulse bg-neon-teal/20 text-neon-teal',
                  state === 'todo' && 'bg-muted/40 text-muted-foreground',
                )}
              >
                {state === 'done' ? '✓' : i + 1}
              </span>
              <div className="flex-1">
                <p className={cn('text-sm', state === 'todo' ? 'text-muted-foreground' : 'font-medium')}>{label}</p>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {state === 'done' ? 'Completed' : state === 'active' ? 'In progress' : 'Pending'}
              </span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

/* --------------------------- Driver match ------------------------------- */

function DriverMatchPanel({ ride }: { ride?: DemoRide }) {
  const real = ride?.status === 'driver_assigned' || ride?.status === 'in_progress' || ride?.status === 'completed';
  const name = real && ride?.driverName ? ride.driverName : DRIVER_MATCH.name;
  const vehicle = real && ride?.vehicle ? ride.vehicle : `${DRIVER_MATCH.vehicle} · ${DRIVER_MATCH.color}`;
  return (
    <Card className={cn(glass, 'space-y-3 p-5')}>
      <h3 className="font-semibold">{real ? 'Your Driver' : 'Driver Match (Preview)'}</h3>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
          <Car className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="font-bold">{name}</p>
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {DRIVER_MATCH.rating}
            <Badge className="ml-1 border-green-500/30 bg-green-500/20 px-1.5 py-0 text-[10px] text-green-400">
              <BadgeCheck className="mr-0.5 h-2.5 w-2.5" /> Verified
            </Badge>
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{vehicle}</p>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3.5 w-3.5" /> ETA {DRIVER_MATCH.etaMin} min</span>
        <span className="flex items-center gap-1 text-green-400"><ShieldCheck className="h-3.5 w-3.5" /> Safety verified</span>
      </div>
      {!real && <p className="text-[11px] text-muted-foreground">You'll see real info once a driver is assigned.</p>}
    </Card>
  );
}

/* ------------------------------ Wallet ---------------------------------- */

function WalletPanel({ ride }: { ride?: DemoRide }) {
  return (
    <Card className={cn(glass, 'space-y-3 p-5')}>
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4 text-neon-teal" />
        <h3 className="font-semibold">Wallet (Demo)</h3>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">USDC Balance</p>
        <p className="text-2xl font-bold text-neon-teal">{RIDER_WALLET.usdcBalance}</p>
      </div>
      <div className="rounded-lg bg-white/5 p-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Escrow status</span>
          <span className="font-medium">{ride ? 'Locked' : 'Idle'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Held in escrow</span>
          <span className="font-mono">{ride ? `${ride.fareUsdc} USDC` : RIDER_WALLET.escrowAmount}</span>
        </div>
      </div>
      <p className="text-center text-[11px] text-muted-foreground">Demo mode only — no real funds are moved.</p>
    </Card>
  );
}

/* --------------------------- Notifications ------------------------------ */

function NotificationsPanel() {
  const tone: Record<string, string> = { info: 'bg-blue-400', success: 'bg-green-400', warning: 'bg-yellow-400' };
  return (
    <Card className={cn(glass, 'space-y-3 p-5')}>
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-neon-teal" />
        <h3 className="font-semibold">Notifications</h3>
      </div>
      <ul className="space-y-3">
        {RIDER_NOTIFICATIONS.map((n) => (
          <li key={n.id} className="flex gap-3">
            <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', tone[n.tone])} />
            <div className="min-w-0">
              <p className="text-sm font-medium">{n.title}</p>
              <p className="truncate text-xs text-muted-foreground">{n.detail}</p>
            </div>
            <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{n.when}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ----------------------------- AI tips ---------------------------------- */

function AiTipsPanel() {
  return (
    <Card className={cn(glass, 'space-y-3 p-5')}>
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-neon-purple" />
        <h3 className="font-semibold">Orlando AI Assistant</h3>
      </div>
      <ul className="space-y-2">
        {AI_TRAVEL_TIPS.map((tip) => (
          <li key={tip} className="flex gap-2 text-sm text-muted-foreground">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neon-teal" />
            {tip}
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* -------------------------- Destinations -------------------------------- */

function DestinationsSection({ onUse }: { onUse: (d: OrlandoDestination) => void }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold">Popular Orlando Destinations</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ORLANDO_DESTINATIONS.map((d) => (
          <Card key={d.key} className={cn(glass, 'flex flex-col gap-2 p-4')} data-testid="rider-destination-card">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold leading-tight">{d.name}</p>
              <Plane className="h-4 w-4 shrink-0 text-neon-teal" />
            </div>
            <p className="text-xs text-muted-foreground">{d.description}</p>
            <p className="text-xs text-muted-foreground">
              {d.durationMin} min · {d.distanceMiles} mi · {d.suggestedPackage}
            </p>
            <Button size="sm" variant="outline" className="mt-auto" onClick={() => onUse(d)}>
              Use this route <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- Packages --------------------------------- */

function PackagesSection() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Ride Packages</h2>
        <Badge variant="outline" className="text-[11px] text-muted-foreground">Demo pricing</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {RIDE_PACKAGES.map((p) => (
          <Card key={p.key} className={cn(glass, 'space-y-1 p-4')} data-testid="rider-package-card">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{p.name}</p>
              {p.tag && <Badge className="border-neon-pink/30 bg-neon-pink/20 text-[10px] text-neon-pink">{p.tag}</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">{p.subtitle}</p>
            <p className="text-2xl font-bold">{p.price}</p>
            <p className="text-xs text-muted-foreground">{p.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* --------------------------- How it works ------------------------------- */

function HowItWorksPanel() {
  return (
    <Card className={cn(glass, 'space-y-4 p-5')}>
      <div>
        <h3 className="font-semibold">How it Works (Escrow Protection)</h3>
        <p className="text-sm text-muted-foreground">
          Your ride is confirmed only after demo escrow is verified — this protects both riders and drivers.
        </p>
      </div>
      <ol className="space-y-3">
        {ESCROW_FLOW_STEPS.map((s, i) => (
          <li key={s.label} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neon-teal/15 text-[11px] font-bold text-neon-teal">
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-medium">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

/* ------------------------------ Safety ---------------------------------- */

function SafetyPanel() {
  return (
    <Card className={cn(glass, 'space-y-4 p-5')}>
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-green-400" />
        <h3 className="font-semibold">Safety & Travel Support</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {SAFETY_FEATURES.map((f) => {
          const Icon = SAFETY_ICONS[f.icon] ?? Shield;
          return (
            <div key={f.key} className="rounded-xl bg-white/5 p-3">
              <Icon className="mb-1 h-4 w-4 text-neon-teal" />
              <p className="text-sm font-medium">{f.label}</p>
              <p className="text-[11px] text-muted-foreground">{f.detail}</p>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">Safety tools are preview-only in this demo.</p>
    </Card>
  );
}

/* ---------------------------- Itinerary --------------------------------- */

function ItineraryPanel() {
  return (
    <Card className={cn(glass, 'space-y-3 p-5')}>
      <h3 className="font-semibold">Your Itinerary</h3>
      <ul className="space-y-2">
        {ITINERARY.map((it) => (
          <li key={it.id} className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neon-teal/15">
              {it.status === 'scheduled' ? <Plane className="h-4 w-4 text-neon-teal" /> : <Navigation className="h-4 w-4 text-neon-teal" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{it.title}</p>
              <p className="text-xs text-muted-foreground">{it.when}</p>
            </div>
            <Badge variant="outline" className="text-[10px] capitalize text-muted-foreground">{it.status}</Badge>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function RecentRidesPanel() {
  return (
    <Card className={cn(glass, 'space-y-3 p-5')}>
      <h3 className="font-semibold">Recent Rides (Demo)</h3>
      <ul className="divide-y divide-white/5">
        {RECENT_RIDES.map((r) => (
          <li key={r.id} className="flex items-center justify-between py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{r.title}</p>
              <p className="text-xs text-muted-foreground">{r.when}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{r.price}</p>
              <p className="text-[11px] text-green-400">Completed</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
