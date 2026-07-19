import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Car,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Star,
  Shield,
  ShieldCheck,
  RotateCcw,
  MapPin,
  Navigation,
  Bell,
  Wallet,
  DollarSign,
  Calendar,
  Truck,
  Gift,
  Sparkles,
  Settings,
  LayoutDashboard,
  TrendingUp,
  Copy,
  Zap,
  Clock,
  Users,
  Lock,
  type LucideIcon,
} from 'lucide-react';
import {
  DRIVER_PROFILE,
  KPI_CARDS,
  NAV_ITEMS,
  WEEKLY_EARNINGS,
  EARNINGS_SUMMARY,
  WALLET,
  SAFETY_ITEMS,
  SAFETY_SCORE,
  AI_TIPS,
  NOTIFICATIONS,
  PROMO,
  DEMAND_HOTSPOTS,
  VEHICLE_MARKERS,
  SAMPLE_RIDES,
  SAMPLE_ACTIVE_RIDER,
} from '@/lib/demoDriverData';

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
}

const glass = 'bg-white/5 backdrop-blur-lg border-white/10';

const NAV_ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Car,
  DollarSign,
  Wallet,
  Calendar,
  Truck,
  ShieldCheck,
  Star,
  Gift,
  Sparkles,
  Settings,
};

export default function DemoDriverDashboard() {
  const [online, setOnline] = useState(false);
  const [activeRideId, setActiveRideId] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState('dashboard');
  const qc = useQueryClient();

  const availableQuery = useQuery<{ rides: DemoRide[] }>({
    queryKey: ['demo', 'driver', 'rides'],
    queryFn: () => demoFetch('GET', '/api/demo/driver/rides'),
    refetchInterval: online && !activeRideId ? 4000 : false,
    enabled: online,
  });

  const activeQuery = useQuery<DemoRide>({
    queryKey: ['demo', 'ride', activeRideId],
    queryFn: () => demoFetch('GET', `/api/demo/rides/${activeRideId}`),
    refetchInterval: 4000,
    enabled: !!activeRideId,
  });

  const acceptMut = useMutation({
    mutationFn: (id: string) => demoFetch<DemoRide>('POST', `/api/demo/rides/${id}/accept`),
    onSuccess: (ride) => {
      setActiveRideId(ride.id);
      qc.invalidateQueries({ queryKey: ['demo', 'driver', 'rides'] });
      qc.setQueryData(['demo', 'ride', ride.id], ride);
    },
  });

  const startMut = useMutation({
    mutationFn: (id: string) => demoFetch<DemoRide>('POST', `/api/demo/rides/${id}/start`),
    onSuccess: (ride) => qc.setQueryData(['demo', 'ride', ride.id], ride),
  });

  const completeMut = useMutation({
    mutationFn: (id: string) => demoFetch<DemoRide>('POST', `/api/demo/rides/${id}/complete`),
    onSuccess: (ride) => qc.setQueryData(['demo', 'ride', ride.id], ride),
  });

  const activeRide = activeQuery.data;
  const realRides = availableQuery.data?.rides ?? [];

  return (
    <div className="lg:flex lg:gap-6" data-testid="driver-dashboard">
      {/* Desktop navigation rail */}
      <aside className="hidden lg:block w-52 shrink-0">
        <Card className={cn(glass, 'sticky top-24 p-2')}>
          <nav className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = NAV_ICONS[item.icon] ?? Car;
              const active = item.key === activeNav;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveNav(item.key)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-gradient-neon text-white font-medium shadow-lg shadow-neon-purple/20'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </Card>
      </aside>

      {/* Mobile navigation pills */}
      <div className="lg:hidden -mx-4 mb-4 overflow-x-auto px-4 pb-1">
        <div className="flex gap-2 w-max">
          {NAV_ITEMS.map((item) => {
            const Icon = NAV_ICONS[item.icon] ?? Car;
            const active = item.key === activeNav;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveNav(item.key)}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition-colors',
                  active
                    ? 'border-transparent bg-gradient-neon text-white'
                    : 'border-white/10 bg-white/5 text-muted-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-6">
        <ProfileBar online={online} setOnline={setOnline} />

        <KpiGrid />

        {/* Core operations: live demand + available rides / active trip + side panels */}
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <DemandMapPanel />
            <RidesPanel
              online={online}
              setOnline={setOnline}
              activeRide={activeRide}
              realRides={realRides}
              isLoading={availableQuery.isLoading}
              isFetching={availableQuery.isFetching}
              acceptMut={acceptMut}
              startMut={startMut}
              completeMut={completeMut}
              onReset={() => {
                setActiveRideId(null);
                qc.invalidateQueries({ queryKey: ['demo', 'driver', 'rides'] });
              }}
            />
          </div>
          <div className="space-y-6">
            <AiAssistantCard />
            <NotificationsCard />
          </div>
        </div>

        {/* Earnings + wallet */}
        <div className="grid gap-6 lg:grid-cols-2">
          <EarningsCard />
          <WalletCard />
        </div>

        {/* Safety + promotions */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SafetyCard />
          <PromotionsCard />
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Profile bar ----------------------------- */

function ProfileBar({ online, setOnline }: { online: boolean; setOnline: (v: boolean) => void }) {
  return (
    <Card className={cn(glass, 'p-5')}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-neon">
            <Car className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold">{DRIVER_PROFILE.name}</p>
            <p className="text-sm text-muted-foreground">
              {DRIVER_PROFILE.vehicle} · {DRIVER_PROFILE.color} · {DRIVER_PROFILE.plate}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-sm">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                {DRIVER_PROFILE.rating}
              </span>
              <Badge className="border-green-500/30 bg-green-500/20 text-green-400">
                <Shield className="mr-1 h-3 w-3" /> Verified
              </Badge>
              <Badge className="border-neon-purple/30 bg-neon-purple/20 text-neon-purple">
                Founding Driver
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={cn(
              'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium',
              online
                ? 'bg-green-500/20 text-green-400'
                : 'bg-muted/40 text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                online ? 'animate-pulse bg-green-400' : 'bg-muted-foreground',
              )}
            />
            {online ? 'Online' : 'Offline'}
          </span>
          <Switch
            checked={online}
            onCheckedChange={setOnline}
            aria-label="Toggle online status"
          />
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------ KPI cards ------------------------------- */

function KpiGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {KPI_CARDS.map((kpi) => (
        <Card
          key={kpi.key}
          className={cn(glass, 'p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/20')}
          data-testid="kpi-card"
        >
          <p className="text-xs text-muted-foreground">{kpi.label}</p>
          <p className="mt-1 text-lg font-bold tracking-tight">{kpi.value}</p>
          {kpi.hint && <p className="mt-0.5 text-[11px] text-neon-teal">{kpi.hint}</p>}
        </Card>
      ))}
    </div>
  );
}

/* --------------------------- Live demand map ---------------------------- */

function DemandMapPanel() {
  return (
    <Card className={cn(glass, 'relative h-64 overflow-hidden p-0')}>
      {/* Stylized mock map (no Mapbox dependency) */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black">
        <svg className="h-full w-full opacity-[0.15]">
          <defs>
            <pattern id="demand-grid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M 36 0 L 0 0 0 36" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#demand-grid)" />
        </svg>
        {/* Route line */}
        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <line
            x1="32%" y1="28%" x2="70%" y2="64%"
            stroke="url(#routeGradient)" strokeWidth="2.5" strokeDasharray="6 6"
          />
          <defs>
            <linearGradient id="routeGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#2dd4bf" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Hotspots */}
      {DEMAND_HOTSPOTS.map((spot) => (
        <div
          key={spot.label}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ top: `${spot.top}%`, left: `${spot.left}%` }}
        >
          <span
            className={cn(
              'absolute -inset-4 rounded-full',
              spot.level === 'High'
                ? 'animate-ping bg-neon-pink/20'
                : 'bg-neon-teal/10',
            )}
          />
          <span className="relative flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-[11px] font-medium backdrop-blur-md">
            <MapPin className="h-3 w-3 text-neon-pink" />
            {spot.label}
          </span>
        </div>
      ))}

      {/* Nearby driver markers */}
      {VEHICLE_MARKERS.map((marker) => (
        <div
          key={marker.id}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ top: `${marker.top}%`, left: `${marker.left}%` }}
        >
          <span
            className={cn(
              'absolute -inset-2.5 rounded-full',
              marker.state === 'available' ? 'animate-pulse bg-green-400/20' : 'bg-blue-400/20'
            )}
          />
          <span
            className={cn(
              'relative flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold backdrop-blur-md',
              marker.state === 'available'
                ? 'border-green-400/40 bg-green-400/15 text-green-200'
                : 'border-blue-400/40 bg-blue-400/15 text-blue-200'
            )}
          >
            <Car className="h-3 w-3" />
            {marker.id}
            <span className="text-[9px] text-white/80">{marker.heading}</span>
          </span>
        </div>
      ))}

      {/* Overlays */}
      <div className="absolute left-3 top-3 flex items-center gap-2">
        <Badge className="border-neon-pink/30 bg-neon-pink/20 text-neon-pink">
          <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-neon-pink" />
          Live
        </Badge>
        <Badge className="border-white/10 bg-background/70 text-foreground backdrop-blur-md">
          High Demand · Downtown
        </Badge>
      </div>
      <div className="absolute bottom-3 left-3 rounded-lg bg-background/70 px-3 py-1.5 text-xs backdrop-blur-md">
        <span className="text-muted-foreground">Nearby requests: </span>
        <span className="font-semibold text-neon-teal">7 active</span>
      </div>
      <div className="absolute bottom-3 right-3 rounded-lg bg-background/70 px-3 py-1.5 text-xs backdrop-blur-md">
        <span className="text-muted-foreground">Drivers nearby: </span>
        <span className="font-semibold text-green-300">{VEHICLE_MARKERS.length}</span>
      </div>
    </Card>
  );
}

/* ------------------------ Rides / active trip --------------------------- */

type Mut = {
  isPending: boolean;
  mutate: (id: string) => void;
};

function RidesPanel({
  online,
  setOnline,
  activeRide,
  realRides,
  isLoading,
  isFetching,
  acceptMut,
  startMut,
  completeMut,
  onReset,
}: {
  online: boolean;
  setOnline: (v: boolean) => void;
  activeRide: DemoRide | undefined;
  realRides: DemoRide[];
  isLoading: boolean;
  isFetching: boolean;
  acceptMut: Mut;
  startMut: Mut;
  completeMut: Mut;
  onReset: () => void;
}) {
  const showcaseRide = activeRide ?? realRides[0];

  if (!online) {
    return (
      <Card className={cn(glass, 'space-y-3 p-8 text-center')}>
        <Car className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">You are offline.</p>
        <p className="text-sm text-muted-foreground">Go online to receive escrow-confirmed rides.</p>
        <Button onClick={() => setOnline(true)}>Go Online</Button>
      </Card>
    );
  }

  if (activeRide) {
    return (
      <ActiveTripCard
        ride={activeRide}
        startMut={startMut}
        completeMut={completeMut}
        onReset={onReset}
      />
    );
  }

  return (
    <div className="space-y-3">
      <ActiveTripShowcase ride={showcaseRide} hasActiveTrip={!!activeRide} />

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Available Rides
        </h3>
        {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {isLoading && (
        <Card className={cn(glass, 'p-6 text-center')}>
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-neon-teal" />
          <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
        </Card>
      )}

      {/* Real escrow-confirmed rides — preserves the existing accept lifecycle */}
      {realRides.map((ride) => (
        <Card
          key={ride.id}
          className={cn(glass, 'space-y-3 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/20')}
          data-testid="available-ride"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-green-400" />
                <span className="truncate">{ride.pickup}</span>
              </div>
              <ArrowRight className="ml-4 h-3.5 w-3.5 text-muted-foreground" />
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-red-400" />
                <span className="truncate">{ride.destination}</span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xl font-bold text-green-400">{ride.driverPayoutUsd}</p>
              <p className="text-xs text-muted-foreground">USDC payout</p>
              <Badge className="mt-1 border-green-500/30 bg-green-500/20 text-xs text-green-400">
                Escrow ✓
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {ride.distanceMiles > 0 && `${ride.distanceMiles} mi · `}
              Rider: {ride.riderName}
            </div>
            <Button
              size="sm"
              disabled={acceptMut.isPending}
              onClick={() => acceptMut.mutate(ride.id)}
              className="transition hover:scale-[1.02]"
            >
              {acceptMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Accept'}
            </Button>
          </div>
        </Card>
      ))}

      {/* Improved empty state + sample preview when no real rides exist */}
      {!isLoading && realRides.length === 0 && (
        <>
          <Card className={cn(glass, 'space-y-3 p-8 text-center')} data-testid="rides-empty-state">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neon-teal/15">
              <Clock className="h-6 w-6 text-neon-teal" />
            </div>
            <p className="font-semibold">Waiting for escrow-confirmed rides</p>
            <p className="text-sm text-muted-foreground">
              Complete a ride request from the Rider demo to send a verified trip to this dashboard.
            </p>
            <Link href="/rider">
              <Button className="bg-gradient-neon">Open Rider Demo</Button>
            </Link>
            <p className="text-xs text-muted-foreground">
              Drivers only see rides after escrow confirmation in this demo.
            </p>
          </Card>

          <div className="flex items-center gap-2 pt-1">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Sample requests (preview)
            </span>
          </div>
          {SAMPLE_RIDES.map((ride) => (
            <Card
              key={ride.id}
              className={cn(glass, 'space-y-3 p-4 opacity-70 transition duration-300 hover:border-white/20')}
              data-testid="sample-ride"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-green-400" />
                    <span className="truncate">{ride.pickup}</span>
                  </div>
                  <ArrowRight className="ml-4 h-3.5 w-3.5 text-muted-foreground" />
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-red-400" />
                    <span className="truncate">{ride.destination}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xl font-bold">{ride.fare}</p>
                  <Badge className="mt-1 border-neon-pink/30 bg-neon-pink/20 text-xs text-neon-pink">
                    {ride.surge}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>{ride.etaMin} min ETA</span>
                <span>· {ride.pickupDistanceMi} mi away</span>
                <span>· {ride.tripDistanceMi} mi trip</span>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[11px] text-muted-foreground">
                  Demo sample · not actionable
                </Badge>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" disabled>Decline</Button>
                  <Button size="sm" disabled>Accept</Button>
                </div>
              </div>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

function ActiveTripShowcase({
  ride,
  hasActiveTrip,
}: {
  ride: DemoRide | undefined;
  hasActiveTrip: boolean;
}) {
  const title = hasActiveTrip ? 'Live Active Trip' : 'Active Trip Showcase';
  const pickup = ride?.pickup ?? 'Downtown Orlando';
  const destination = ride?.destination ?? 'MCO Airport';
  const riderName = ride?.riderName ?? SAMPLE_ACTIVE_RIDER.name;
  const payout = ride?.driverPayoutUsd ?? 24.8;

  return (
    <Card className={cn(glass, 'overflow-hidden p-0')} data-testid="active-trip-showcase">
      <div className="relative border-b border-white/10 bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-neon-pink/15 px-4 py-3">
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-neon-teal to-neon-pink" />
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">Trip readiness</p>
            <h4 className="text-base font-semibold text-white">{title}</h4>
          </div>
          <Badge className={cn(
            'border px-2.5 py-1 text-[11px]',
            hasActiveTrip
              ? 'border-green-500/40 bg-green-500/15 text-green-300'
              : 'border-blue-500/40 bg-blue-500/15 text-blue-300'
          )}>
            {hasActiveTrip ? 'In lifecycle' : 'Preview always on'}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Rider and OTP verification</p>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <p className="font-medium text-white">{riderName}</p>
                <p className="text-xs text-muted-foreground">Confirm rider enters OTP before departure</p>
              </div>
              <div className="rounded-lg border border-neon-teal/40 bg-neon-teal/15 px-3 py-1.5 text-center">
                <p className="text-[10px] uppercase tracking-wide text-neon-teal">OTP</p>
                <p className="font-mono text-lg font-bold tracking-[0.2em] text-neon-teal">{SAMPLE_ACTIVE_RIDER.otp}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-3">
              <p className="text-[11px] uppercase tracking-wide text-green-300">Pickup</p>
              <p className="mt-1 text-sm font-medium">{pickup}</p>
            </div>
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
              <p className="text-[11px] uppercase tracking-wide text-red-300">Drop-off</p>
              <p className="mt-1 text-sm font-medium">{destination}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Navigate state</p>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Navigation className="h-4 w-4 text-blue-300" />
              <span>ETA to pickup: 5 min</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-neon-pink" />
              <span>Route confidence: High demand corridor</span>
            </div>
          </div>

          <div className="rounded-xl border border-neon-teal/30 bg-neon-teal/10 p-3 text-right">
            <p className="text-[11px] uppercase tracking-wide text-neon-teal">Estimated payout</p>
            <p className="mt-1 text-2xl font-black text-neon-teal">${payout.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Escrow-confirmed release on completion</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function TripStage({ label, state }: { label: string; state: 'done' | 'active' | 'todo' }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <span
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold',
          state === 'done' && 'bg-green-500/20 text-green-400',
          state === 'active' && 'animate-pulse bg-neon-pink/20 text-neon-pink',
          state === 'todo' && 'bg-muted/40 text-muted-foreground',
        )}
      >
        {state === 'done' ? '✓' : '•'}
      </span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

function ActiveTripCard({
  ride,
  startMut,
  completeMut,
  onReset,
}: {
  ride: DemoRide;
  startMut: Mut;
  completeMut: Mut;
  onReset: () => void;
}) {
  const stageState = (stage: 'pickup' | 'progress' | 'dropoff'): 'done' | 'active' | 'todo' => {
    if (ride.status === 'driver_assigned') {
      return stage === 'pickup' ? 'active' : 'todo';
    }
    if (ride.status === 'in_progress') {
      if (stage === 'pickup') return 'done';
      if (stage === 'progress') return 'active';
      return 'todo';
    }
    return 'done'; // completed
  };

  return (
    <Card className={cn(glass, 'space-y-4 p-6 transition duration-300 hover:border-white/20')} data-testid="active-trip">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Active Trip</h3>
        <Badge
          className={
            ride.status === 'driver_assigned'
              ? 'border-blue-500/30 bg-blue-500/20 text-blue-400'
              : ride.status === 'in_progress'
                ? 'animate-pulse border-neon-pink/30 bg-neon-pink/20 text-neon-pink'
                : 'border-green-500/30 bg-green-500/20 text-green-400'
          }
        >
          {ride.status === 'driver_assigned'
            ? 'Assigned'
            : ride.status === 'in_progress'
              ? 'In Progress'
              : 'Completed'}
        </Badge>
      </div>

      {/* Rider */}
      <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neon-purple/20">
            <Users className="h-5 w-5 text-neon-purple" />
          </div>
          <div>
            <p className="text-sm font-medium">{ride.riderName || SAMPLE_ACTIVE_RIDER.name}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {SAMPLE_ACTIVE_RIDER.rating}
              <Badge className="ml-1 border-green-500/30 bg-green-500/20 px-1.5 py-0 text-[10px] text-green-400">
                Verified
              </Badge>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-muted-foreground">PIN</p>
          <p className="font-mono text-lg font-bold tracking-widest text-neon-teal">
            {SAMPLE_ACTIVE_RIDER.otp}
          </p>
        </div>
      </div>

      {/* Stages */}
      <div className="flex items-center">
        <TripStage label="Pickup" state={stageState('pickup')} />
        <div className="h-px flex-1 bg-white/10" />
        <TripStage label="In progress" state={stageState('progress')} />
        <div className="h-px flex-1 bg-white/10" />
        <TripStage label="Drop-off" state={stageState('dropoff')} />
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
          <span>{ride.pickup}</span>
        </div>
        <div className="flex gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <span>{ride.destination}</span>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Rider OTP and navigation checklist</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-neon-teal/30 bg-neon-teal/10 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-neon-teal">OTP confirmation</p>
            <p className="font-mono text-base font-bold tracking-[0.22em] text-neon-teal">{SAMPLE_ACTIVE_RIDER.otp}</p>
          </div>
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-blue-300">Navigate state</p>
            <p className="text-sm font-medium">ETA 5 min · Traffic moderate</p>
          </div>
        </div>
      </div>

      <Separator className="opacity-20" />

      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Fare</span>
        <span className="font-bold">{ride.fareUsdc} USDC</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Estimated earnings</span>
        <span className="font-bold text-green-400">{ride.driverPayoutUsd} USDC</span>
      </div>

      {ride.status === 'completed' && (
        <>
          <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-400" />
            <p className="text-lg font-bold text-green-400">+{ride.driverPayoutUsd} USDC</p>
            <p className="text-sm text-muted-foreground">Released from escrow</p>
          </div>
          <Button variant="outline" className="w-full" onClick={onReset}>
            <RotateCcw className="mr-2 h-4 w-4" /> Back to Available Rides
          </Button>
        </>
      )}

      {ride.status === 'driver_assigned' && (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-200" disabled>
            <Navigation className="mr-2 h-4 w-4" /> Navigate
          </Button>
          <Button disabled={startMut.isPending} onClick={() => startMut.mutate(ride.id)}>
            {startMut.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting…</>
            ) : (
              'Start Ride'
            )}
          </Button>
        </div>
      )}

      {ride.status === 'in_progress' && (
        <Button
          className="w-full bg-green-600 hover:bg-green-700"
          disabled={completeMut.isPending}
          onClick={() => completeMut.mutate(ride.id)}
        >
          {completeMut.isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Completing…</>
          ) : (
            <><CheckCircle2 className="mr-2 h-4 w-4" /> Complete Ride & Release Escrow</>
          )}
        </Button>
      )}
    </Card>
  );
}

/* ----------------------------- Side panels ------------------------------ */

function AiAssistantCard() {
  return (
    <Card className={cn(glass, 'relative overflow-hidden space-y-3 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-neon-purple/30')}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(217,70,239,0.2),transparent_40%),radial-gradient(circle_at_20%_100%,rgba(45,212,191,0.16),transparent_42%)]" />
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-neon-purple" />
        <h3 className="font-semibold">AI Assistant</h3>
      </div>
      <ul className="relative space-y-2">
        {AI_TIPS.map((tip) => (
          <li key={tip} className="flex gap-2 rounded-lg border border-white/10 bg-white/5 p-2 text-sm text-muted-foreground transition hover:border-neon-teal/30 hover:bg-neon-teal/10">
            <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neon-teal" />
            {tip}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function NotificationsCard() {
  const toneClass: Record<string, string> = {
    info: 'bg-blue-400',
    success: 'bg-green-400',
    warning: 'bg-yellow-400',
  };
  return (
    <Card className={cn(glass, 'space-y-3 p-5')}>
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-neon-teal" />
        <h3 className="font-semibold">Notifications</h3>
      </div>
      <ul className="space-y-3">
        {NOTIFICATIONS.map((n) => (
          <li key={n.id} className="flex gap-3">
            <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', toneClass[n.tone])} />
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

/* ------------------------------- Earnings ------------------------------- */

function EarningsCard() {
  const max = Math.max(...WEEKLY_EARNINGS.map((b) => b.amount));
  return (
    <Card className={cn(glass, 'space-y-4 p-5')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-400" />
          <h3 className="font-semibold">Earnings Overview</h3>
        </div>
        <span className="text-xs text-muted-foreground">This week</span>
      </div>

      {/* CSS-only bar chart (no chart dependency) */}
      <div className="flex h-32 items-end gap-2">
        {WEEKLY_EARNINGS.map((bar) => (
          <div key={bar.day} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t bg-gradient-to-t from-neon-purple to-neon-teal"
              style={{ height: `${Math.round((bar.amount / max) * 100)}%` }}
              title={`${bar.day}: $${bar.amount}`}
            />
            <span className="text-[10px] text-muted-foreground">{bar.day}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-3 text-center">
        <Stat label="Total" value={`$${EARNINGS_SUMMARY.total.toFixed(0)}`} />
        <Stat label="Rides" value={`${EARNINGS_SUMMARY.rides}`} />
        <Stat label="Online" value={`${EARNINGS_SUMMARY.onlineHours}h`} />
        <Stat label="Avg/ride" value={`$${EARNINGS_SUMMARY.avgPerRide.toFixed(2)}`} />
        <Stat label="Bonuses" value={`$${EARNINGS_SUMMARY.bonuses.toFixed(0)}`} />
        <Stat label="Tips" value={`$${EARNINGS_SUMMARY.tips.toFixed(2)}`} />
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-bold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

/* -------------------------- Wallet & payouts ---------------------------- */

function WalletCard() {
  return (
    <Card className={cn(glass, 'space-y-4 p-5 transition duration-300 hover:border-white/20')}>
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4 text-neon-teal" />
        <h3 className="font-semibold">Wallet & Payouts</h3>
      </div>

      <div className="rounded-2xl border border-neon-teal/30 bg-gradient-to-r from-neon-teal/15 via-cyan-500/10 to-neon-pink/10 p-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-neon-teal">Primary payout balance</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <p className="text-3xl font-black text-neon-teal">{WALLET.usdcBalance}</p>
          <Badge className="border-green-500/30 bg-green-500/15 text-green-300">Payout ready</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs text-muted-foreground">Cash balance</p>
          <p className="text-lg font-bold">{WALLET.cashBalance}</p>
        </div>
        <div className="rounded-xl border border-neon-teal/30 bg-neon-teal/10 p-3">
          <p className="text-xs text-neon-teal">USDC wallet</p>
          <p className="text-lg font-bold text-neon-teal">{WALLET.usdcBalance}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Payout method</span>
        <span className="text-right">{WALLET.payoutMethod}</span>
      </div>

      <Button className="w-full bg-gradient-to-r from-neon-teal/80 to-cyan-500/80 text-slate-900 hover:from-neon-teal hover:to-cyan-400" disabled>
        Cash Out Instantly · Demo only
      </Button>
      <p className="text-center text-[11px] text-muted-foreground">
        Testnet demo — no real funds are moved.
      </p>

      <Separator className="opacity-20" />
      <ul className="space-y-2">
        {WALLET.transactions.map((tx) => (
          <li key={tx.id} className="flex items-center justify-between text-sm">
            <div className="min-w-0">
              <p className="truncate">{tx.label}</p>
              <p className="text-[11px] text-muted-foreground">{tx.when}</p>
            </div>
            <span className={cn('font-medium', tx.positive ? 'text-green-400' : 'text-red-400')}>
              {tx.amount}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ------------------------------- Safety --------------------------------- */

function SafetyCard() {
  return (
    <Card className={cn(glass, 'space-y-4 p-5')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-green-400" />
          <h3 className="font-semibold">Safety & Compliance</h3>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-green-400">{SAFETY_SCORE}</p>
          <p className="text-[11px] text-muted-foreground">Safety score</p>
        </div>
      </div>

      <ul className="space-y-2">
        {SAFETY_ITEMS.map((item) => (
          <li key={item.key} className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            {item.label}
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-3 gap-2">
        <Button variant="outline" size="sm" disabled className="text-red-400">
          SOS
        </Button>
        <Button variant="outline" size="sm" disabled>
          Share trip
        </Button>
        <Button variant="outline" size="sm" disabled>
          Report
        </Button>
      </div>
      <p className="text-center text-[11px] text-muted-foreground">
        Emergency tools are preview-only in this demo.
      </p>
    </Card>
  );
}

/* ---------------------------- Promotions -------------------------------- */

function PromotionsCard() {
  const pct = Math.round((PROMO.bonusEarned / PROMO.bonusGoal) * 100);
  return (
    <Card className={cn(glass, 'space-y-4 p-5')}>
      <div className="flex items-center gap-2">
        <Gift className="h-4 w-4 text-neon-pink" />
        <h3 className="font-semibold">Promotions & Referrals</h3>
      </div>

      <p className="text-sm text-muted-foreground">{PROMO.campaign}</p>

      <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
        <div>
          <p className="text-[11px] text-muted-foreground">Your referral code</p>
          <p className="font-mono font-bold tracking-widest text-white">{PROMO.referralCode}</p>
        </div>
        <Button size="sm" variant="outline">
          <Copy className="mr-1 h-3.5 w-3.5" /> Invite drivers
        </Button>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {PROMO.bonusEarned} of {PROMO.bonusGoal} drivers · {PROMO.bonusReward}
          </span>
          <span>{pct}%</span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>
    </Card>
  );
}
