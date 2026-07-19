import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminDriverComplianceStatusBadge } from "./AdminDriverComplianceStatusBadge";
import type { AdminDriverComplianceRecord } from "@/types/adminDriverCompliance";
import { AlertTriangle, CheckCircle, Search } from "lucide-react";

export function AdminDriverComplianceTable({
  drivers,
  isLoading,
  status,
  search,
  onStatusChange,
  onSearchChange,
  onViewDetails,
}: {
  drivers: AdminDriverComplianceRecord[];
  isLoading: boolean;
  status: string;
  search: string;
  onStatusChange: (status: string) => void;
  onSearchChange: (search: string) => void;
  onViewDetails: (driverId: string) => void;
}) {
  return (
    <Card className="border-white/10 bg-white/5">
      <div className="grid gap-3 border-b border-border p-4 md:grid-cols-[220px_1fr]">
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger data-testid="select-driver-compliance-status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending_review">Pending review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="expired_documents">Expired documents</SelectItem>
            <SelectItem value="requires_manual_review">Manual review</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="driver-compliance-search"
            name="driverComplianceSearch"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="pl-9"
            placeholder="Search by driver ID, email, name, or wallet"
            data-testid="input-driver-compliance-search"
          />
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Driver</TableHead>
            <TableHead>Wallet</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Checklist</TableHead>
            <TableHead>Eligibility</TableHead>
            <TableHead>Review</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                Loading driver compliance queue...
              </TableCell>
            </TableRow>
          )}
          {!isLoading && drivers.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                No drivers match this compliance filter.
              </TableCell>
            </TableRow>
          )}
          {drivers.map((driver) => (
            <TableRow key={driver.driverId} data-testid={`row-driver-${driver.driverId}`}>
              <TableCell>
                <div className="font-medium">{driver.email || driver.username || "Driver"}</div>
                <div className="font-mono text-xs text-muted-foreground">{driver.driverId}</div>
              </TableCell>
              <TableCell className="max-w-[180px] truncate font-mono text-xs">
                {driver.walletAddress || "-"}
              </TableCell>
              <TableCell>
                <AdminDriverComplianceStatusBadge status={driver.approvalStatus} />
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                <div>License: {driver.licenseStatus}</div>
                <div>Insurance: {driver.insuranceStatus}</div>
                <div>MCO: {driver.airportEligibilityStatus}</div>
              </TableCell>
              <TableCell>
                {driver.isDispatchEligible ? (
                  <span className="inline-flex items-center gap-1 text-sm text-emerald-200">
                    <CheckCircle className="h-4 w-4" />
                    Eligible
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-sm text-amber-200">
                    <AlertTriangle className="h-4 w-4" />
                    Blocked
                  </span>
                )}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {driver.lastReviewedAt
                  ? new Date(driver.lastReviewedAt).toLocaleDateString()
                  : "Not reviewed"}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(driver.driverId)}
                  data-testid={`button-driver-detail-${driver.driverId}`}
                >
                  Review
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
