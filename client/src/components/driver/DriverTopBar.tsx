import { Bell, Bot, ChevronDown, Circle, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { driverGradientButton } from "./driverStyles";

type DriverTopBarProps = {
  online: boolean;
  onToggleOnline: () => void;
};

export function DriverTopBar({ online, onToggleOnline }: DriverTopBarProps) {
  const network = import.meta.env.VITE_CHAIN_ENV === "production" ? "Base Mainnet" : "Base Sepolia";

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 px-4 py-4 backdrop-blur-xl lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onToggleOnline}
          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left"
        >
          <span className={`grid h-7 w-7 place-items-center rounded-full ${online ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-500/15 text-slate-400"}`}>
            <Circle className="h-3 w-3 fill-current" />
          </span>
          <span>
            <span className="flex items-center gap-1 font-semibold text-white">
              {online ? "You're Online" : "You're Offline"}
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </span>
            <span className="text-sm text-slate-400">
              {online ? "Accepting rides in Orlando, FL" : "Not receiving ride offers"}
            </span>
          </span>
        </button>

        <Button className={`rounded-full px-7 ${driverGradientButton}`}>
          <Bot className="mr-2 h-4 w-4" />
          AI Copilot
          <span className="ml-2 rounded-full bg-blue-500/30 px-2 py-0.5 text-xs">BETA</span>
        </Button>

        <div className="flex items-center gap-3">
          <button className="relative grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-[11px] font-bold">3</span>
          </button>
          <button className="flex h-12 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-white">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-xs">B</span>
            {network}
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          <button className="flex h-12 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-white">
            <WalletCards className="h-4 w-4 text-cyan-300" />
            0xA7...92D
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </div>
    </header>
  );
}

