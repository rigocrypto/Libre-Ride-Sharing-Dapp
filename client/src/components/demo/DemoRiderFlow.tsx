import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  MapPin,
  ArrowRight,
  Loader2,
  Shield,
  Car,
  Star,
  CheckCircle2,
  Circle,
  Zap,
  RotateCcw,
} from 'lucide-react';

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

const QUICK_PICKUPS = [
  'Disney Springs, Lake Buena Vista',
  'I-Drive / Convention Center',
  'Downtown Orlando',
  'UCF Campus',
];

const QUICK_DESTINATIONS = [
  'MCO International Airport',
  'Universal Studios FL',
  'EPCOT, Walt Disney World',
  'Dr. Phillips Center',
  'Lake Nona Medical City',
];

const STATUS_LABEL: Record<string, string> = {
  payment_pending: 'Awaiting Payment',
  escrow_confirmed: 'Finding Driver…',
  driver_assigned: 'Driver On the Way',
  in_progress: 'Ride In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// ─── Step 1: Request form ──────────────────────────────────────────────────
function RequestForm({ onEstimate }: { onEstimate: (pickup: string, destination: string, name: string) => void }) {
  const [name, setName] = useState('');
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');

  return (
    <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Request a Ride</h2>
        <Badge variant="outline" className="text-xs text-neon-teal border-neon-teal/40">
          Demo · Base Sepolia
        </Badge>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground uppercase tracking-wide">Your name</label>
        <Input
          placeholder="e.g. Alex (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-muted/20"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground uppercase tracking-wide">Pickup</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
          <Input
            placeholder="Where are you?"
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
            className="pl-9 bg-muted/20"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PICKUPS.map((loc) => (
            <button
              key={loc}
              onClick={() => setPickup(loc)}
              className="text-xs px-2 py-0.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
            >
              {loc.split(',')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground uppercase tracking-wide">Destination</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
          <Input
            placeholder="Where to?"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="pl-9 bg-muted/20"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_DESTINATIONS.map((loc) => (
            <button
              key={loc}
              onClick={() => setDestination(loc)}
              className="text-xs px-2 py-0.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
            >
              {loc.split(',')[0]}
            </button>
          ))}
        </div>
      </div>

      <Button
        className="w-full"
        disabled={!pickup || !destination}
        onClick={() => onEstimate(pickup, destination, name || 'Demo Rider')}
      >
        Get Fare Estimate <ArrowRight className="ml-2 w-4 h-4" />
      </Button>
    </Card>
  );
}

// ─── Step 2: Fare estimate card ────────────────────────────────────────────
function FareCard({
  pickup,
  destination,
  riderName,
  onBack,
  onConfirm,
}: {
  pickup: string;
  destination: string;
  riderName: string;
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
      <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-8 text-center">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-neon-teal" />
        <p className="mt-3 text-muted-foreground">Calculating fare…</p>
      </Card>
    );

  if (error || !est)
    return (
      <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-6 space-y-4">
        <p className="text-destructive">{error?.message ?? 'Failed to load estimate'}</p>
        <Button variant="outline" onClick={onBack}>Try again</Button>
      </Card>
    );

  return (
    <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Fare Estimate</h2>
        <Badge className="bg-neon-teal/20 text-neon-teal border-neon-teal/30">
          {est.chain}
        </Badge>
      </div>

      {/* Route summary */}
      <div className="text-sm text-muted-foreground space-y-1">
        <div className="flex items-start gap-2">
          <MapPin className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
          <span>{pickup}</span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
          <span>{destination}</span>
        </div>
      </div>

      {/* Big fare number */}
      <div className="text-center py-4">
        <p className="text-5xl font-bold">{est.fareUsdc}</p>
        <p className="text-muted-foreground mt-1">USDC</p>
      </div>

      {/* Breakdown */}
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
          Confirm & Pay <ArrowRight className="ml-2 w-4 h-4" />
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
    <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold">Secure Escrow Payment</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your fare is held in a smart contract — released only when your ride completes.
        </p>
      </div>

      {/* Step progress */}
      <div className="space-y-3">
        {steps.map((s, i) => {
          const done = step > i;
          const active = step === i;
          return (
            <div
              key={s.label}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                done
                  ? 'bg-green-500/10 border-green-500/20'
                  : active
                  ? 'bg-white/10 border-white/20'
                  : 'border-transparent'
              }`}
            >
              {done ? (
                <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
              ) : (
                <Circle
                  className={`w-5 h-5 mt-0.5 shrink-0 ${active ? 'text-neon-teal' : 'text-muted-foreground/40'}`}
                />
              )}
              <div>
                <p className={`text-sm font-medium ${done ? 'text-green-400' : active ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s.label}
                </p>
                <p className="text-xs text-muted-foreground">{s.sublabel}</p>
              </div>
            </div>
          );
        })}
      </div>

      {verifyMut.error && (
        <p className="text-sm text-destructive">{verifyMut.error.message}</p>
      )}

      <Button
        className="w-full"
        onClick={handleSimulate}
        disabled={simulating || verifyMut.isPending}
      >
        {simulating || verifyMut.isPending ? (
          <>
            <Loader2 className="mr-2 w-4 h-4 animate-spin" /> Processing…
          </>
        ) : (
          <>
            <Zap className="mr-2 w-4 h-4" /> Simulate Escrow Payment (Demo)
          </>
        )}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Real wallet? Connect via RainbowKit on Base Sepolia and the contract will be called automatically.
      </p>
    </Card>
  );
}

// ─── Step 4+: Live ride status ─────────────────────────────────────────────
function RideStatusCard({
  rideId,
  onReset,
}: {
  rideId: string;
  onReset: () => void;
}) {
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
      <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-8 text-center">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-neon-teal" />
        <p className="mt-3 text-muted-foreground">Loading ride…</p>
      </Card>
    );

  if (ride.status === 'escrow_confirmed')
    return (
      <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-6 space-y-4 text-center">
        <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
          <Shield className="w-8 h-8 text-green-400" />
        </div>
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          Escrow Confirmed ✓
        </Badge>
        <h3 className="text-lg font-bold">Finding your LIBRE driver…</h3>
        <p className="text-sm text-muted-foreground">
          {ride.fareUsdc} USDC is secured in the escrow contract.
          Only compliance-verified drivers can see your ride.
        </p>
        {ride.escrowTxHash && (
          <div className="p-3 bg-muted/20 rounded-lg text-left">
            <p className="text-xs text-muted-foreground mb-1">Escrow TX</p>
            <p className="font-mono text-xs break-all text-neon-teal">
              {ride.escrowTxHash.slice(0, 20)}…{ride.escrowTxHash.slice(-10)}
            </p>
          </div>
        )}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Switch to the Driver tab to accept this ride</span>
        </div>
      </Card>
    );

  if (ride.status === 'driver_assigned')
    return (
      <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-6 space-y-4">
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Driver Assigned</Badge>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
            <Car className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-bold">{ride.driverName}</p>
            <p className="text-sm text-muted-foreground">{ride.vehicle}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">4.9</span>
              <span className="text-xs text-muted-foreground">· Founding Driver</span>
            </div>
          </div>
        </div>
        <Separator className="opacity-20" />
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pickup</span>
            <span>{ride.pickup}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dropoff</span>
            <span>{ride.destination}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Driver is on the way. Switch to the Driver tab to start the ride.
        </p>
      </Card>
    );

  if (ride.status === 'in_progress')
    return (
      <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-6 space-y-4">
        <Badge className="bg-neon-pink/20 text-neon-pink border-neon-pink/30 animate-pulse">
          Ride In Progress
        </Badge>
        <div className="text-center py-2">
          <Car className="w-12 h-12 mx-auto text-neon-pink mb-2" />
          <p className="font-bold">{ride.pickup}</p>
          <ArrowRight className="w-5 h-5 mx-auto my-1 text-muted-foreground" />
          <p className="font-bold">{ride.destination}</p>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Your ride is in progress. Switch to the Driver tab to complete it.
        </p>
      </Card>
    );

  if (ride.status === 'completed')
    return (
      <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-6 space-y-4">
        <div className="text-center">
          <CheckCircle2 className="w-14 h-14 mx-auto text-green-400 mb-3" />
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Ride Complete ✓</Badge>
          <h3 className="text-xl font-bold mt-3">Payment Released</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between font-semibold">
            <span>Fare</span>
            <span>{ride.fareUsdc} USDC</span>
          </div>
          <Separator className="opacity-20" />
          <div className="flex justify-between text-green-400">
            <span>Driver received</span>
            <span className="font-semibold">{ride.driverPayoutUsd} USDC</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Platform fee (3%)</span>
            <span>{ride.platformFeeUsd} USDC</span>
          </div>
        </div>
        {ride.escrowTxHash && (
          <div className="p-3 bg-muted/20 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Escrow TX</p>
            <p className="font-mono text-xs break-all text-neon-teal">
              {ride.escrowTxHash.slice(0, 20)}…{ride.escrowTxHash.slice(-10)}
            </p>
          </div>
        )}
        <Button className="w-full" variant="outline" onClick={onReset}>
          <RotateCcw className="mr-2 w-4 h-4" /> Book Another Ride
        </Button>
      </Card>
    );

  return null;
}

// ─── Root component ────────────────────────────────────────────────────────

type FlowStage =
  | { stage: 'request' }
  | { stage: 'estimate'; pickup: string; destination: string; riderName: string }
  | { stage: 'payment'; rideId: string; fareUsdc: number }
  | { stage: 'live'; rideId: string };

export default function DemoRiderFlow() {
  const [_location, setLocation] = useLocation();
  const qc = useQueryClient();

  // Check URL for rideId (supports deep-link back into live view)
  const searchParams = new URLSearchParams(window.location.search);
  const urlRideId = searchParams.get('rideId');

  const [flow, setFlow] = useState<FlowStage>(
    urlRideId ? { stage: 'live', rideId: urlRideId } : { stage: 'request' }
  );

  // Sync rideId into URL
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
    onSuccess: (data, vars) => {
      setFlow({ stage: 'payment', rideId: data.id, fareUsdc: vars.fareUsd });
    },
  });

  function handleEstimate(pickup: string, destination: string, riderName: string) {
    setFlow({ stage: 'estimate', pickup, destination, riderName });
  }

  function handleConfirmFare(est: FareEstimate & { pickup?: string; destination?: string; riderName?: string }) {
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

  if (flow.stage === 'request') return <RequestForm onEstimate={handleEstimate} />;

  if (flow.stage === 'estimate')
    return (
      <FareCard
        pickup={flow.pickup}
        destination={flow.destination}
        riderName={flow.riderName}
        onBack={() => setFlow({ stage: 'request' })}
        onConfirm={handleConfirmFare}
      />
    );

  if (createMut.isPending)
    return (
      <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-8 text-center">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-neon-teal" />
        <p className="mt-3 text-muted-foreground">Creating ride…</p>
      </Card>
    );

  if (flow.stage === 'payment')
    return <EscrowPayCard rideId={flow.rideId} fareUsdc={flow.fareUsdc} onDone={handleEscrowDone} />;

  if (flow.stage === 'live') return <RideStatusCard rideId={flow.rideId} onReset={handleReset} />;

  return null;
}
