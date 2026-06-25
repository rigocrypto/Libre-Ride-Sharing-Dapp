import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { getWhatsAppLink } from '@/lib/socialLinks';
import {
  Star,
  MapPin,
  Wallet,
  Copy,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Gift,
  Plane,
  Share2,
  KeyRound,
  BadgeCheck,
  Siren,
  Languages,
  Users,
  MessageCircle,
  Search,
  Luggage,
  Accessibility,
  type LucideIcon,
} from 'lucide-react';
import {
  RIDER_ACCOUNT,
  TRIP_PREFERENCES,
  ORLANDO_DESTINATIONS,
  RIDER_WALLET,
  RIDER_SAFETY_SETTINGS,
  RIDE_PACKAGES,
  ITINERARY,
  RECENT_RIDES,
  RIDER_REFERRAL,
  RIDER_SUPPORT_ITEMS,
} from '@/lib/demoRiderData';

const glass = 'bg-white/5 backdrop-blur-lg border-white/10';

const SETTING_ICONS: Record<string, LucideIcon> = {
  Share2, KeyRound, BadgeCheck, Siren, Languages, Users,
};
const SUPPORT_ICONS: Record<string, LucideIcon> = {
  MessageCircle, Plane, Search, Users,
};

export default function DemoRiderProfile() {
  const whatsapp = getWhatsAppLink();

  return (
    <div className="space-y-6" data-testid="rider-profile">
      {/* Back link */}
      <Link href="/rider" className="inline-flex items-center gap-1 text-sm text-neon-teal hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Rider Dashboard
      </Link>

      {/* Identity */}
      <IdentityCard />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <TripPreferencesCard />
          <SavedDestinationsCard />
          <PackagesCard />
          <TripHistoryCard />
        </div>
        <div className="space-y-6">
          <WalletCard />
          <SafetySettingsCard />
          <ReferralCard />
          <SupportCard whatsappHref={whatsapp?.href} />
        </div>
      </div>
    </div>
  );
}

function IdentityCard() {
  return (
    <Card className={cn(glass, 'p-6')}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-neon text-xl font-black text-white">
            {RIDER_ACCOUNT.initials}
          </div>
          <div>
            <p className="text-xl font-bold">{RIDER_ACCOUNT.name}</p>
            <p className="text-sm text-muted-foreground">{RIDER_ACCOUNT.profileType}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-sm">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                {RIDER_ACCOUNT.rating}
              </span>
              <Badge className="border-neon-purple/30 bg-neon-purple/20 text-neon-purple">
                {RIDER_ACCOUNT.memberStatus}
              </Badge>
            </div>
          </div>
        </div>
        <div className="space-y-2 text-sm sm:text-right">
          <Badge variant="outline" className="border-neon-teal/40 text-xs text-neon-teal">
            Demo · Base Sepolia
          </Badge>
          <p className="text-muted-foreground">Language: <span className="text-foreground">{RIDER_ACCOUNT.language}</span></p>
          <p className="text-muted-foreground">Safety mode: <span className="text-green-400">{RIDER_ACCOUNT.safetyMode}</span></p>
        </div>
      </div>
    </Card>
  );
}

