import { BadgeDollarSign, CircleHelp, HandCoins, LifeBuoy, ShieldAlert, Users } from "lucide-react";

const problems = [
  { title: "High platform fees", body: "Drivers can lose a painful share of each fare before expenses.", Icon: BadgeDollarSign },
  { title: "Opaque payouts", body: "Drivers often cannot see exactly how pricing and payout logic works.", Icon: CircleHelp },
  { title: "Limited ownership", body: "Drivers build the market without a meaningful voice in the platform.", Icon: Users },
  { title: "Weak local support", body: "Orlando-specific airport, tourism, and compliance support is fragmented.", Icon: LifeBuoy },
  { title: "Payment disputes", body: "Riders and drivers need a clearer path when payment state is contested.", Icon: ShieldAlert },
  { title: "No escrow protection", body: "Legacy apps do not give riders and drivers a transparent Web3 payment rail.", Icon: HandCoins },
];

export function LandingProblem() {
  return (
    <section className="bg-slate-950 px-4 py-20 text-white md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">The problem</p>
          <h2 className="mt-3 text-4xl font-black md:text-5xl">The Problem with Ride-Sharing Today</h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Ride-sharing drivers power the market, but they often face high platform fees, unclear
            payout logic, limited ownership, weak support, and little transparency.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {problems.map(({ title, body, Icon }) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
              <Icon className="mb-5 h-7 w-7 text-cyan-200" />
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
