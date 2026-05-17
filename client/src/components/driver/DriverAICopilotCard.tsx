import { Bot, DollarSign, TrendingUp, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { driverGradientButton, driverPanel } from "./driverStyles";

export function DriverAICopilotCard() {
  return (
    <section className={`${driverPanel} p-5`}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/30">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white">AI Copilot Tips</h3>
              <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-100">
                Beta
              </span>
            </div>
            <p className="text-xs text-slate-400">Smart matching and earnings optimization</p>
          </div>
        </div>
        <button
          aria-label="Dismiss AI tip"
          className="rounded-full p-1 text-slate-500 transition hover:bg-white/10 hover:text-white"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex gap-3 rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/20">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-white">Demand is rising near MCO</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              Airport-eligible drivers could receive higher-quality ride offers over the next 2 hours.
            </p>
          </div>
        </div>

        <div className="flex gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-300/20">
            <DollarSign className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-white">Expected extra earnings</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              You could earn $25-$40 more by moving toward the International Drive to MCO corridor.
            </p>
          </div>
        </div>
      </div>

      <Button className={`${driverGradientButton} mt-5 w-full rounded-2xl`} type="button">
        Go to Heatmap
      </Button>
    </section>
  );
}
