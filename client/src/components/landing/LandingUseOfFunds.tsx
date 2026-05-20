const uses = [
  "Legal and compliance review",
  "Insurance and TNC regulatory readiness",
  "Smart contract audit",
  "Driver onboarding and verification",
  "Orlando pilot operations",
  "Infrastructure and security",
  "Marketing and community",
  "Support operations reserve",
];

export function LandingUseOfFunds() {
  return (
    <section className="bg-slate-950 px-4 py-20 text-white md:px-6">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-200">Planned use</p>
        <h2 className="mt-3 text-4xl font-black md:text-5xl">How Funds Would Be Used</h2>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
          Planned use if funding is raised through a compliant process. This is not a current
          offer to sell securities.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {uses.map((item, index) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="font-mono text-sm text-cyan-200">0{index + 1}</p>
              <p className="mt-4 font-semibold">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
