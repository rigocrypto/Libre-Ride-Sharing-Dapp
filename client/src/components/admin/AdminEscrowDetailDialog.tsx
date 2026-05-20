import { AlertTriangle } from "lucide-react";
import { useState } from "react";

import { AdminEscrowStatusBadge } from "@/components/admin/AdminEscrowStatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { AdminEscrowAction, AdminEscrowDetail } from "@/types/adminEscrow";

interface AdminEscrowDetailDialogProps {
  detail: AdminEscrowDetail | null;
  isOpen: boolean;
  isLoading: boolean;
  isActionPending: boolean;
  actionError: string | null;
  onOpenChange: (open: boolean) => void;
  onAction: (action: AdminEscrowAction, reason: string) => void;
}

const actionLabels: Record<AdminEscrowAction, string> = {
  "mark-review": "Mark manual review",
  "retry-verification": "Retry verification",
  release: "Release payment",
  refund: "Refund rider",
  dispute: "Open dispute review",
};

function shortValue(value: string | null | undefined): string {
  if (!value) return "-";
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export function AdminEscrowDetailDialog({
  detail,
  isOpen,
  isLoading,
  isActionPending,
  actionError,
  onOpenChange,
  onAction,
}: AdminEscrowDetailDialogProps) {
  const [reason, setReason] = useState("");
  const escrow = detail?.escrow;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Escrow Detail</DialogTitle>
          <DialogDescription>
            Review ride payment state before taking any admin action.
          </DialogDescription>
        </DialogHeader>

        {isLoading && <p className="text-sm text-muted-foreground">Loading escrow detail...</p>}

        {escrow && (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["Ride ID", escrow.rideId],
                ["Rider wallet", escrow.riderWallet],
                ["Driver wallet", escrow.driverWallet],
                ["Ride status", escrow.rideStatus],
                ["Escrow amount", escrow.amount === null ? "-" : `${escrow.amount} USDC`],
                ["Token", escrow.token],
                ["Chain ID", String(escrow.chainId)],
                ["Deposit tx", escrow.depositTxHash],
                ["Release tx", escrow.releaseTxHash],
                ["Verification mode", escrow.verificationMode],
                ["Created", formatDate(escrow.createdAt)],
                ["Updated", formatDate(escrow.updatedAt)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-white/10 bg-white/5 p-3">
                  <p className="text-xs uppercase text-muted-foreground">{label}</p>
                  <p className="mt-1 break-all font-mono text-sm">{shortValue(value)}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <AdminEscrowStatusBadge
                status={escrow.escrowStatus}
                manualReview={escrow.manualReview}
              />
              {escrow.riskReason && (
                <span className="text-sm text-amber-200">{escrow.riskReason}</span>
              )}
            </div>

            <Alert className="border-amber-400/30 bg-amber-400/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Fund-moving actions are guarded</AlertTitle>
              <AlertDescription>
                Release and refund remain disabled by the backend unless mock admin mode is
                explicitly enabled. Every enabled action requires a reason of at least 10
                characters.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="admin-escrow-reason">
                Action reason
              </label>
              <Textarea
                id="admin-escrow-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Describe why this action is needed..."
              />
              {actionError && <p className="text-sm text-destructive">{actionError}</p>}
            </div>

            <div className="flex flex-wrap gap-2">
              {(Object.keys(actionLabels) as AdminEscrowAction[]).map((action) => (
                <Button
                  key={action}
                  variant={action === "release" || action === "refund" ? "outline" : "default"}
                  disabled={
                    isActionPending ||
                    reason.trim().length < 10 ||
                    !detail?.allowedActions[action]
                  }
                  onClick={() => onAction(action, reason)}
                >
                  {actionLabels[action]}
                </Button>
              ))}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold">Audit Trail</h3>
              {detail?.auditLog.length ? (
                <div className="space-y-2">
                  {detail.auditLog.map((entry) => (
                    <div key={entry.id} className="rounded-md border border-white/10 p-3">
                      <div className="flex flex-wrap justify-between gap-2 text-sm">
                        <span className="font-semibold">{entry.action}</span>
                        <span className="text-muted-foreground">
                          {formatDate(entry.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {entry.previousState || "-"} to {entry.nextState || "-"}
                      </p>
                      {entry.reason && <p className="mt-1 text-sm">{entry.reason}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No admin audit entries yet.</p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
