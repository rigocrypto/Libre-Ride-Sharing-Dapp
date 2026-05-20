import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AuditLogEntry } from "@/types/adminEscrow";

interface AdminAuditLogTableProps {
  entries: AuditLogEntry[];
  isLoading: boolean;
  filters: {
    action: string;
    rideId: string;
    actorId: string;
  };
  onFiltersChange: (filters: { action: string; rideId: string; actorId: string }) => void;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

function shortValue(value?: string): string {
  if (!value) return "-";
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

export function AdminAuditLogTable({
  entries,
  isLoading,
  filters,
  onFiltersChange,
}: AdminAuditLogTableProps) {
  return (
    <Card className="border-white/10 bg-white/5">
      <div className="grid gap-3 border-b border-border p-4 md:grid-cols-3">
        <Input
          value={filters.action}
          onChange={(event) => onFiltersChange({ ...filters, action: event.target.value })}
          placeholder="Filter by action"
          className="bg-muted/20"
        />
        <Input
          value={filters.rideId}
          onChange={(event) => onFiltersChange({ ...filters, rideId: event.target.value })}
          placeholder="Filter by ride ID"
          className="bg-muted/20"
        />
        <Input
          value={filters.actorId}
          onChange={(event) => onFiltersChange({ ...filters, actorId: event.target.value })}
          placeholder="Filter by actor"
          className="bg-muted/20"
        />
      </div>
      {isLoading ? (
        <div className="p-6 text-sm text-muted-foreground">Loading audit timeline...</div>
      ) : entries.length === 0 ? (
        <div className="p-6 text-sm text-muted-foreground">No audit entries match.</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Ride</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-xs">{entry.action}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {shortValue(entry.actorWallet || entry.actorId)}
                  </TableCell>
                  <TableCell>{entry.actorRole || "admin"}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {shortValue(entry.rideId)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {entry.previousState || "-"} to {entry.nextState || "-"}
                  </TableCell>
                  <TableCell className="max-w-[260px] text-sm text-muted-foreground">
                    {entry.reason || "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(entry.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
