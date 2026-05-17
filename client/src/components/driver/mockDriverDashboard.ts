import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bot,
  CalendarDays,
  Car,
  CircleHelp,
  FileText,
  Gauge,
  Headphones,
  LayoutDashboard,
  Map,
  Settings,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

export type DriverNavItem = {
  label: string;
  icon: LucideIcon;
  badge?: string;
};

export type DriverDashboardData = {
  driver: {
    name: string;
    rating: number;
    online: boolean;
    tier: string;
    totalRides: number;
    acceptanceRate: number;
    avatarInitials: string;
  };
  wallet: {
    balanceUsd: number;
    usdcBalance: number;
    supportedAssets: string[];
  };
  rideOffer: {
    pickup: string;
    pickupAddress: string;
    dropoff: string;
    dropoffAddress: string;
    distanceMiles: number;
    etaMinutes: number;
    fareUsdc: number;
    tollEstimateUsd: number;
    escrowConfirmed: boolean;
    exclusiveSeconds: number;
  };
  vehicle: {
    name: string;
    plate: string;
    verified: boolean;
  };
  earnings: {
    todayUsd: number;
    todayRides: number;
    onlineTime: string;
    weeklyUsd: number;
    weekChangePercent: number;
    weeklyBars: Array<{ day: string; amount: number }>;
  };
  progress: {
    completed: number;
    target: number;
    bonusRemaining: number;
    bonusUsd: number;
  };
  compliance: Array<{ label: string; status: "valid" | "warning" }>;
};

export const driverNavigation: DriverNavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Ride Requests", icon: Car, badge: "2" },
  { label: "Trips", icon: Gauge },
  { label: "Earnings", icon: BarChart3 },
  { label: "AI Copilot", icon: Bot },
  { label: "Map & Heatmap", icon: Map },
  { label: "Wallet", icon: WalletCards },
  { label: "Subscriptions", icon: CalendarDays, badge: "NEW" },
  { label: "Documents", icon: FileText },
  { label: "Vehicle", icon: Car },
  { label: "Settings", icon: Settings },
  { label: "Support", icon: CircleHelp },
];

export const mockDriverDashboard: DriverDashboardData = {
  driver: {
    name: "Alex Martinez",
    rating: 4.98,
    online: true,
    tier: "Platinum",
    totalRides: 320,
    acceptanceRate: 98,
    avatarInitials: "AM",
  },
  wallet: {
    balanceUsd: 1240.5,
    usdcBalance: 1240.5,
    supportedAssets: ["USDC", "USDT", "SOL", "BTC", "Stripe"],
  },
  rideOffer: {
    pickup: "Disney's Coronado Springs",
    pickupAddress: "1500 E Buena Vista Dr, Orlando",
    dropoff: "Orlando International Airport (MCO)",
    dropoffAddress: "1 Jeff Fuqua Blvd, Orlando",
    distanceMiles: 16.4,
    etaMinutes: 24,
    fareUsdc: 32.4,
    tollEstimateUsd: 3.25,
    escrowConfirmed: true,
    exclusiveSeconds: 20,
  },
  vehicle: {
    name: "Tesla Model Y",
    plate: "ABC123",
    verified: true,
  },
  earnings: {
    todayUsd: 186.75,
    todayRides: 8,
    onlineTime: "5h 32m",
    weeklyUsd: 1248.5,
    weekChangePercent: 18.6,
    weeklyBars: [
      { day: "Mon", amount: 260 },
      { day: "Tue", amount: 390 },
      { day: "Wed", amount: 440 },
      { day: "Thu", amount: 590 },
      { day: "Fri", amount: 1010 },
      { day: "Sat", amount: 530 },
      { day: "Sun", amount: 1080 },
    ],
  },
  progress: {
    completed: 8,
    target: 12,
    bonusRemaining: 4,
    bonusUsd: 25,
  },
  compliance: [
    { label: "Driver verified", status: "valid" },
    { label: "Vehicle inspected", status: "valid" },
    { label: "Insurance active", status: "valid" },
    { label: "Documents valid", status: "valid" },
    { label: "MCO eligible", status: "valid" },
  ],
};

export const trustFeatures = [
  { label: "Escrow", description: "Smart contract secured payments", icon: ShieldCheck },
  { label: "AI Match", description: "Dispatch scoring and risk checks", icon: Bot },
  { label: "Tolls", description: "SunPass-aware route pricing", icon: Map },
];

