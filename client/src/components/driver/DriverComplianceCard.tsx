import { BadgeCheck, FileCheck2, ShieldCheck } from "lucide-react";

import type { DriverDashboardData } from "./mockDriverDashboard";
import { driverPanel } from "./driverStyles";

interface DriverComplianceCardProps {
  compliance: DriverDashboardData["compliance"];
}

export function DriverComplianceCard({ compliance }: DriverComplianceCardProps) {
  return (
    <section className={`${driverPanel} p-5`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">Compliance Status</h3>
          <p className="text-xs text-slate-400">Orlando and airport readiness</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-300/25">
          <ShieldCheck className="h-5 w-5" />
        </div>
      </div>

      <div className="space-y-2">
        {compliance.map((item) => (
          <div
            className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
            key={item.label}
          >
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-400/10 text-emerald-200">
                {item.label.includes("Document") ? (
                  <FileCheck2 className="h-4 w-4" />
                ) : (
                  <BadgeCheck className="h-4 w-4" />
                )}
              </div>
              <span className="text-sm text-slate-200">{item.label}</span>
            </div>
            <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-200">
              {item.status}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-blue-400/15 bg-blue-400/5 px-4 py-3">
        <p className="text-sm font-medium text-blue-100">MCO eligible</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          Driver profile is ready for airport matching once live permit validation is connected.
        </p>
      </div>
    </section>
  );
}
