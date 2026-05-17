import { Gift, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DriverDashboardData } from "./mockDriverDashboard";
import { driverGradientButton, driverSoftPanel } from "./driverStyles";

type DriverStatsCardsProps = {
  data: DriverDashboardData;
};

export function DriverProgressCard({ data }: DriverStatsCardsProps) {
  const progress = (data.progress.completed / data.progress.target) * 100;

  return (
    <div className={`${driverSoftPanel} p-5`}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-white">Today's Progress</h2>
        <span className="text-sm text-emerald-300">
          {data.progress.completed} / {data.progress.target} rides
        </span>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-6 flex items-center justify-between">
        <div>
          <div className="text-3xl font-semibold text-white">${data.earnings.todayUsd.toFixed(2)}</div>
          <div className="text-sm text-slate-400">
            Complete {data.progress.bonusRemaining} more rides to unlock ${data.progress.bonusUsd} bonus
          </div>
        </div>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-300">
          <Gift className="h-6 w-6" />
        </span>
      </div>
    </div>
  );
}

export function DriverStatusCard({ data }: DriverStatsCardsProps) {
  return (
    <div className={`${driverSoftPanel} p-5`}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-white">Driver Status</h2>
        <span className="text-sm text-violet-200">{data.driver.tier}</span>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { label: "Acceptance Rate", value: `${data.driver.acceptanceRate}%` },
          { label: "Rating", value: data.driver.rating.toFixed(2), icon: Star },
          { label: "Total Rides", value: String(data.driver.totalRides) },
        ].map((stat) => (
          <div key={stat.label}>
            <div className="flex items-center gap-1 text-2xl font-semibold text-white">
              {stat.value}
              {stat.icon && <stat.icon className="h-4 w-4 fill-blue-400 text-blue-400" />}
            </div>
            <div className="mt-1 text-xs text-slate-400">{stat.label}</div>
          </div>
        ))}
      </div>
      <Button className={`mt-6 h-11 w-full rounded-xl ${driverGradientButton}`}>View Benefits</Button>
    </div>
  );
}

export function WeeklyEarningsCard({ data }: DriverStatsCardsProps) {
  const max = Math.max(...data.earnings.weeklyBars.map((bar) => bar.amount));

  return (
    <div className={`${driverSoftPanel} p-5`}>
      <h2 className="font-semibold text-white">Earnings This Week</h2>
      <div className="mt-5 flex items-end justify-between gap-2">
        <div>
          <div className="text-3xl font-semibold text-white">
            ${data.earnings.weeklyUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-sm text-emerald-300">+{data.earnings.weekChangePercent}% vs last week</div>
        </div>
      </div>
      <div className="mt-5 flex h-28 items-end gap-3">
        {data.earnings.weeklyBars.map((bar) => (
          <div key={bar.day} className="flex flex-1 flex-col items-center gap-2">
            <div
              className={`w-full rounded-t-md ${bar.day === "Fri" ? "bg-violet-500" : "bg-slate-600"}`}
              style={{ height: `${Math.max(16, (bar.amount / max) * 96)}px` }}
            />
            <span className="text-xs text-slate-400">{bar.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

