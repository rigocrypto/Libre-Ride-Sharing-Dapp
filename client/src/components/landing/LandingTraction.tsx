import { CheckCircle2, ExternalLink } from "lucide-react";

const tractionPoints = [
  { label: "Live escrow contract", value: "Base Sepolia", verified: true },
  { label: "Automated tests passing", value: "34+", verified: true },
  { label: "Security audit status", value: "0 critical / 0 high", verified: true },
  { label: "Escrow state machine", value: "Tested and deployed", verified: true },
  { label: "Admin monitoring", value: "Operational", verified: true },
  { label: "Persistent audit logs", value: "Implemented", verified: true },
  {
    label: "Escrow contract",
    value: "0xE499...888F",
    verified: true,
    href: "https://sepolia.basescan.org/address/0xE4995d77BffAcB05AF23764bf2831FCC35B4888F",
  },
];

export function LandingTraction() {
  return (
    <section className="px-4 py-16 md:px-6" id="traction">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">Current build progress</p>
          <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">Technical traction that operators can verify.</h2>
          <p className="mt-4 text-slate-300">
            LIBRE is still pre-production, but the core payment, driver-auth, monitoring, and audit layers are already moving through staging proof.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {tractionPoints.map((point) => (
            <div key={point.label} className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-xl shadow-black/20 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                {point.href && (
                  <a href={point.href} target="_blank" rel="noreferrer" className="text-slate-400 transition hover:text-cyan-200" aria-label={`${point.label} on Basescan`}>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              <p className="mt-4 text-sm text-slate-400">{point.label}</p>
              <p className="mt-1 text-xl font-black text-white">{point.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

