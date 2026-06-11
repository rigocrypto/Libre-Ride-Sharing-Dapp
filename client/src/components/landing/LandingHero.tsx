import { Button } from "@/components/ui/button";
import { BadgeCheck, Car, ShieldCheck, WalletCards } from "lucide-react";

const proof = [
  { icon: ShieldCheck, label: "Escrow contract live on Base Sepolia" },
  { icon: WalletCards, label: "USDC approve, deposit, release tested" },
  { icon: BadgeCheck, label: "Admin audit logs and compliance gates" },
];

export function LandingHero() {
  return (
    <section className="relative min-h-[92vh] overflow-hidden pt-24 text-white">
      <img
        src={`${import.meta.env.BASE_URL}founding-orlando-skyline.png`}
        alt="Orlando skyline at dusk"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-slate-950/78" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.28),transparent_32%),radial-gradient(circle_at_72%_18%,rgba(124,58,237,0.25),transparent_30%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 md:grid-cols-[1.05fr_0.95fr] md:px-6 md:py-28">
        <div className="flex flex-col justify-center">
          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
            <Car className="h-4 w-4" />
            Orlando pilot access is forming now
          </div>
          <h1 className="max-w-4xl text-5xl font-black leading-[0.95] md:text-7xl">
            LIBRE Ride
            <span className="block bg-gradient-to-r from-cyan-200 via-blue-200 to-violet-200 bg-clip-text text-transparent">
              Web3 Ride-Sharing Built for Orlando
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 md:text-xl">
            AI dispatch, escrow-protected payments, verified drivers, and transparent payouts
            for the next generation of local mobility.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-400">
              <a href="#founding-driver-form">Join as Founding Driver</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
              <a href="#investor-form">Request Investor Deck</a>
            </Button>
            <Button asChild size="lg" variant="ghost" className="text-cyan-100 hover:bg-white/10">
              <a href="#demo">Watch Demo</a>
            </Button>
            <Button asChild size="lg" variant="ghost" className="text-slate-200 hover:bg-white/10">
              <a href="#demo">Download Demo App</a>
            </Button>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {proof.map((item) => (
              <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl">
                <item.icon className="mb-3 h-5 w-5 text-cyan-200" />
                <p className="text-sm text-slate-200">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-slate-950/72 p-4 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-cyan-100">Escrow Monitor</span>
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs text-emerald-100">Live test proven</span>
              </div>
              {[
                ["Rider deposit", "25 USDC", "locked"],
                ["Driver payout", "24.25 USDC", "released"],
                ["Platform fee", "0.75 USDC", "settled"],
              ].map(([label, amount, status]) => (
                <div key={label} className="mb-3 rounded-xl border border-white/10 bg-slate-900/80 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">{label}</span>
                    <span className="font-mono text-sm text-white">{amount}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-800">
                    <div className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-300" />
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-wide text-cyan-200">{status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
