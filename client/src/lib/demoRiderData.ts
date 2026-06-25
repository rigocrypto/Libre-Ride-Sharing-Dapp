/**
 * Static mock/demo data for the LIBRE Rider demo dashboard (Orlando-visitor theme).
 *
 * Frontend-only, deterministic, demo-safe — no real funds, no backend contract depends
 * on these values. Kept pure (no DOM / no React) so it is unit-testable under the node
 * test environment, mirroring `demoDriverData.ts`.
 */

export interface RiderProfile {
  name: string;
  tripType: string;
  payment: string;
  safetyMode: string;
  language: string;
}

export const RIDER_PROFILE: RiderProfile = {
  name: "Orlando Visitor",
  tripType: "Tourist",
  payment: "USDC (Demo)",
  safetyMode: "Enabled",
  language: "English / Español",
};

export interface TrustBadge {
  label: string;
  /** lucide-react icon name; resolved by the component. */
  icon: string;
}

export const TRUST_BADGES: TrustBadge[] = [
  { label: "Escrow Protected", icon: "ShieldCheck" },
  { label: "Transparent Fare", icon: "Receipt" },
  { label: "Verified Drivers", icon: "BadgeCheck" },
  { label: "Orlando Ready", icon: "Palmtree" },
];

export interface OrlandoDestination {
  key: string;
  name: string;
  description: string;
  /** Prefilled into the booking form when the rider taps "Use this route". */
  pickup: string;
  destination: string;
  distanceMiles: number;
  durationMin: number;
  suggestedPackage: string;
}

export const ORLANDO_DESTINATIONS: OrlandoDestination[] = [
  {
    key: "mco-idrive",
    name: "MCO Airport → I-Drive",
    description: "Airport pickup to International Drive hotels",
    pickup: "Orlando International Airport (MCO)",
    destination: "International Drive",
    distanceMiles: 9.6,
    durationMin: 18,
    suggestedPackage: "Airport Pickup",
  },
  {
    key: "hotel-disney-springs",
    name: "Hotel → Disney Springs",
    description: "Dining, shopping & entertainment district",
    pickup: "International Drive",
    destination: "Disney Springs",
    distanceMiles: 4.2,
    durationMin: 10,
    suggestedPackage: "1 Ride Short",
  },
  {
    key: "universal",
    name: "Universal Orlando Resort",
    description: "Theme parks & CityWalk",
    pickup: "International Drive",
    destination: "Universal Studios FL",
    distanceMiles: 6.1,
    durationMin: 15,
    suggestedPackage: "1 Ride Short",
  },
  {
    key: "convention-center",
    name: "Convention Center",
    description: "Orange County Convention Center",
    pickup: "International Drive",
    destination: "Orange County Convention Center",
    distanceMiles: 5.3,
    durationMin: 12,
    suggestedPackage: "1 Ride Short",
  },
  {
    key: "downtown",
    name: "Downtown Orlando Night Out",
    description: "Restaurants, bars & live music",
    pickup: "International Drive",
    destination: "Downtown Orlando",
    distanceMiles: 2.3,
    durationMin: 7,
    suggestedPackage: "1 Ride Short",
  },
  {
    key: "lake-nona",
    name: "Lake Nona Medical City",
    description: "Medical campus & research hub",
    pickup: "Orlando International Airport (MCO)",
    destination: "Lake Nona Medical City",
    distanceMiles: 7.4,
    durationMin: 14,
    suggestedPackage: "1 Ride Long",
  },
  {
    key: "winter-park",
    name: "Winter Park Weekend",
    description: "Park Ave shops, museums & brunch",
    pickup: "Downtown Orlando",
    destination: "Winter Park",
    distanceMiles: 5.0,
    durationMin: 13,
    suggestedPackage: "1 Ride Long",
  },
  {
    key: "florida-mall",
    name: "Florida Mall / Shopping Trip",
    description: "Orlando's largest shopping destination",
    pickup: "International Drive",
    destination: "The Florida Mall",
    distanceMiles: 4.8,
    durationMin: 11,
    suggestedPackage: "1 Ride Short",
  },
];

export interface RidePackage {
  key: string;
  name: string;
  subtitle: string;
  price: string;
  description: string;
  tag?: string;
}

/** Demo / pilot pricing — not final production pricing. */
export const RIDE_PACKAGES: RidePackage[] = [
  { key: "short", name: "1 Ride Short", subtitle: "Up to 5 miles", price: "$10.00", description: "Ideal for short trips around Orlando." },
  { key: "pack3", name: "3 Ride Pack", subtitle: "Three short rides", price: "$27.00", description: "Save on multiple short trips.", tag: "Save 10%" },
  { key: "long", name: "1 Ride Long", subtitle: "Up to 15 miles", price: "$25.00", description: "Perfect for longer distances." },
  { key: "hourly", name: "Hourly Package", subtitle: "4-Hour support", price: "$60.00", description: "Multiple stops and wait time included.", tag: "Popular" },
  { key: "airport", name: "Airport Pickup", subtitle: "MCO Pickup", price: "$15.00", description: "Professional airport meet & greet." },
];

