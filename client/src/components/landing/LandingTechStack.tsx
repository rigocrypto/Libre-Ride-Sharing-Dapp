import { Badge } from "@/components/ui/badge";

const frontend = ["React", "Vite", "TypeScript", "RainbowKit", "Wagmi", "Viem", "TailwindCSS"];
const backend = ["Express", "TypeScript", "Drizzle", "PostgreSQL", "Base Sepolia", "USDC Escrow", "Foundry"];

export function LandingTechStack() {
  return (
    <section id="technology" className="bg-slate-950 px-4 py-20 text-white md:px-6">
      <div className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Technology</p>
        <h2 className="mt-3 text-4xl font-black md:text-5xl">Built on Proven Web3 Infrastructure</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-4 text-xl font-bold">Frontend</h3>
            <div className="flex flex-wrap gap-2">
              {frontend.map((item) => (
                <Badge key={item} variant="secondary" className="bg-cyan-300/10 text-cyan-100">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-xl font-bold">Backend and chain</h3>
            <div className="flex flex-wrap gap-2">
              {backend.map((item) => (
                <Badge key={item} variant="secondary" className="bg-violet-300/10 text-violet-100">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-950/70 p-5">
            <p className="text-2xl font-black text-cyan-100">Foundry</p>
            <p className="mt-2 text-sm text-slate-300">Smart contracts tested with Foundry.</p>
          </div>
          <div className="rounded-2xl bg-slate-950/70 p-5">
            <p className="text-2xl font-black text-emerald-100">0 critical/high</p>
            <p className="mt-2 text-sm text-slate-300">Current local audit posture after hardening.</p>
          </div>
          <div className="rounded-2xl bg-slate-950/70 p-5">
            <p className="text-2xl font-black text-violet-100">Audit logs</p>
            <p className="mt-2 text-sm text-slate-300">Admin actions are persistently traceable.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
