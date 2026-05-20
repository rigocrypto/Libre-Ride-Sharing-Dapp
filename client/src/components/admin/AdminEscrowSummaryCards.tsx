import { AlertTriangle, BadgeDollarSign, CircleDollarSign, LockKeyhole, RefreshCcw, RotateCcw, ShieldAlert, WalletCards } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { AdminEscrowSummary } from "@/types/adminEscrow";

interface AdminEscrowSummaryCardsProps {
  summary: AdminEscrowSummary;
}

const cardConfig = [
  { key: "totalEscrowedRides", label: "Total Escrowed", icon: WalletCards, className: "text-cyan-200" },
  { key: "lockedEscrows", label: "Locked", icon: LockKeyhole, className: "text-emerald-200" },
  { key: "pendingDeposits", label: "Pending", icon: RefreshCcw, className: "text-amber-200" },
  { key: "failedVerifications", label: "Failed", icon: ShieldAlert, className: "text-red-200" },
  { key: "disputedRides", label: "Disputed", icon: AlertTriangle, className: "text-orange-200" },
  { key: "releasedPayments", label: "Released", icon: BadgeDollarSign, className: "text-green-200" },
  { key: "refundPending", label: "Refunded", icon: RotateCcw, className: "text-sky-200" },
  { key: "manualReviewNeeded", label: "Manual Review", icon: CircleDollarSign, className: "text-fuchsia-200" },
] as const;

export function AdminEscrowSummaryCards({ summary }: AdminEscrowSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
      {cardConfig.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.key} className="border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
              <Icon className={`h-4 w-4 ${item.className}`} />
              <span>{item.label}</span>
            </div>
            <p className="mt-3 text-2xl font-semibold">{summary[item.key]}</p>
          </Card>
        );
      })}
    </div>
  );
}