function TripPreferencesCard() {
  const rows = [
    { icon: Plane, label: 'Preferred pickup', value: TRIP_PREFERENCES.preferredPickup },
    { icon: Users, label: 'Party size', value: TRIP_PREFERENCES.partySize },
    { icon: Luggage, label: 'Luggage', value: TRIP_PREFERENCES.luggage },
    { icon: Accessibility, label: 'Accessibility', value: TRIP_PREFERENCES.accessibility },
    { icon: BadgeCheck, label: 'Preferred package', value: TRIP_PREFERENCES.preferredPackage },
  ];
  return (
    <Card className={cn(glass, 'space-y-4 p-5')}>
      <h3 className="font-semibold">Trip Preferences</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start gap-2">
            <r.icon className="mt-0.5 h-4 w-4 shrink-0 text-neon-teal" />
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{r.label}</p>
              <p className="text-sm">{r.value}</p>
            </div>
          </div>
        ))}
      </div>
      <div>
        <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">Favorite areas</p>
        <div className="flex flex-wrap gap-1.5">
          {TRIP_PREFERENCES.favoriteAreas.map((a) => (
            <span key={a} className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs">
              <MapPin className="h-3 w-3 text-neon-teal" /> {a}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}

function SavedDestinationsCard() {
  return (
    <Card className={cn(glass, 'space-y-4 p-5')}>
      <h3 className="font-semibold">Saved Destinations</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {ORLANDO_DESTINATIONS.map((d) => (
          <div key={d.key} className="flex flex-col gap-1.5 rounded-xl bg-white/5 p-3" data-testid="rider-saved-destination">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium leading-tight">{d.name}</p>
              <Plane className="h-3.5 w-3.5 shrink-0 text-neon-teal" />
            </div>
            <p className="text-xs text-muted-foreground">{d.description}</p>
            <p className="text-[11px] text-muted-foreground">{d.suggestedPackage}</p>
            <Link
              href="/rider"
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-neon-teal hover:underline"
            >
              Use in Rider Demo <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PackagesCard() {
  return (
    <Card className={cn(glass, 'space-y-4 p-5')}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Your Ride Packages</h3>
        <Badge variant="outline" className="text-[11px] text-muted-foreground">Demo pricing</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {RIDE_PACKAGES.map((p) => (
          <div key={p.key} className="space-y-1 rounded-xl bg-white/5 p-3" data-testid="rider-profile-package">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{p.name}</p>
              {p.tag && <Badge className="border-neon-pink/30 bg-neon-pink/20 text-[10px] text-neon-pink">{p.tag}</Badge>}
            </div>
            <p className="text-lg font-bold">{p.price}</p>
            <p className="text-[11px] text-muted-foreground">{p.subtitle}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TripHistoryCard() {
  return (
    <Card className={cn(glass, 'space-y-4 p-5')}>
      <h3 className="font-semibold">Trip History & Itinerary</h3>
      <div>
        <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">Upcoming</p>
        <ul className="space-y-2">
          {ITINERARY.map((it) => (
            <li key={it.id} className="flex items-center justify-between rounded-lg bg-white/5 p-3">
              <div>
                <p className="text-sm font-medium">{it.title}</p>
                <p className="text-xs text-muted-foreground">{it.when}</p>
              </div>
              <Badge variant="outline" className="text-[10px] capitalize text-muted-foreground">{it.status}</Badge>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">Recent rides</p>
        <ul className="divide-y divide-white/5">
          {RECENT_RIDES.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.when}</p>
              </div>
              <span className="text-sm font-semibold">{r.price}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function WalletCard() {
  return (
    <Card className={cn(glass, 'space-y-3 p-5')}>
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4 text-neon-teal" />
        <h3 className="font-semibold">Wallet & Payment (Demo)</h3>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">USDC Balance</p>
        <p className="text-2xl font-bold text-neon-teal">{RIDER_WALLET.usdcBalance}</p>
      </div>
      <div className="space-y-2 rounded-lg bg-white/5 p-3 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Escrow status</span><span className="text-green-400">Escrow-ready</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Payment method</span><span className="text-right">{RIDER_WALLET.paymentMethod}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Recent payment</span><span className="text-right">{RIDER_WALLET.recentPayment}</span></div>
      </div>
      <p className="text-center text-[11px] text-muted-foreground">Demo mode only — no real funds are moved.</p>
    </Card>
  );
}

function SafetySettingsCard() {
  return (
    <Card className={cn(glass, 'space-y-3 p-5')}>
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-green-400" />
        <h3 className="font-semibold">Safety Settings</h3>
      </div>
      <ul className="space-y-2.5">
        {RIDER_SAFETY_SETTINGS.map((s) => {
          const Icon = SETTING_ICONS[s.icon] ?? ShieldCheck;
          return (
            <li key={s.key} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <Icon className="h-4 w-4 text-neon-teal" /> {s.label}
              </span>
              <Switch checked={s.enabled} disabled aria-label={s.label} />
            </li>
          );
        })}
      </ul>
      <p className="text-center text-[11px] text-muted-foreground">Settings are preview-only in this demo.</p>
    </Card>
  );
}

function ReferralCard() {
  return (
    <Card className={cn(glass, 'space-y-3 p-5')}>
      <div className="flex items-center gap-2">
        <Gift className="h-4 w-4 text-neon-pink" />
        <h3 className="font-semibold">Invite & Earn</h3>
      </div>
      <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
        <div>
          <p className="text-[11px] text-muted-foreground">Referral code</p>
          <p className="font-mono font-bold tracking-widest text-white">{RIDER_REFERRAL.code}</p>
        </div>
        <Button size="sm" variant="outline">
          <Copy className="mr-1 h-3.5 w-3.5" /> Invite
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{RIDER_REFERRAL.note}</p>
    </Card>
  );
}

function SupportCard({ whatsappHref }: { whatsappHref?: string }) {
  return (
    <Card className={cn(glass, 'space-y-3 p-5')}>
      <h3 className="font-semibold">Support & Help</h3>
      <ul className="space-y-2.5">
        {RIDER_SUPPORT_ITEMS.map((s) => {
          const Icon = SUPPORT_ICONS[s.icon] ?? MessageCircle;
          return (
            <li key={s.key} className="flex items-start gap-2">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-neon-teal" />
              <div>
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-[11px] text-muted-foreground">{s.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>
      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-green-400/40 bg-green-400/15 px-3 py-2 text-sm font-medium text-green-100 hover:bg-green-400/25"
        >
          <MessageCircle className="h-4 w-4" /> Contact LIBRE on WhatsApp
        </a>
      )}
    </Card>
  );
}
