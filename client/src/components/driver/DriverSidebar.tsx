import { Star } from "lucide-react";
import { driverNavigation, type DriverDashboardData } from "./mockDriverDashboard";
import { DriverWalletSummary } from "./DriverWalletSummary";

type DriverSidebarProps = {
  data: DriverDashboardData;
  online: boolean;
};

export function DriverSidebar({ data, online }: DriverSidebarProps) {
  return (
    <aside className="hidden w-[300px] shrink-0 border-r border-white/10 bg-slate-950/90 px-5 py-6 lg:flex lg:flex-col">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-400 text-2xl font-black text-white shadow-lg shadow-violet-950/40">
          L
        </div>
        <div>
          <div className="text-4xl font-black tracking-[0.16em] text-white">LIBRE</div>
          <div className="text-xs uppercase tracking-[0.5em] text-slate-400">Driver</div>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-4">
        <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-lg font-bold text-white">
          {data.driver.avatarInitials}
          <span className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-slate-950 ${online ? "bg-emerald-400" : "bg-slate-500"}`} />
        </div>
        <div>
          <div className="font-semibold text-white">{data.driver.name}</div>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2 py-1 text-xs font-semibold text-white">
              <Star className="h-3 w-3 fill-white" />
              {data.driver.rating.toFixed(2)}
            </span>
            <span className={`text-xs font-medium ${online ? "text-emerald-400" : "text-slate-400"}`}>
              {online ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>Earnings Today</span>
          <span>{data.earnings.todayRides} rides</span>
        </div>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="text-3xl font-semibold text-white">${data.earnings.todayUsd.toFixed(2)}</div>
            <div className="mt-1 text-xs text-slate-400">Online {data.earnings.onlineTime}</div>
          </div>
          <div className="flex h-10 items-end gap-1">
            {[20, 28, 24, 36, 31, 44, 41].map((height, index) => (
              <span
                key={index}
                className="w-1.5 rounded-full bg-gradient-to-t from-violet-600 to-cyan-400"
                style={{ height }}
              />
            ))}
          </div>
        </div>
      </div>

      <nav className="mt-4 space-y-1">
        {driverNavigation.map((item, index) => (
          <button
            key={item.label}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition ${
              index === 0
                ? "bg-gradient-to-r from-violet-700 to-blue-700 text-white shadow-lg shadow-violet-950/40"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-3">
              <item.icon className="h-4 w-4" />
              {item.label}
            </span>
            {item.badge && (
              <span className={`rounded-full px-2 py-0.5 text-xs ${item.badge === "NEW" ? "bg-violet-700 text-violet-100" : "bg-rose-500 text-white"}`}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-5">
        <DriverWalletSummary wallet={data.wallet} />
      </div>
    </aside>
  );
}

