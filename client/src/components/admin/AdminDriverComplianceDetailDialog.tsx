import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminDriverComplianceStatusBadge } from "./AdminDriverComplianceStatusBadge";
import type {
  AdminDriverComplianceAction,
  AdminDriverComplianceRecord,
} from "@/types/adminDriverCompliance";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

function formatDate(value?: string | Date | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export function AdminDriverComplianceDetailDialog({
  driver,
  isOpen,
  isLoading,
  isActionPending,
  actionError,
  onOpenChange,
  onAction,
}: {
  driver: AdminDriverComplianceRecord | null;
  isOpen: boolean;
  isLoading: boolean;
  isActionPending: boolean;
  actionError: string | null;
  onOpenChange: (open: boolean) => void;
  onAction: (action: AdminDriverComplianceAction, reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  const runAction = (action: AdminDriverComplianceAction) => {
    const fallbackReason =
      action === "approve" ? "Driver compliance approved" : reason;
    onAction(action, fallbackReason);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Driver Compliance Review</DialogTitle>
        </DialogHeader>
        {isLoading && <p className="text-sm text-muted-foreground">Loading driver detail...</p>}
        {!isLoading && driver && (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Driver</p>
                <p className="font-medium">{driver.email || driver.username || driver.driverId}</p>
                <p className="font-mono text-xs text-muted-foreground">{driver.driverId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Wallet</p>
                <p className="break-all font-mono text-xs">{driver.walletAddress || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Compliance Status</p>
                <AdminDriverComplianceStatusBadge status={driver.approvalStatus} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dispatch Eligibility</p>
                <p className={driver.isDispatchEligible ? "text-emerald-200" : "text-amber-200"}>
                  {driver.isDispatchEligible ? "Eligible" : "Blocked"}
                </p>
              </div>
            </div>

            {driver.warnings.length > 0 && (
              <div className="rounded-md border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
                <div className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  Compliance warnings
                </div>
                <ul className="mt-2 list-inside list-disc">
                  {driver.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-3">
              {[
                ["License", driver.licenseStatus, driver.licenseExpiresAt],
                ["Insurance", driver.insuranceStatus, driver.insuranceExpiresAt],
                ["Inspection", driver.vehicleInspectionStatus, driver.inspectionExpiresAt],
                ["Orlando Permit", driver.orlandoPermitStatus, driver.orlandoPermitExpiresAt],
                ["Background Check", driver.backgroundCheckStatus, driver.backgroundCheckCompletedAt],
                ["Airport Eligibility", driver.airportEligibilityStatus, driver.mcoEligibilityGrantedAt],
              ].map(([label, status, date]) => (
                <div key={String(label)} className="rounded-md border border-white/10 p-3">
                  <p className="text-xs uppercase text-muted-foreground">{String(label)}</p>
                  <p className="font-medium">{String(status || "pending")}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(date as any)}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-md border border-white/10 p-3">
                <p className="text-xs uppercase text-muted-foreground">Orlando Permit Number</p>
                <p className="font-mono text-sm">{driver.orlandoPermitNumber || "-"}</p>
              </div>
              <div className="rounded-md border border-white/10 p-3">
                <p className="text-xs uppercase text-muted-foreground">Background Provider</p>
                <p className="text-sm">{driver.backgroundCheckProvider || "-"}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="driver-compliance-reason">Reason</Label>
              <Textarea
                id="driver-compliance-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Required for rejection, suspension, and document requests"
                data-testid="textarea-driver-compliance-reason"
              />
              {actionError && <p className="text-sm text-destructive">{actionError}</p>}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => runAction("approve")}
                disabled={isActionPending}
                data-testid="button-driver-approve"
              >
                Approve Driver
              </Button>
              <Button
                variant="outline"
                onClick={() => runAction("request-documents")}
                disabled={isActionPending || reason.trim().length < 10}
                data-testid="button-driver-request-documents"
              >
                Request Documents
              </Button>
              <Button
                variant="destructive"
                onClick={() => runAction("reject")}
                disabled={isActionPending || reason.trim().length < 10}
                data-testid="button-driver-reject"
              >
                Reject
              </Button>
              <Button
                variant="destructive"
                onClick={() => runAction("suspend")}
                disabled={isActionPending || reason.trim().length < 10}
                data-testid="button-driver-suspend"
              >
                Suspend
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
