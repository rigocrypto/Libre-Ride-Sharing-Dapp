import { CalendarDays, DollarSign, Headphones, Navigation, Power } from "lucide-react";
import { driverSoftPanel } from "./driverStyles";

type DriverQuickActionsProps = {
  online: boolean;
  onToggleOnline: () => void;
};

export function DriverQuickActions({ online, onToggleOnline }: DriverQuickActionsProps) {
  const actions = [
    { label: online ? "Go Offline" : "Go Online", icon: Power, onClick: onToggleOnline },
    { label: "Navigate to Hotspot", icon: Navigation },
    { label: "My Schedule", icon: CalendarDays },
    { label: "Earnings Report", icon: DollarSign },
    { label: "Support", icon: Headphones },
  ];

  return (
    <div className={`${driverSoftPanel} p-5`}>
      <h2 className="font-semibold text-white">Quick Actions</h2>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="group flex min-h-[96px] flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-4 text-sm text-slate-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-cyan-300 group-hover:text-white">
              <action.icon className="h-5 w-5" />
            </span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

