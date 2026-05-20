import { InvestorInterestForm } from "./InvestorInterestForm";
import { BadgeDollarSign, FileCheck2, Handshake, LayoutDashboard, Map, ShieldCheck } from "lucide-react";

const highlights = [
  { title: "Base Sepolia escrow", body: "Live contract and test USDC ride flow proven.", Icon: BadgeDollarSign },
  { title: "State machine tested", body: "Escrow transitions are typed, tested, and documented.", Icon: FileCheck2 },
  { title: "Admin monitoring", body: "Operators can inspect escrow, stuck deposits, and audit trails.", Icon: LayoutDashboard },
  { title: "Compliance workflow", body: "Driver approval, suspension, and document expiry gates dispatch.", Icon: ShieldCheck },
  { title: "Orlando pilot", body: "Focused launch path for MCO, tourism, events, and local operators.", Icon: Map },
  { title: "Partner-ready", body: "Interest capture for sponsors, investors, drivers, and operators.", Icon: Handshake },
];

export function LandingInvestorSection() {
  return (
    <section id="investor-section" className="bg-slate-950 px-4 py-20 text-white md:px-6">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-200">Investors and partners</p>
          <h2 className="mt-3 text-4xl font-black md:text-5xl">Early Investor & Partner Interest</h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            LIBRE is collecting interest from early investors, sponsors, and transportation
            partners for a future compliant funding process. This is not a securities offering or
            token sale. Any future investment opportunity will be subject to legal review and
            applicable regulations.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {highlights.map(({ title, body, Icon }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <Icon className="mb-4 h-6 w-6 text-violet-200" />
                <h3 className="font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
              </div>
            ))}
          </div>
        </div>
        <InvestorInterestForm />
      </div>
    </section>
  );
}
