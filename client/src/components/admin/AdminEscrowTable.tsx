import { ExternalLink } from "lucide-react";

import { AdminEscrowStatusBadge } from "@/components/admin/AdminEscrowStatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminEscrowRecord } from "@/types/adminEscrow";

interface AdminEscrowTableProps {
  records: AdminEscrowRecord[];
  isLoading: boolean;
}

function shortValue(value: string | null, leading = 6, trailing = 4): string {
  if (!value) return "-";
  if (value.length <= leading + trailing + 3) return value;
  return `${value.slice(0, leading)}...${value.slice(-trailing)}`;
}

function formatAmount(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "-";
  return `${value.toLocaleString(undefined, {
    maximumFractionDigits: 6,
  })} USDC`;
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AdminEscrowTable({ records, isLoading }: AdminEscrowTableProps) {
  if (isLoading) {
    return (
      <Card className="border-white/10 bg-white/5 p-6 text-sm text-muted-foreground">
        Loading escrow monitor...
      </Card>
    );
  }

  if (records.length === 0) {
    return (
      <Card className="border-white/10 bg-white/5 p-6 text-sm text-muted-foreground">
        No escrow records match the current filters.
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-white/10 bg-white/5">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ride ID</TableHead>
              <TableHead>Rider Wallet</TableHead>
              <TableHead>Driver Wallet</TableHead>
              <TableHead>Ride</TableHead>
              <TableHead>Escrow</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Token</TableHead>
              <TableHead>Chain</TableHead>
              <TableHead>Deposit Tx</TableHead>
              <TableHead>Verifier</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.rideId} data-testid={`row-admin-escrow-${record.rideId}`}>
                <TableCell className="font-mono text-xs">
                  {shortValue(record.rideId, 8, 4)}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {shortValue(record.riderWallet)}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {shortValue(record.driverWallet)}
                </TableCell>
                <TableCell>{record.rideStatus || "-"}</TableCell>
                <TableCell>
                  <AdminEscrowStatusBadge
                    status={record.escrowStatus}
                    manualReview={record.manualReview}
                  />
                </TableCell>
                <TableCell className="font-semibold">{formatAmount(record.amount)}</TableCell>
                <TableCell className="font-mono text-xs">
                  {shortValue(record.token)}
                </TableCell>
                <TableCell>{record.chainId}</TableCell>
                <TableCell className="font-mono text-xs">
                  {shortValue(record.depositTxHash)}
                </TableCell>
                <TableCell>{record.verificationMode}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(record.updatedAt)}
                </TableCell>
                <TableCell className="max-w-[180px] text-sm text-muted-foreground">
                  {record.riskReason || "Clear"}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" disabled>
                      <ExternalLink className="mr-1 h-3.5 w-3.5" />
                      Ride
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      Retry
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      Review
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
