import { Badge } from "@/components/ui/badge";
import type { DriverComplianceStatus } from "@/types/adminDriverCompliance";

const statusConfig: Record<
  DriverComplianceStatus,
  { label: string; className: string; variant?: "default" | "secondary" | "destructive" | "outline" }
> = {
  unverified: { label: "Unverified", className: "", variant: "secondary" },
  pending_review: { label: "Pending Review", className: "border-amber-400/40 text-amber-100", variant: "outline" },
  approved: { label: "Approved", className: "bg-emerald-500/20 text-emerald-100", variant: "default" },
  rejected: { label: "Rejected", className: "", variant: "destructive" },
  suspended: { label: "Suspended", className: "", variant: "destructive" },
  expired_documents: { label: "Expired Docs", className: "bg-amber-500/20 text-amber-100", variant: "default" },
  requires_manual_review: { label: "Manual Review", className: "border-amber-400/40 text-amber-100", variant: "outline" },
};

export function AdminDriverComplianceStatusBadge({
  status,
}: {
  status: DriverComplianceStatus;
}) {
  const config = statusConfig[status] || statusConfig.unverified;
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}
