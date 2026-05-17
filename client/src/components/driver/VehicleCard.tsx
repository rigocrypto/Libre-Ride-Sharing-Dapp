import { BadgeCheck, Car, Copy } from "lucide-react";

import type { DriverDashboardData } from "./mockDriverDashboard";
import { driverPanel } from "./driverStyles";

interface VehicleCardProps {
  vehicle: DriverDashboardData["vehicle"];
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  return (
    <section className={`${driverPanel} overflow-hidden p-5`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">Vehicle</h3>
          <p className="text-xs text-slate-400">Active ride profile</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/20 px-2.5 py-1 text-xs font-medium text-violet-100">
          <BadgeCheck className="h-3.5 w-3.5" />
          Verified
        </span>
      </div>

      <div className="relative min-h-[150px] rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/60 p-4">
        <div className="absolute inset-x-8 bottom-8 h-10 rounded-full bg-cyan-400/20 blur-2xl" />
        <div className="relative mx-auto grid h-24 w-52 place-items-center rounded-[2rem] border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/40">
          <Car className="h-16 w-16 text-slate-300" />
        </div>
        <div className="relative mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="font-semibold text-white">{vehicle.name}</p>
            <p className="text-xs text-slate-400">Comfort electric class</p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200 transition hover:border-cyan-300/40 hover:text-white"
            type="button"
          >
            {vehicle.plate}
            <Copy className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      </div>
    </section>
  );
}
