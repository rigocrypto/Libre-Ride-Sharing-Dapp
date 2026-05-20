import { Badge } from "@/components/ui/badge";
import type { AdminEscrowStatus } from "@/types/adminEscrow";

interface AdminEscrowStatusBadgeProps {
  status: AdminEscrowStatus | string | null;
  manualReview?: boolean;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  },
  locked: {
    label: "Locked",
    className: "border-cyan-400/40 bg-cyan-400/10 text-cyan-200",
  },
  released: {
    label: "Released",
    className: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  },
  refunded: {
    label: "Refunded",
    className: "border-sky-400/40 bg-sky-400/10 text-sky-200",
  },
  disputed: {
    label: "Disputed",
    className: "border-orange-400/40 bg-orange-400/10 text-orange-200",
  },
  failed: {
    label: "Failed",
    className: "border-red-400/40 bg-red-400/10 text-red-200",
  },
  manual_review: {
    label: "Manual Review",
    className: "border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-200",
  },
  none: {
    label: "No Escrow",
    className: "border-white/15 bg-white/5 text-muted-foreground",
  },
};

export function AdminEscrowStatusBadge({
  status,
  manualReview = false,
}: AdminEscrowStatusBadgeProps) {
  const key = manualReview ? "manual_review" : String(status || "none").toLowerCase();
  const config = statusConfig[key] || statusConfig.none;

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
