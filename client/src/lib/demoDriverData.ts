/**
 * Static mock/demo data for the LIBRE Driver demo dashboard.
 *
 * Everything here is frontend-only, deterministic, and testnet/demo-safe — no real
 * funds move and no backend contract depends on these values. Kept pure (no DOM / no
 * React) so it can be unit-tested under the node test environment.
 */

export interface DriverProfile {
  name: string;
  rating: number;
  vehicle: string;
  color: string;
  plate: string;
  badges: string[];
}

export const DRIVER_PROFILE: DriverProfile = {
  name: "Carlos M.",
  rating: 4.9,
  vehicle: "2022 Toyota Camry",
  color: "Silver",
  plate: "FL-LIBRE1",
  badges: ["Verified", "Founding Driver"],
};

export interface Kpi {
  key: string;
  label: string;
  value: string;
  hint?: string;
}

/** Demo headline numbers. Mock values — not derived from the live demo ride store. */
export const KPI_CARDS: Kpi[] = [
  { key: "earnings", label: "Today's Earnings", value: "$238.75", hint: "+12% vs. avg" },
  { key: "rides", label: "Rides Completed", value: "12", hint: "Today" },
  { key: "online", label: "Online Time", value: "6h 15m", hint: "Today" },
  { key: "acceptance", label: "Acceptance Rate", value: "92%", hint: "Last 7 days" },
  { key: "balance", label: "Current Balance", value: "$482.60", hint: "Cash" },
  { key: "usdc", label: "USDC Balance", value: "210.45 USDC", hint: "Base Sepolia" },
];

export interface NavItem {
  key: string;
  label: string;
  /** lucide-react icon name; resolved by the component. */
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { key: "rides", label: "Rides", icon: "Car" },
  { key: "earnings", label: "Earnings", icon: "DollarSign" },
  { key: "wallet", label: "Wallet & Payouts", icon: "Wallet" },
  { key: "schedule", label: "Schedule", icon: "Calendar" },
  { key: "vehicle", label: "Vehicle", icon: "Truck" },
  { key: "safety", label: "Safety Center", icon: "ShieldCheck" },
  { key: "ratings", label: "Ratings & Feedback", icon: "Star" },
  { key: "promotions", label: "Promotions", icon: "Gift" },
  { key: "assistant", label: "AI Assistant", icon: "Sparkles" },
  { key: "settings", label: "Settings", icon: "Settings" },
];

export interface EarningsBar {
  day: string;
  amount: number;
}

/** Weekly earnings, used by the CSS-bar chart (no chart dependency required). */
export const WEEKLY_EARNINGS: EarningsBar[] = [
  { day: "Mon", amount: 182 },
  { day: "Tue", amount: 215 },
  { day: "Wed", amount: 168 },
  { day: "Thu", amount: 244 },
  { day: "Fri", amount: 312 },
  { day: "Sat", amount: 358 },
  { day: "Sun", amount: 238 },
];

export const EARNINGS_SUMMARY = {
  total: 1717.0,
  rides: 86,
  onlineHours: 41.5,
  avgPerRide: 19.96,
  bonuses: 64.0,
  tips: 52.25,
};

export interface WalletTransaction {
  id: string;
  label: string;
  amount: string;
  positive: boolean;
  when: string;
}

export const WALLET = {
  cashBalance: "$482.60",
  usdcBalance: "210.45 USDC",
  payoutMethod: "Coinbase Wallet · Base Sepolia",
  transactions: [
    { id: "tx1", label: "Ride payout · Union Square", amount: "+13.82 USDC", positive: true, when: "2h ago" },
    { id: "tx2", label: "Instant cash out", amount: "-150.00 USDC", positive: false, when: "Yesterday" },
    { id: "tx3", label: "Founding driver bonus", amount: "+25.00 USDC", positive: true, when: "2d ago" },
    { id: "tx4", label: "Ride payout · MCO Airport", amount: "+31.40 USDC", positive: true, when: "2d ago" },
  ] as WalletTransaction[],
};

