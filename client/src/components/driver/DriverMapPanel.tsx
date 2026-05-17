import { Crosshair, Filter, Navigation, Shield } from "lucide-react";
import type { DriverDashboardData } from "./mockDriverDashboard";
import { RideRequestCard } from "./RideRequestCard";
import { driverPanel } from "./driverStyles";

export type RideOfferState = "available" | "accepted" | "declined";

type DriverMapPanelProps = {
  offer: DriverDashboardData["rideOffer"];
  seconds: number;
  offerState: RideOfferState;
  onAccept: () => void;
  onDecline: () => void;
};

export function DriverMapPanel({ offer, seconds, offerState, onAccept, onDecline }: DriverMapPanelProps) {
  return (
    <section className={`${driverPanel} relative min-h-[640px] overflow-hidden`}>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.08)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_42%,rgba(124,58,237,0.28),transparent_24%),radial-gradient(circle_at_38%_56%,rgba(34,211,238,0.18),transparent_22%),linear-gradient(135deg,rgba(15,23,42,0.9),rgba(2,6,23,0.72))]" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-slate-950 to-transparent" />

      <div className="absolute left-[50%] top-[30%] text-3xl font-semibold text-white/70">Orlando</div>
      {["Winter Park", "Lake Nona", "Kissimmee", "Belle Isle", "MCO", "I-Drive"].map((label, index) => (
        <span
          key={label}
          className="absolute rounded-full bg-slate-950/70 px-2 py-1 text-xs text-slate-400"
          style={{
            left: `${18 + index * 12}%`,
            top: `${18 + (index % 3) * 22}%`,
          }}
        >
          {label}
        </span>
      ))}

      <div className="absolute left-[25%] top-[62%] h-2 w-[42%] rotate-[-8deg] rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 shadow-[0_0_22px_rgba(34,211,238,0.7)]" />
      <div className="absolute left-[66%] top-[48%] h-40 w-2 rounded-full bg-gradient-to-b from-violet-500 to-rose-400 shadow-[0_0_22px_rgba(244,63,94,0.6)]" />

      <div className="absolute left-[22%] top-[61%] grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/40">
        <Navigation className="h-4 w-4" />
      </div>
      <div className="absolute left-[65%] top-[45%] grid h-10 w-10 place-items-center rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/40">
        <Crosshair className="h-5 w-5" />
      </div>
      <div className="absolute left-[50%] top-[55%] rounded-xl border border-white/10 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-900 shadow-xl">
        {offer.etaMinutes} min<br />
        {offer.distanceMiles} mi
      </div>

      <div className="absolute left-[14%] top-[19%] h-28 w-28 rounded-full bg-blue-500/20 blur-xl" />
      <div className="absolute left-[55%] top-[47%] h-32 w-32 rounded-full bg-violet-500/20 blur-xl" />
      <div className="absolute left-[36%] top-[66%] h-24 w-24 rounded-full bg-emerald-400/20 blur-xl" />

      <div className="absolute right-5 top-6 flex flex-col gap-3">
        {[
          { icon: Filter, label: "Filters" },
          { icon: Shield, label: "Safety" },
          { icon: Crosshair, label: "Center" },
        ].map((control) => (
          <button
            key={control.label}
            className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-slate-950/80 text-white backdrop-blur hover:bg-white/10"
            aria-label={control.label}
          >
            <control.icon className="h-5 w-5" />
          </button>
        ))}
      </div>

      <div className="absolute left-5 top-5 w-[min(92%,350px)]">
        <RideRequestCard
          offer={offer}
          seconds={seconds}
          state={offerState}
          onAccept={onAccept}
          onDecline={onDecline}
        />
      </div>

      <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-slate-950/80 p-5 backdrop-blur-xl md:left-5 md:right-auto md:w-[480px]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600/20 text-violet-300">
              <Navigation className="h-5 w-5" />
            </span>
            <div>
              <div className="font-semibold text-white">High Demand Area</div>
              <div className="text-sm text-slate-400">International Dr / Convention Center</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-violet-300">2.4x</div>
            <div className="text-xs text-slate-400">Demand</div>
          </div>
        </div>
      </div>
    </section>
  );
}
