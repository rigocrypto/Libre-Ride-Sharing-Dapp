import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Car,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Star,
  Shield,
  RotateCcw,
  MapPin,
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

export default function DemoDriverDashboard() {
  const [online, setOnline] = useState(false);
  const [activeRideId, setActiveRideId] = useState<string | null>(null);
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

  return (
    <div className="space-y-5">
      {/* Driver card header */}
      <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <Car className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-bold">Carlos M.</p>
              <p className="text-sm text-muted-foreground">2022 Toyota Camry · Silver</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-sm">4.9</span>
                <span className="text-xs text-muted-foreground">· Founding Driver</span>
              </div>
            </div>
          </div>
          <div className="text-right space-y-2">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Verified
            </Badge>
            <Button
              size="sm"
              variant={online ? 'default' : 'outline'}
              onClick={() => setOnline((v) => !v)}
              className={online ? 'bg-green-500 hover:bg-green-600' : ''}
            >
              {online ? 'Online' : 'Go Online'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Offline state */}
      {!online && (
        <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-8 text-center space-y-3">
          <Car className="w-12 h-12 mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground">You are offline.</p>
          <p className="text-sm text-muted-foreground">Go online to see available rides.</p>
          <Button onClick={() => setOnline(true)}>Go Online</Button>
        </Card>
      )}

      {/* Active ride panel */}
      {online && activeRide && (
        <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Active Ride</h3>
            <Badge
              className={
                activeRide.status === 'driver_assigned'
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  : activeRide.status === 'in_progress'
                  ? 'bg-neon-pink/20 text-neon-pink border-neon-pink/30 animate-pulse'
                  : 'bg-green-500/20 text-green-400 border-green-500/30'
              }
            >
              {activeRide.status === 'driver_assigned'
                ? 'Assigned'
                : activeRide.status === 'in_progress'
                ? 'In Progress'
                : 'Completed'}
            </Badge>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <MapPin className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
              <span>{activeRide.pickup}</span>
            </div>
            <div className="flex gap-2">
              <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{activeRide.destination}</span>
            </div>
          </div>

          <Separator className="opacity-20" />

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Rider</span>
            <span>{activeRide.riderName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Fare</span>
            <span className="font-bold">{activeRide.fareUsdc} USDC</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Your payout</span>
            <span className="text-green-400 font-bold">{activeRide.driverPayoutUsd} USDC</span>
          </div>

          {/* Completed summary */}
          {activeRide.status === 'completed' && (
            <>
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                <CheckCircle2 className="w-8 h-8 mx-auto text-green-400 mb-2" />
                <p className="text-green-400 font-bold text-lg">+{activeRide.driverPayoutUsd} USDC</p>
                <p className="text-sm text-muted-foreground">Released from escrow</p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setActiveRideId(null);
                  qc.invalidateQueries({ queryKey: ['demo', 'driver', 'rides'] });
                }}
              >
                <RotateCcw className="mr-2 w-4 h-4" /> Back to Available Rides
              </Button>
            </>
          )}

          {/* Start ride button */}
          {activeRide.status === 'driver_assigned' && (
            <Button
              className="w-full"
              disabled={startMut.isPending}
              onClick={() => startMut.mutate(activeRide.id)}
            >
              {startMut.isPending ? (
                <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Starting…</>
              ) : (
                'Start Ride'
              )}
            </Button>
          )}

          {/* Complete ride button */}
          {activeRide.status === 'in_progress' && (
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={completeMut.isPending}
              onClick={() => completeMut.mutate(activeRide.id)}
            >
              {completeMut.isPending ? (
                <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Completing…</>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 w-4 h-4" /> Complete Ride & Release Escrow
                </>
              )}
            </Button>
          )}
        </Card>
      )}

      {/* Available rides list */}
      {online && !activeRide && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Available Rides
            </h3>
            {availableQuery.isFetching && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {availableQuery.isLoading && (
            <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-6 text-center">
              <Loader2 className="w-6 h-6 mx-auto animate-spin text-neon-teal" />
              <p className="mt-2 text-muted-foreground text-sm">Loading…</p>
            </Card>
          )}

          {!availableQuery.isLoading && (availableQuery.data?.rides ?? []).length === 0 && (
            <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-8 text-center space-y-2">
              <p className="text-muted-foreground">No rides available right now.</p>
              <p className="text-sm text-muted-foreground">
                Switch to the Rider tab and complete escrow to see a ride appear here.
              </p>
            </Card>
          )}

          {(availableQuery.data?.rides ?? []).map((ride) => (
            <Card
              key={ride.id}
              className="bg-white/5 backdrop-blur-lg border-white/10 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    <span className="truncate">{ride.pickup}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground ml-4" />
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span className="truncate">{ride.destination}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl font-bold text-green-400">{ride.driverPayoutUsd}</p>
                  <p className="text-xs text-muted-foreground">USDC payout</p>
                  <Badge className="mt-1 bg-green-500/20 text-green-400 border-green-500/30 text-xs">
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
                >
                  {acceptMut.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Accept'
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