export interface SafetyItem {
  key: string;
  label: string;
  ok: boolean;
}

export const SAFETY_ITEMS: SafetyItem[] = [
  { key: "driver", label: "Driver verified", ok: true },
  { key: "inspection", label: "Vehicle inspection valid", ok: true },
  { key: "insurance", label: "Insurance valid", ok: true },
  { key: "background", label: "Background check completed", ok: true },
];

export const SAFETY_SCORE = 98;

export const AI_TIPS: string[] = [
  "High demand expected near Downtown",
  "Best time to drive: 5 PM – 9 PM",
  "Stay online to receive more escrow-confirmed rides",
  "Avoid low-demand zones this afternoon",
];

export interface DemoNotification {
  id: string;
  title: string;
  detail: string;
  tone: "info" | "success" | "warning";
  when: string;
}

export const NOTIFICATIONS: DemoNotification[] = [
  { id: "n1", title: "New ride request", detail: "Escrow-confirmed trip near you", tone: "info", when: "Just now" },
  { id: "n2", title: "Payout sent", detail: "13.82 USDC released from escrow", tone: "success", when: "2h ago" },
  { id: "n3", title: "Document expiring", detail: "Insurance renews in 21 days", tone: "warning", when: "1d ago" },
  { id: "n4", title: "Challenge progress", detail: "8 of 10 rides toward weekend bonus", tone: "info", when: "1d ago" },
  { id: "n5", title: "System update", detail: "Escrow release is now instant on Base", tone: "info", when: "3d ago" },
];

export const PROMO = {
  referralCode: "LIBRE-CARLOS",
  bonusEarned: 8,
  bonusGoal: 10,
  bonusReward: "$250 founding driver bonus",
  campaign: "Refer 10 Orlando drivers before the pilot launch.",
};

export interface DemandHotspot {
  label: string;
  level: "High" | "Medium" | "Low";
  /** Approximate position within the mock map, as percentages. */
  top: number;
  left: number;
}

export const DEMAND_HOTSPOTS: DemandHotspot[] = [
  { label: "Downtown", level: "High", top: 28, left: 32 },
  { label: "MCO Airport", level: "High", top: 64, left: 70 },
  { label: "I-Drive", level: "Medium", top: 48, left: 50 },
];

export interface VehicleMarker {
  id: string;
  top: number;
  left: number;
  heading: "N" | "E" | "S" | "W";
  state: "available" | "on_trip";
}

export const VEHICLE_MARKERS: VehicleMarker[] = [
  { id: "DRV-204", top: 36, left: 40, heading: "E", state: "available" },
  { id: "DRV-317", top: 54, left: 58, heading: "N", state: "on_trip" },
  { id: "DRV-411", top: 70, left: 44, heading: "W", state: "available" },
];

/**
 * A clearly-labeled sample ride request used to populate the available-rides panel
 * when no real escrow-confirmed ride exists yet. NOT actionable — it has no real
 * ride id, so it never hits the accept endpoint.
 */
export interface SampleRide {
  id: string;
  fare: string;
  surge: string;
  etaMin: number;
  pickupDistanceMi: number;
  tripDistanceMi: number;
  pickup: string;
  destination: string;
}

export const SAMPLE_RIDES: SampleRide[] = [
  {
    id: "sample-1",
    fare: "$14.25",
    surge: "Surge 1.3x",
    etaMin: 4,
    pickupDistanceMi: 1.2,
    tripDistanceMi: 3.6,
    pickup: "Market St & 7th",
    destination: "Union Square",
  },
  {
    id: "sample-2",
    fare: "$28.90",
    surge: "Surge 1.1x",
    etaMin: 7,
    pickupDistanceMi: 2.4,
    tripDistanceMi: 11.8,
    pickup: "Downtown Orlando",
    destination: "MCO Airport",
  },
];

/** Demo rider shown on the active-trip card when no real trip data is present. */
export const SAMPLE_ACTIVE_RIDER = {
  name: "Maria Gomez",
  rating: 4.8,
  otp: "4921",
};

export function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}
