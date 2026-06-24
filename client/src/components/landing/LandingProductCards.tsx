import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { productCards } from "./landingDemoCards";

export { type ProductCard, productCards } from "./landingDemoCards";

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
            Open the live Rider, Driver, and Admin demos below. AI dispatch and the full Web3 wallet
            flow are coming soon.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-5">
          {productCards.map(({ title, body, Icon, href, cta, comingSoonNote }) => (
            <div key={title} className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
              <Icon className="mb-5 h-7 w-7 text-cyan-200" />
              <h3 className="font-bold">{title}</h3>
              <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-300">{body}</p>
              {href && cta ? (
                <Button
                  asChild
                  className="mt-5 w-full border border-cyan-300/40 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20"
                >
                  <Link href={href} aria-label={`${cta} (${title})`}>
                    {cta}
                  </Link>
                </Button>
              ) : (
                <div className="mt-5">
                  <Button disabled variant="outline" className="w-full border-white/15 bg-white/5 text-slate-300">
                    Coming Soon
                  </Button>
                  {comingSoonNote && <p className="mt-2 text-xs text-slate-400">{comingSoonNote}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
