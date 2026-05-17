import { Blocks, ShieldCheck } from "lucide-react";

import { AssetPill } from "./DriverWalletSummary";

export function DriverBottomTrustBar() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/90 px-4 py-4 backdrop-blur-xl lg:px-8">
      <div className="mx-auto flex max-w-[1580px] flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-violet-300/30 bg-violet-500/10 text-violet-100">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-white">LIBRE Protect</p>
            <p className="max-w-md text-sm text-slate-400">
              Every ride is secured by blockchain escrow and AI fraud protection.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs uppercase tracking-wide text-slate-500">Payments accepted</span>
          {["USDC", "USDT", "SOL", "BTC", "Stripe"].map((asset) => (
            <AssetPill asset={asset} key={asset} />
          ))}
        </div>

        <div className="flex items-center justify-between gap-5 sm:justify-start">
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-300 text-white shadow-lg shadow-blue-500/20">
              <Blocks className="h-5 w-5" />
            </div>
            <div>
              <p>Powered by Web3</p>
              <p className="text-xs text-slate-500">Built on Base</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-400 text-lg font-black text-white">
              L
            </div>
            <div>
              <p className="text-2xl font-black tracking-[0.18em] text-white">LIBRE</p>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Driver</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
