import { ChevronRight } from "lucide-react";
import type { DriverDashboardData } from "./mockDriverDashboard";

type DriverWalletSummaryProps = {
  wallet: DriverDashboardData["wallet"];
};

const assetTone: Record<string, string> = {
  USDC: "from-blue-500 to-cyan-400",
  USDT: "from-emerald-500 to-teal-300",
  SOL: "from-violet-500 to-fuchsia-400",
  BTC: "from-orange-500 to-amber-300",
  Stripe: "from-indigo-500 to-blue-400",
};

export function AssetPill({ asset }: { asset: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200">
      <span className={`h-5 w-5 rounded-full bg-gradient-to-br ${assetTone[asset] ?? "from-slate-500 to-slate-300"} grid place-items-center text-[10px] font-bold text-white`}>
        {asset.slice(0, 1)}
      </span>
      {asset}
    </span>
  );
}

export function DriverWalletSummary({ wallet }: DriverWalletSummaryProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>Wallet Balance</span>
        <ChevronRight className="h-4 w-4" />
      </div>
      <div className="mt-3 text-2xl font-semibold text-white">
        ${wallet.balanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </div>
      <div className="mt-1 text-xs text-slate-400">{wallet.usdcBalance.toLocaleString()} USDC available</div>
      <div className="mt-4 flex flex-wrap gap-2">
        {wallet.supportedAssets.map((asset) => (
          <AssetPill key={asset} asset={asset} />
        ))}
      </div>
    </div>
  );
}

