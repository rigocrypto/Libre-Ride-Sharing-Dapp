import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AlertTriangle, CheckCircle2, Loader2, Lock, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { DepositStatus } from "@/hooks/useEscrowDeposit";

interface RiderEscrowPaymentCardProps {
  amount: number;
  status: DepositStatus;
  statusLabel: string;
  onDeposit: () => void;
  isLoading?: boolean;
  isWalletReady?: boolean;
  walletAddress?: string;
  approvalHash?: string | null;
  depositHash?: string | null;
  error?: string;
}

const progressByStatus: Record<DepositStatus, number> = {
  WALLET_NOT_CONNECTED: 8,
  READY_TO_DEPOSIT: 18,
  AWAITING_APPROVAL_SIGNATURE: 30,
  APPROVAL_PENDING: 42,
  APPROVAL_CONFIRMED: 55,
  AWAITING_DEPOSIT_SIGNATURE: 66,
  TRANSACTION_PENDING: 78,
  VERIFYING_ESCROW: 90,
  DEPOSIT_CONFIRMED: 100,
  DEPOSIT_FAILED: 100,
  APPROVAL_FAILED: 42,
};

const activeStates = new Set<DepositStatus>([
  "AWAITING_APPROVAL_SIGNATURE",
  "APPROVAL_PENDING",
  "AWAITING_DEPOSIT_SIGNATURE",
  "TRANSACTION_PENDING",
  "VERIFYING_ESCROW",
]);

function shortHash(hash?: string | null) {
  if (!hash) return null;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

function shortAddress(address?: string) {
  if (!address) return null;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function RiderEscrowPaymentCard({
  amount,
  status,
  statusLabel,
  onDeposit,
  isLoading = false,
  isWalletReady = false,
  walletAddress,
  approvalHash,
  depositHash,
  error,
}: RiderEscrowPaymentCardProps) {
  const isConfirmed = status === "DEPOSIT_CONFIRMED";
  const isFailed = status === "DEPOSIT_FAILED" || status === "APPROVAL_FAILED";
  const isBusy = isLoading || activeStates.has(status);

  return (
    <Card className="p-6 bg-white/5 backdrop-blur-lg border-white/10">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Escrow deposit</p>
            <p className="text-3xl font-bold text-foreground">{amount.toFixed(2)} USDC</p>
          </div>
          <Badge
            variant={isConfirmed ? "default" : isFailed ? "destructive" : "secondary"}
            className="shrink-0"
          >
            {isConfirmed ? "Confirmed" : isFailed ? "Failed" : "Pending"}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{statusLabel}</span>
            <span className="font-medium">{progressByStatus[status]}%</span>
          </div>
          <Progress value={progressByStatus[status]} className="h-2" />
        </div>

        <div className="grid gap-3 text-sm">
          <div className="flex items-center gap-3 rounded-md border border-white/10 bg-black/10 px-3 py-2">
            <Wallet className="h-4 w-4 text-neon-teal" />
            <span className="text-muted-foreground">Wallet</span>
            <span className="ml-auto font-medium">
              {shortAddress(walletAddress) ?? "Not connected"}
            </span>
          </div>

          <div className="flex items-center gap-3 rounded-md border border-white/10 bg-black/10 px-3 py-2">
            <Lock className="h-4 w-4 text-neon-purple" />
            <span className="text-muted-foreground">USDC allowance</span>
            <span className="ml-auto font-medium">
              {approvalHash ? shortHash(approvalHash) : status === "APPROVAL_CONFIRMED" ? "Ready" : "Checked before deposit"}
            </span>
          </div>

          <div className="flex items-center gap-3 rounded-md border border-white/10 bg-black/10 px-3 py-2">
            <CheckCircle2 className="h-4 w-4 text-neon-pink" />
            <span className="text-muted-foreground">Escrow transaction</span>
            <span className="ml-auto font-medium">{shortHash(depositHash) ?? "Not submitted"}</span>
          </div>
        </div>

        {error && (
          <div className="flex gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!isWalletReady && (
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        )}

        <Button
          onClick={onDeposit}
          disabled={!isWalletReady || isBusy || isConfirmed}
          className="w-full bg-gradient-neon hover:opacity-90"
          size="lg"
        >
          {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isConfirmed ? "Escrow confirmed" : `Pay $${amount.toFixed(2)} with USDC`}
        </Button>
      </div>
    </Card>
  );
}
