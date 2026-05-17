import { useEffect, useState } from "react";

import { DriverAICopilotCard } from "./DriverAICopilotCard";
import { DriverBottomTrustBar } from "./DriverBottomTrustBar";
import { DriverComplianceCard } from "./DriverComplianceCard";
import { DriverMapPanel, type RideOfferState } from "./DriverMapPanel";
import { DriverQuickActions } from "./DriverQuickActions";
import { DriverSidebar } from "./DriverSidebar";
import { DriverProgressCard, DriverStatusCard, WeeklyEarningsCard } from "./DriverStatsCards";
import { DriverTopBar } from "./DriverTopBar";
import { VehicleCard } from "./VehicleCard";
import { mockDriverDashboard } from "./mockDriverDashboard";

export function DriverDashboard() {
  const [online, setOnline] = useState(mockDriverDashboard.driver.online);
  const [offerState, setOfferState] = useState<RideOfferState>("available");
  const [seconds, setSeconds] = useState(mockDriverDashboard.rideOffer.exclusiveSeconds);

  useEffect(() => {
    if (!online || offerState !== "available" || seconds <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [online, offerState, seconds]);

  const toggleOnline = () => setOnline((current) => !current);

  const handleAcceptRide = () => {
    setOfferState("accepted");
  };

  const handleDeclineRide = () => {
    setOfferState("declined");
  };

  return (
    <div className="dark min-h-screen bg-[#050816] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(124,58,237,0.22),transparent_28%),radial-gradient(circle_at_75%_0%,rgba(14,165,233,0.18),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(2,6,23,0.98))]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(148,163,184,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.04)_1px,transparent_1px)] bg-[size:54px_54px]" />

      <div className="relative flex min-h-screen">
        <DriverSidebar data={mockDriverDashboard} online={online} />

        <div className="flex min-w-0 flex-1 flex-col lg:pl-[300px]">
          <div className="border-b border-white/10 bg-slate-950/70 px-4 py-4 backdrop-blur-xl lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-400 text-lg font-black text-white">
                  L
                </div>
                <div>
                  <p className="text-lg font-black tracking-[0.16em] text-white">LIBRE</p>
                  <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Driver</p>
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  online ? "bg-emerald-400/10 text-emerald-200" : "bg-slate-600/30 text-slate-300"
                }`}
              >
                {online ? "Online" : "Offline"}
              </span>
            </div>
          </div>

          <DriverTopBar online={online} onToggleOnline={toggleOnline} />

          <main className="mx-auto w-full max-w-[1580px] flex-1 px-4 py-4 lg:px-6">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_346px]">
              <div className="min-w-0 space-y-4">
                <DriverMapPanel
                  offer={mockDriverDashboard.rideOffer}
                  offerState={offerState}
                  onAccept={handleAcceptRide}
                  onDecline={handleDeclineRide}
                  seconds={seconds}
                />

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <DriverQuickActions online={online} onToggleOnline={toggleOnline} />
                  <VehicleCard vehicle={mockDriverDashboard.vehicle} />
                </div>
              </div>

              <aside className="space-y-4">
                <DriverProgressCard data={mockDriverDashboard} />
                <DriverStatusCard data={mockDriverDashboard} />
                <DriverAICopilotCard />
                <WeeklyEarningsCard data={mockDriverDashboard} />
                <DriverComplianceCard compliance={mockDriverDashboard.compliance} />
              </aside>
            </div>
          </main>

          <DriverBottomTrustBar />
        </div>
      </div>
    </div>
  );
}
