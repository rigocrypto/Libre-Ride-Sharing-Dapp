const phases = [
  ["Phase 1", "Orlando Founding Access", "Driver, investor, sponsor, and partner lead capture."],
  ["Phase 2", "Driver Compliance & Demo Access", "Review driver documents, approval status, and staged demo entry."],
  ["Phase 3", "Base Sepolia Escrow Pilot", "Two-wallet rider/driver proof with escrow lock, start, and release."],
  ["Phase 4", "Limited Orlando Driver Pilot", "Controlled driver cohort with admin monitoring and support."],
  ["Phase 5", "Legal & Insurance Review", "TNC, airport, insurance, token, and funding review before public launch."],
  ["Phase 6", "Public Beta", "Measured rollout after compliance, security, and operational readiness."],
];

export function LandingRoadmap() {
  return (
    <section className="px-4 py-16 md:px-6" id="roadmap">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">Pilot roadmap</p>
          <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">A staged path toward an Orlando pilot.</h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {phases.map(([phase, title, body]) => (
            <div key={phase} className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <p className="text-sm font-semibold text-cyan-200">{phase}</p>
              <h3 className="mt-2 text-xl font-black text-white">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