export interface EscrowStep {
  label: string;
  detail: string;
}

/** Plain-language escrow explanation for non-crypto riders. */
export const ESCROW_FLOW_STEPS: EscrowStep[] = [
  { label: "Request Ride", detail: "You choose your ride and package." },
  { label: "Confirm Escrow", detail: "Payment is locked in a smart contract." },
  { label: "Driver Accepts", detail: "Drivers see only confirmed rides." },
  { label: "Complete Ride", detail: "You arrive safely at your destination." },
  { label: "Payment Released", detail: "Funds released to driver automatically." },
];

/**
 * The five rider-facing lifecycle steps shown in the "Your Current Trip" stepper.
 * Index order matters: it maps to backend ride statuses via getRiderStatusStep().
 */
export const RIDER_STATUS_STEPS = [
  "Request Ride",
  "Escrow Confirmed",
  "Driver Assigned",
  "In Progress",
  "Completed",
] as const;

export type RiderStage = "request" | "estimate" | "payment" | "live";

/**
 * Maps the current flow stage + live backend ride status to the active step index
 * in RIDER_STATUS_STEPS. Steps before the active index are "done", the active index
 * is "current", later steps are "pending". Pure + deterministic for unit testing.
 */
export function getRiderStatusStep(stage: RiderStage, liveStatus?: string): number {
  if (stage === "request" || stage === "estimate") return 0;
  if (stage === "payment") return 1;
  // stage === "live": derive from the backend status
  switch (liveStatus) {
    case "escrow_confirmed":
      return 2;
    case "driver_assigned":
      return 3;
    case "in_progress":
      return 3;
    case "completed":
      return 4;
    default:
      return 1;
  }
}

export interface DriverMatch {
  name: string;
  rating: number;
  badge: string;
  vehicle: string;
  color: string;
  etaMin: number;
}

/** Sample driver shown as a preview before/while a real driver is assigned. */
export const DRIVER_MATCH: DriverMatch = {
  name: "Carlos M.",
  rating: 4.9,
  badge: "Verified Founding Driver",
  vehicle: "2022 Toyota Camry",
  color: "Silver",
  etaMin: 4,
};

export interface SafetyFeature {
  key: string;
  label: string;
  detail: string;
  icon: string;
}

export const SAFETY_FEATURES: SafetyFeature[] = [
  { key: "share", label: "Share Trip", detail: "Share with family or friends", icon: "Share2" },
  { key: "sos", label: "SOS / Emergency", detail: "24/7 emergency assistance", icon: "Siren" },
  { key: "otp", label: "Trip PIN / OTP", detail: "Secure OTP for each ride", icon: "KeyRound" },
  { key: "support", label: "Support Chat", detail: "English & Español support", icon: "MessageCircle" },
];

export interface RiderNotification {
  id: string;
  title: string;
  detail: string;
  tone: "info" | "success" | "warning";
  when: string;
}

export const RIDER_NOTIFICATIONS: RiderNotification[] = [
  { id: "rn1", title: "Escrow confirmed", detail: "Your payment is secure.", tone: "success", when: "2 min ago" },
  { id: "rn2", title: "Driver will be assigned soon", detail: "We're finding the best driver.", tone: "info", when: "3 min ago" },
  { id: "rn3", title: "High demand near I-Drive", detail: "Book early for best ETA.", tone: "warning", when: "15 min ago" },
  { id: "rn4", title: "Refer a friend & earn", detail: "Earn USDC demo rewards.", tone: "info", when: "1 day ago" },
];

export const AI_TRAVEL_TIPS: string[] = [
  "Best time to leave for Universal: 8:30 AM",
  "Expect high demand near International Drive after 9 PM",
  "Book an hourly package for multi-stop family trips",
  "Airport pickup tip: confirm your terminal before the driver arrives",
];

export interface ItineraryItem {
  id: string;
  title: string;
  when: string;
  status: "upcoming" | "scheduled" | "completed";
  price?: string;
}

export const ITINERARY: ItineraryItem[] = [
  { id: "it1", title: "Disney Springs", when: "Today · 6:30 PM", status: "upcoming" },
  { id: "it2", title: "Airport Return · MCO", when: "Tomorrow · 10:00 AM", status: "scheduled" },
];

