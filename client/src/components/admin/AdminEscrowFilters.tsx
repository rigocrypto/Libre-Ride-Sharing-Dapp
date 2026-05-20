import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminEscrowFilters as Filters } from "@/types/adminEscrow";

interface AdminEscrowFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

function updateFilter(filters: Filters, key: keyof Filters, value: string): Filters {
  return { ...filters, [key]: value };
}

export function AdminEscrowFilters({
  filters,
  onFiltersChange,
}: AdminEscrowFiltersProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-8">
      <Input
        value={filters.search}
        onChange={(event) =>
          onFiltersChange(updateFilter(filters, "search", event.target.value))
        }
        placeholder="Search ride ID or wallet"
        className="bg-muted/20 xl:col-span-2"
        data-testid="input-admin-escrow-search"
      />
      <Input
        value={filters.token === "all" ? "" : filters.token}
        onChange={(event) =>
          onFiltersChange(updateFilter(filters, "token", event.target.value || "all"))
        }
        placeholder="Token address"
        className="bg-muted/20"
      />
      <Select
        value={filters.escrowStatus}
        onValueChange={(value) =>
          onFiltersChange(updateFilter(filters, "escrowStatus", value))
        }
      >
        <SelectTrigger data-testid="select-admin-escrow-status">
          <SelectValue placeholder="Escrow status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All escrow</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="locked">Locked</SelectItem>
          <SelectItem value="released">Released</SelectItem>
          <SelectItem value="refunded">Refunded</SelectItem>
          <SelectItem value="disputed">Disputed</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
          <SelectItem value="none">No escrow</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.rideStatus}
        onValueChange={(value) =>
          onFiltersChange(updateFilter(filters, "rideStatus", value))
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Ride status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All rides</SelectItem>
          <SelectItem value="REQUESTED">Requested</SelectItem>
          <SelectItem value="OFFERED">Offered</SelectItem>
          <SelectItem value="ACCEPTED">Accepted</SelectItem>
          <SelectItem value="IN_PROGRESS">In progress</SelectItem>
          <SelectItem value="COMPLETED">Completed</SelectItem>
          <SelectItem value="CANCELLED">Cancelled</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.verificationMode}
        onValueChange={(value) =>
          onFiltersChange(updateFilter(filters, "verificationMode", value))
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Verifier" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All verifiers</SelectItem>
          <SelectItem value="viem">Viem</SelectItem>
          <SelectItem value="mock">Mock</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.chain}
        onValueChange={(value) => onFiltersChange(updateFilter(filters, "chain", value))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Chain" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All chains</SelectItem>
          <SelectItem value="84532">Base Sepolia</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.manualReview}
        onValueChange={(value) =>
          onFiltersChange(updateFilter(filters, "manualReview", value))
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Review" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All review states</SelectItem>
          <SelectItem value="true">Manual review</SelectItem>
          <SelectItem value="false">Clear</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
