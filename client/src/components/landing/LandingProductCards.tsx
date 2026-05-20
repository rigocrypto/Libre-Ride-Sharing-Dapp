import { Button } from "@/components/ui/button";
import { Bot, Car, LayoutDashboard, Smartphone, WalletCards } from "lucide-react";

const cards = [
  { title: "Rider App", body: "Fare quote, escrow deposit, USDC payment, and trip state clarity.", Icon: Smartphone },
  { title: "Driver Dashboard", body: "AI copilot, compliance state, earnings, and ride offer flow.", Icon: Car },
  { title: "Admin Escrow Monitoring", body: "Locked, released, disputed, failed, and manual-review states.", Icon: LayoutDashboard },
  { title: "AI Dispatch", body: "Matching roadmap based on compliance, location, rating, and escrow readiness.", Icon: Bot },
  { title: "Web3 Wallet Flow", body: "USDC approve -> deposit -> verify -> release flow proven on testnet.", Icon: WalletCards },
];

export function LandingProductCards() {
  return (
    <section id="demo" className="bg-slate-950 px-4 py-20 text-white md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Product demo</p>
            <h2 className="mt-3 text-4xl font-black md:text-5xl">See LIBRE in Action</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-300">
            Demo downloads are coming soon. Join the waitlist for early access to web, Android,
            and iOS beta builds.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-5">
          {cards.map(({ title, body, Icon }) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
              <Icon className="mb-5 h-7 w-7 text-cyan-200" />
              <h3 className="font-bold">{title}</h3>
              <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-300">{body}</p>
              <Button disabled variant="outline" className="mt-5 w-full border-white/15 bg-white/5 text-slate-300">
                Coming Soon
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
