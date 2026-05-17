import { Clock, MapPin, ShieldCheck, Timer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DriverDashboardData } from "./mockDriverDashboard";
import { driverGradientButton, driverSoftPanel } from "./driverStyles";

type RideOfferState = "available" | "accepted" | "declined";

type RideRequestCardProps = {
  offer: DriverDashboardData["rideOffer"];
  seconds: number;
  state: RideOfferState;
  onAccept: () => void;
  onDecline: () => void;
};

export function RideRequestCard({ offer, seconds, state, onAccept, onDecline }: RideRequestCardProps) {
  if (state === "declined") {
    return (
      <div className={`${driverSoftPanel} p-5 text-center`}>
        <p className="font-medium text-white">Ride offer declined</p>
        <p className="mt-1 text-sm text-slate-400">Waiting for the next smart match.</p>
      </div>
    );
  }

  const accepted = state === "accepted";

  return (
    <div className={`${driverSoftPanel} p-5`}>
      <div className="flex items-start justify-between border-b border-white/10 pb-4">
        <div>
          <div className="text-lg font-semibold text-white">
            {accepted ? "Ride Accepted" : "New Ride Request"}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
            <Timer className="h-3.5 w-3.5 text-violet-300" />
            Exclusive offer
          </div>
        </div>
        <div className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-sm text-violet-200">
          {accepted ? "Active" : `${seconds}s`}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div className="flex gap-3">
          <span className="mt-1 h-3 w-3 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/40" />
          <div>
            <div className="font-medium text-white">{offer.pickup}</div>
            <div className="text-sm text-slate-400">{offer.pickupAddress}</div>
          </div>
        </div>
        <div className="flex gap-3">
          <span className="mt-1 h-3 w-3 rounded-full bg-rose-400 shadow-lg shadow-rose-400/40" />
          <div>
            <div className="font-medium text-white">{offer.dropoff}</div>
            <div className="text-sm text-slate-400">{offer.dropoffAddress}</div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-y border-white/10 py-4">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <MapPin className="h-4 w-4 text-cyan-300" />
          {offer.distanceMiles} mi
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Clock className="h-4 w-4 text-violet-300" />
          {offer.etaMinutes} min est.
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
            Includes ${offer.tollEstimateUsd.toFixed(2)} tolls
            <span className="rounded-full bg-amber-500/15 px-2 py-1 text-xs text-amber-200">SunPass aware</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            {offer.escrowConfirmed ? "Escrow Confirmed" : "Escrow Pending"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold text-white">${offer.fareUsdc.toFixed(2)}</div>
          <div className="text-sm text-slate-400">USDC</div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button onClick={onAccept} disabled={accepted} className={`h-12 rounded-xl ${driverGradientButton}`}>
          {accepted ? "Accepted" : "Accept"}
        </Button>
        <Button onClick={onDecline} disabled={accepted} variant="outline" className="h-12 rounded-xl border-white/10 bg-slate-900/80 text-white hover:bg-white/10">
          <X className="mr-2 h-4 w-4" />
          Decline
        </Button>
      </div>
    </div>
  );
}

