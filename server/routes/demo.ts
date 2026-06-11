import { Router } from 'express';
import { z } from 'zod';

const router = Router();

// ------- In-memory demo store -------

type DemoStatus =
  | 'payment_pending'
  | 'escrow_confirmed'
  | 'driver_assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

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
  status: DemoStatus;
  escrowTxHash?: string;
  driverId?: string;
  driverName?: string;
  vehicle?: string;
  createdAt: string;
  updatedAt: string;
}

const demoRides = new Map<string, DemoRide>();

const PLATFORM_FEE_BPS = 300; // 3 %

function estimateFare(destination: string) {
  const isAirport = /\b(mco|airport|international)\b/i.test(destination);
  const distanceMiles = parseFloat(
    (isAirport ? 15 + Math.random() * 10 : 4 + Math.random() * 12).toFixed(1)
  );
  const durationMin = Math.round(distanceMiles * 3 + Math.random() * 5);
  const base = 8 + distanceMiles * 1.8 + durationMin * 0.3 + (isAirport ? 3.5 : 0);
  const fareUsd = parseFloat(base.toFixed(2));
  const platformFeeUsd = parseFloat(((fareUsd * PLATFORM_FEE_BPS) / 10000).toFixed(2));
  const driverPayoutUsd = parseFloat((fareUsd - platformFeeUsd).toFixed(2));
  return { fareUsd, fareUsdc: fareUsd, distanceMiles, durationMin, platformFeeUsd, driverPayoutUsd };
}

function mockTxHash() {
  return `0x${Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')}`;
}

// --- Routes ---

// POST /api/demo/rides/estimate
router.post('/api/demo/rides/estimate', (req, res) => {
  const parsed = z
    .object({ pickup: z.string().min(2), destination: z.string().min(2) })
    .safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });

  const est = estimateFare(parsed.data.destination);
  res.json({ ...est, platformFeeBps: PLATFORM_FEE_BPS, currency: 'USDC', chain: 'Base Sepolia' });
});

// POST /api/demo/rides
router.post('/api/demo/rides', (req, res) => {
  const parsed = z
    .object({
      riderName: z.string().min(1).default('Demo Rider'),
      pickup: z.string().min(2),
      destination: z.string().min(2),
      fareUsd: z.number().positive(),
      distanceMiles: z.number().positive().optional(),
      durationMin: z.number().int().positive().optional(),
    })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const { riderName, pickup, destination, fareUsd, distanceMiles, durationMin } = parsed.data;
  const platformFeeUsd = parseFloat(((fareUsd * PLATFORM_FEE_BPS) / 10000).toFixed(2));
  const driverPayoutUsd = parseFloat((fareUsd - platformFeeUsd).toFixed(2));

  const ride: DemoRide = {
    id: crypto.randomUUID(),
    riderName,
    pickup,
    destination,
    fareUsd,
    fareUsdc: fareUsd,
    distanceMiles: distanceMiles ?? 0,
    durationMin: durationMin ?? 0,
    platformFeeUsd,
    driverPayoutUsd,
    status: 'payment_pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  demoRides.set(ride.id, ride);
  res.status(201).json({ id: ride.id, status: ride.status });
});

// GET /api/demo/rides/:id
router.get('/api/demo/rides/:id', (req, res) => {
  const ride = demoRides.get(req.params.id);
  if (!ride) return res.status(404).json({ error: 'Ride not found' });
  res.json(ride);
});

// POST /api/demo/rides/:id/escrow-verify  (simulates on-chain confirmation)
router.post('/api/demo/rides/:id/escrow-verify', (req, res) => {
  const ride = demoRides.get(req.params.id);
  if (!ride) return res.status(404).json({ error: 'Ride not found' });
  if (ride.status !== 'payment_pending') {
    return res.status(409).json({ error: `Cannot verify escrow in status: ${ride.status}` });
  }

  const body = z.object({ txHash: z.string().optional() }).safeParse(req.body);
  const txHash = body.success && body.data.txHash ? body.data.txHash : mockTxHash();

  const updated: DemoRide = {
    ...ride,
    status: 'escrow_confirmed',
    escrowTxHash: txHash,
    updatedAt: new Date().toISOString(),
  };
  demoRides.set(ride.id, updated);
  res.json({ id: ride.id, status: updated.status, escrowTxHash: txHash });
});

// GET /api/demo/driver/rides — only escrow_confirmed rides are visible to drivers
router.get('/api/demo/driver/rides', (_req, res) => {
  const available = Array.from(demoRides.values())
    .filter((r) => r.status === 'escrow_confirmed')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ rides: available });
});

// POST /api/demo/rides/:id/accept
router.post('/api/demo/rides/:id/accept', (req, res) => {
  const ride = demoRides.get(req.params.id);
  if (!ride) return res.status(404).json({ error: 'Ride not found' });
  if (ride.status !== 'escrow_confirmed') {
    return res.status(409).json({ error: `Cannot accept ride in status: ${ride.status}` });
  }
  const updated: DemoRide = {
    ...ride,
    status: 'driver_assigned',
    driverId: 'demo-driver-1',
    driverName: 'Carlos M.',
    vehicle: '2022 Toyota Camry · Silver · FL-LIBRE1',
    updatedAt: new Date().toISOString(),
  };
  demoRides.set(ride.id, updated);
  res.json(updated);
});

// POST /api/demo/rides/:id/start
router.post('/api/demo/rides/:id/start', (req, res) => {
  const ride = demoRides.get(req.params.id);
  if (!ride) return res.status(404).json({ error: 'Ride not found' });
  if (ride.status !== 'driver_assigned') {
    return res.status(409).json({ error: `Cannot start ride in status: ${ride.status}` });
  }
  const updated: DemoRide = { ...ride, status: 'in_progress', updatedAt: new Date().toISOString() };
  demoRides.set(ride.id, updated);
  res.json(updated);
});

// POST /api/demo/rides/:id/complete
router.post('/api/demo/rides/:id/complete', (req, res) => {
  const ride = demoRides.get(req.params.id);
  if (!ride) return res.status(404).json({ error: 'Ride not found' });
  if (ride.status !== 'in_progress') {
    return res.status(409).json({ error: `Cannot complete ride in status: ${ride.status}` });
  }
  const updated: DemoRide = { ...ride, status: 'completed', updatedAt: new Date().toISOString() };
  demoRides.set(ride.id, updated);
  res.json({
    ...updated,
    payout: {
      fareUsd: ride.fareUsd,
      platformFeeUsd: ride.platformFeeUsd,
      driverPayoutUsd: ride.driverPayoutUsd,
    },
  });
});

// GET /api/demo/admin/rides
router.get('/api/demo/admin/rides', (_req, res) => {
  const rides = Array.from(demoRides.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  res.json({ rides, total: rides.length });
});

export default router;