export const RECENT_RIDES: ItineraryItem[] = [
  { id: "rr1", title: "Disney Springs", when: "May 24 · 6:45 PM", status: "completed", price: "$10.25" },
  { id: "rr2", title: "Universal Studios", when: "May 22 · 11:20 AM", status: "completed", price: "$11.75" },
  { id: "rr3", title: "Downtown Orlando", when: "May 20 · 8:15 PM", status: "completed", price: "$8.50" },
  { id: "rr4", title: "MCO Airport", when: "May 18 · 9:10 AM", status: "completed", price: "$15.00" },
];

export const RIDER_WALLET = {
  usdcBalance: "100.00 USDC",
  escrowStatus: "Locked for current ride",
  escrowAmount: "12.50 USDC",
  paymentMethod: "USDC Demo Wallet · Base Sepolia",
  recentPayment: "Disney Springs · 10.25 USDC",
};

export interface MapHotspot {
  label: string;
  /** Position within the mock map, as percentages. */
  top: number;
  left: number;
  kind: "pickup" | "destination" | "hotspot";
}

export const RIDER_MAP_HOTSPOTS: MapHotspot[] = [
  { label: "MCO Airport", top: 70, left: 72, kind: "pickup" },
  { label: "Disney Springs", top: 60, left: 24, kind: "destination" },
  { label: "International Drive", top: 44, left: 50, kind: "hotspot" },
  { label: "Universal", top: 26, left: 34, kind: "hotspot" },
];

/** Quick-pick pickup/destination chips for the booking form. */
export const QUICK_PICKUPS = [
  "Orlando International Airport (MCO)",
  "International Drive",
  "Disney Springs",
  "Downtown Orlando",
];

export const QUICK_DESTINATIONS = [
  "MCO International Airport",
  "Universal Studios FL",
  "Disney Springs",
  "Orange County Convention Center",
  "Lake Nona Medical City",
];

/* ------------------------- Rider Profile / Account ----------------------- */

export interface RiderAccount {
  name: string;
  profileType: string;
  rating: number;
  memberStatus: string;
  language: string;
  safetyMode: string;
  initials: string;
}

/** The rider identity, mirroring the Driver side's "Carlos M." identity. */
export const RIDER_ACCOUNT: RiderAccount = {
  name: "Orlando Visitor",
  profileType: "Tourist · Family Traveler",
  rating: 4.8,
  memberStatus: "LIBRE Demo Rider",
  language: "English / Español",
  safetyMode: "Enabled",
  initials: "OV",
};

export interface TripPreferences {
  preferredPickup: string;
  favoriteAreas: string[];
  partySize: string;
  luggage: string;
  accessibility: string;
  preferredPackage: string;
}

export const TRIP_PREFERENCES: TripPreferences = {
  preferredPickup: "Airport / Hotel / Theme Park",
  favoriteAreas: [
    "MCO Airport",
    "Disney Springs",
    "Universal Orlando",
    "International Drive",
    "Convention Center",
  ],
  partySize: "2–4 passengers",
  luggage: "2 bags (airport pickup)",
  accessibility: "No special requirements",
  preferredPackage: "Airport Pickup",
};

export interface ToggleSetting {
  key: string;
  label: string;
  enabled: boolean;
  /** lucide-react icon name; resolved by the component. */
  icon: string;
}

export const RIDER_SAFETY_SETTINGS: ToggleSetting[] = [
  { key: "share", label: "Share trip", enabled: true, icon: "Share2" },
  { key: "otp", label: "Trip PIN / OTP", enabled: true, icon: "KeyRound" },
  { key: "verified", label: "Verified drivers only", enabled: true, icon: "BadgeCheck" },
  { key: "sos", label: "SOS preview", enabled: true, icon: "Siren" },
  { key: "bilingual", label: "Bilingual support (EN/ES)", enabled: true, icon: "Languages" },
  { key: "family", label: "Family travel mode", enabled: true, icon: "Users" },
];

export const RIDER_REFERRAL = {
  code: "ORLANDO-RIDER",
  note: "Invite travelers to try LIBRE during the Orlando pilot.",
};

export interface SupportItem {
  key: string;
  label: string;
  detail: string;
  icon: string;
}

export const RIDER_SUPPORT_ITEMS: SupportItem[] = [
  { key: "chat", label: "Support Chat", detail: "English & Español, 24/7", icon: "MessageCircle" },
  { key: "airport", label: "Airport Pickup Instructions", detail: "Confirm your terminal before arrival", icon: "Plane" },
  { key: "lost", label: "Lost Item Support", detail: "Report items left in a vehicle", icon: "Search" },
  { key: "family", label: "Family & Tourist Help", detail: "Car seats, group trips, accessibility", icon: "Users" },
];
