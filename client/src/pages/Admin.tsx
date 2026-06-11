import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AdminEscrowFilters } from "@/components/admin/AdminEscrowFilters";
import { AdminEscrowDetailDialog } from "@/components/admin/AdminEscrowDetailDialog";
import { AdminEscrowSummaryCards } from "@/components/admin/AdminEscrowSummaryCards";
import { AdminEscrowTable } from "@/components/admin/AdminEscrowTable";
import { AdminAuditLogTable } from "@/components/admin/AdminAuditLogTable";
import { AdminDriverComplianceDetailDialog } from "@/components/admin/AdminDriverComplianceDetailDialog";
import { AdminDriverComplianceTable } from "@/components/admin/AdminDriverComplianceTable";
import { AdminLeadManagement } from "@/components/admin/AdminLeadManagement";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import type {
  AdminEscrowAction,
  AdminEscrowDetail,
  AdminEscrowFilters as EscrowFilters,
  AdminEscrowRecord,
  AdminEscrowSnapshot,
  AuditLogEntry,
} from "@/types/adminEscrow";
import type {
  AdminDriverComplianceAction,
  AdminDriverComplianceRecord,
} from "@/types/adminDriverCompliance";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DollarSign, Users, Car, AlertTriangle, CheckCircle, XCircle, WalletCards } from "lucide-react";
import { Link } from "wouter";
import { useMemo, useState } from "react";

const defaultEscrowFilters: EscrowFilters = {
  escrowStatus: "all",
  rideStatus: "all",
  token: "all",
  chain: "all",
  verificationMode: "all",
  manualReview: "all",
  search: "",
};

async function fetchAdminEscrows(): Promise<AdminEscrowSnapshot> {
  const response = await apiRequest("GET", "/api/admin/escrows");
  return response.json();
}

async function fetchAdminEscrowDetail(rideId: string): Promise<AdminEscrowDetail> {
  const response = await apiRequest("GET", `/api/admin/escrows/${rideId}`);
  return response.json();
}

async function runAdminEscrowAction(args: {
  rideId: string;
  action: AdminEscrowAction;
  reason: string;
}): Promise<{ detail: AdminEscrowDetail }> {
  const response = await apiRequest(
    "POST",
    `/api/admin/escrows/${args.rideId}/${args.action}`,
    { reason: args.reason }
  );
  return response.json();
}

async function fetchAdminAuditLogs(filters: {
  action: string;
  rideId: string;
  actorId: string;
}): Promise<{ entries: AuditLogEntry[] }> {
  const search = new URLSearchParams();
  if (filters.action.trim()) search.set("action", filters.action.trim());
  if (filters.rideId.trim()) search.set("rideId", filters.rideId.trim());
  if (filters.actorId.trim()) search.set("actorId", filters.actorId.trim());
  const query = search.toString();
  const response = await apiRequest("GET", `/api/admin/audit-logs${query ? `?${query}` : ""}`);
  return response.json();
}

interface DemoAdminRide {
  id: string;
  riderName: string;
  pickup: string;
  destination: string;
  fareUsdc: number;
  driverPayoutUsd: number;
  status: string;
  driverName?: string;
  escrowTxHash?: string;
  createdAt: string;
}

const DEMO_API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

async function fetchDemoAdminRides(): Promise<{ rides: DemoAdminRide[]; total: number }> {
  const res = await fetch(`${DEMO_API_BASE}/api/demo/admin/rides`);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

async function fetchAdminDriverCompliance(filters: {
  status: string;
  search: string;
}): Promise<{ drivers: AdminDriverComplianceRecord[] }> {
  const query = new URLSearchParams();
  if (filters.status !== "all") query.set("status", filters.status);
  if (filters.search.trim()) query.set("search", filters.search.trim());
  const response = await apiRequest(
    "GET",
    `/api/admin/drivers${query.toString() ? `?${query.toString()}` : ""}`
  );
  return response.json();
}

async function fetchAdminDriverDetail(
  driverId: string
): Promise<AdminDriverComplianceRecord> {
  const response = await apiRequest("GET", `/api/admin/drivers/${driverId}`);
  return response.json();
}

async function runAdminDriverComplianceAction(args: {
  driverId: string;
  action: AdminDriverComplianceAction;
  reason: string;
}): Promise<{ driver: AdminDriverComplianceRecord }> {
  const response = await apiRequest(
    "POST",
    `/api/admin/drivers/${args.driverId}/${args.action}`,
    { reason: args.reason }
  );
  return response.json();
}

function matchesFilter(record: AdminEscrowRecord, filters: EscrowFilters): boolean {
  const search = filters.search.trim().toLowerCase();
  const searchable = [
    record.rideId,
    record.riderWallet,
    record.driverWallet,
    record.depositTxHash,
    record.releaseTxHash,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (search && !searchable.includes(search)) return false;
  if (filters.escrowStatus !== "all" && record.escrowStatus !== filters.escrowStatus) {
    return false;
  }
  if (filters.rideStatus !== "all" && record.rideStatus !== filters.rideStatus) {
    return false;
  }
  if (
    filters.token !== "all" &&
    !record.token.toLowerCase().includes(filters.token.toLowerCase())
  ) {
    return false;
  }
  if (filters.chain !== "all" && String(record.chainId) !== filters.chain) return false;
  if (
    filters.verificationMode !== "all" &&
    record.verificationMode !== filters.verificationMode
  ) {
    return false;
  }
  if (
    filters.manualReview !== "all" &&
    String(record.manualReview) !== filters.manualReview
  ) {
    return false;
  }

  return true;
}

export default function Admin() {
  const [selectedTab, setSelectedTab] = useState("escrow");
  const [escrowFilters, setEscrowFilters] = useState(defaultEscrowFilters);
  const [auditFilters, setAuditFilters] = useState({
    action: "",
    rideId: "",
    actorId: "",
  });
  const [driverFilters, setDriverFilters] = useState({
    status: "all",
    search: "",
  });
  const [selectedEscrowRideId, setSelectedEscrowRideId] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [driverActionError, setDriverActionError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const escrowQuery = useQuery({
    queryKey: ["/api/admin/escrows"],
    queryFn: fetchAdminEscrows,
    refetchInterval: 10_000,
  });
  const escrowDetailQuery = useQuery({
    queryKey: ["/api/admin/escrows", selectedEscrowRideId],
    queryFn: () => fetchAdminEscrowDetail(selectedEscrowRideId!),
    enabled: !!selectedEscrowRideId,
  });
  const escrowActionMutation = useMutation({
    mutationFn: runAdminEscrowAction,
    onSuccess: async (result) => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/escrows"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/audit-logs"] });
      queryClient.setQueryData(
        ["/api/admin/escrows", selectedEscrowRideId],
        result.detail
      );
    },
    onError: (error: Error) => setActionError(error.message),
  });
  const auditQuery = useQuery({
    queryKey: ["/api/admin/audit-logs", auditFilters],
    queryFn: () => fetchAdminAuditLogs(auditFilters),
    enabled: selectedTab === "audit",
  });
  const driverComplianceQuery = useQuery({
    queryKey: ["/api/admin/drivers", driverFilters],
    queryFn: () => fetchAdminDriverCompliance(driverFilters),
    enabled: selectedTab === "drivers",
    refetchInterval: 30_000,
  });
  const demoRidesQuery = useQuery({
    queryKey: ["/api/demo/admin/rides"],
    queryFn: fetchDemoAdminRides,
    enabled: selectedTab === "rides",
    refetchInterval: selectedTab === "rides" ? 5_000 : false,
  });
  const driverDetailQuery = useQuery({
    queryKey: ["/api/admin/drivers", selectedDriverId],
    queryFn: () => fetchAdminDriverDetail(selectedDriverId!),
    enabled: !!selectedDriverId,
  });
  const driverActionMutation = useMutation({
    mutationFn: runAdminDriverComplianceAction,
    onSuccess: async (result) => {
      setDriverActionError(null);
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/drivers"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/audit-logs"] });
      queryClient.setQueryData(["/api/admin/drivers", selectedDriverId], result.driver);
    },
    onError: (error: Error) => setDriverActionError(error.message),
  });

  const adminStats = {
    totalRevenue: 124567.89,
    activeRides: 42,
    totalDrivers: 1247,
    totalRiders: 8934,
    pendingDisputes: 3,
    sosAlerts: 1,
  };

  const filteredEscrowRecords = useMemo(() => {
    return (escrowQuery.data?.records || []).filter((record) =>
      matchesFilter(record, escrowFilters)
    );
  }, [escrowFilters, escrowQuery.data?.records]);

  const mockRides = [
    { id: "1", rider: "Alice Johnson", driver: "Bob Smith", status: "completed", fare: "$24.50", timestamp: "10 min ago" },
    { id: "2", rider: "Charlie Brown", driver: "Diana Prince", status: "on_trip", fare: "$18.75", timestamp: "2 min ago" },
    { id: "3", rider: "Eve Wilson", driver: "Frank Castle", status: "en_route", fare: "$32.00", timestamp: "Just now" },
    { id: "4", rider: "Grace Lee", driver: null, status: "matching", fare: "$15.25", timestamp: "5 min ago" },
    { id: "5", rider: "Henry Ford", driver: "Ivy Chen", status: "cancelled", fare: "$22.00", timestamp: "1 hour ago" },
  ];

  const mockDisputes = [
    { id: "1", rideId: "R-1234", reporter: "John Doe", reason: "Wrong fare", status: "pending", timestamp: "2 hours ago" },
    { id: "2", rideId: "R-5678", reporter: "Jane Smith", reason: "Route issue", status: "investigating", timestamp: "5 hours ago" },
    { id: "3", rideId: "R-9012", reporter: "Bob Johnson", reason: "Driver behavior", status: "pending", timestamp: "1 day ago" },
  ];

  const mockSOSAlerts = [
    { id: "1", rideId: "R-7890", user: "Sarah Connor", location: "28.5383,-81.3792", resolved: false, timestamp: "10 min ago" },
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; label: string }> = {
      completed: { variant: "default", label: "Completed" },
      on_trip: { variant: "default", label: "On Trip" },
      in_progress: { variant: "default", label: "In Progress" },
      driver_assigned: { variant: "secondary", label: "Driver Assigned" },
      escrow_confirmed: { variant: "secondary", label: "Escrow Confirmed" },
      payment_pending: { variant: "secondary", label: "Payment Pending" },
      en_route: { variant: "secondary", label: "En Route" },
      matching: { variant: "secondary", label: "Matching" },
      cancelled: { variant: "destructive", label: "Cancelled" },
      pending: { variant: "secondary", label: "Pending" },
      investigating: { variant: "default", label: "Investigating" },
      resolved: { variant: "default", label: "Resolved" },
    };
    const config = statusConfig[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <a className="text-2xl font-bold bg-gradient-neon bg-clip-text text-transparent" data-testid="link-home">
              Libre Admin
            </a>
          </Link>
          <div className="flex items-center gap-4">
            <Badge variant="destructive" className="animate-pulse" data-testid="badge-sos-alerts">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {adminStats.sosAlerts} SOS Alert
            </Badge>
            <Button variant="outline" size="sm" data-testid="button-logout">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Revenue", value: `$${adminStats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-neon-teal" },
            { label: "Active Rides", value: adminStats.activeRides, icon: Car, color: "text-neon-pink" },
            { label: "Total Drivers", value: adminStats.totalDrivers.toLocaleString(), icon: Users, color: "text-neon-purple" },
            { label: "Total Riders", value: adminStats.totalRiders.toLocaleString(), icon: Users, color: "text-accent" },
          ].map((stat) => (
            <Card key={stat.label} className="bg-white/5 backdrop-blur-lg border-white/10 p-6" data-testid={`card-stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p>
              </div>
              <p className="text-3xl font-bold" data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>{stat.value}</p>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="bg-muted/20">
            <TabsTrigger value="escrow" data-testid="tab-escrow">
              <WalletCards className="mr-2 h-4 w-4" />
              Escrow
              {(escrowQuery.data?.summary.manualReviewNeeded || 0) > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1 text-xs">
                  {escrowQuery.data?.summary.manualReviewNeeded}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rides" data-testid="tab-rides">Rides</TabsTrigger>
            <TabsTrigger value="drivers" data-testid="tab-drivers">
              Drivers
              {(driverComplianceQuery.data?.drivers || []).filter(
                (driver) =>
                  driver.approvalStatus === "pending_review" ||
                  driver.approvalStatus === "requires_manual_review" ||
                  driver.approvalStatus === "expired_documents"
              ).length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1 text-xs">
                  {
                    (driverComplianceQuery.data?.drivers || []).filter(
                      (driver) =>
                        driver.approvalStatus === "pending_review" ||
                        driver.approvalStatus === "requires_manual_review" ||
                        driver.approvalStatus === "expired_documents"
                    ).length
                  }
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="leads" data-testid="tab-leads">Leads</TabsTrigger>
            <TabsTrigger value="audit" data-testid="tab-audit">Audit</TabsTrigger>
            <TabsTrigger value="disputes" data-testid="tab-disputes">
              Disputes
              {adminStats.pendingDisputes > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                  {adminStats.pendingDisputes}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sos" data-testid="tab-sos">
              SOS Alerts
              {adminStats.sosAlerts > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs animate-pulse">
                  {adminStats.sosAlerts}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="escrow" className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Escrow Monitor</h2>
                <p className="text-sm text-muted-foreground">
                  Polls every 10 seconds. TODO: upgrade to WebSocket push for dispute alerting.
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                {escrowQuery.data?.generatedAt
                  ? `Last updated ${new Date(escrowQuery.data.generatedAt).toLocaleTimeString()}`
                  : "Waiting for admin escrow data"}
              </div>
            </div>

            {escrowQuery.isError && (
              <Card className="border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
                Admin escrow data is protected. Sign in as an admin to view live ride payment
                details.
              </Card>
            )}

            {escrowQuery.data && (
              <>
                <AdminEscrowSummaryCards summary={escrowQuery.data.summary} />
                <Card className="border-white/10 bg-white/5 p-4">
                  <AdminEscrowFilters
                    filters={escrowFilters}
                    onFiltersChange={setEscrowFilters}
                  />
                </Card>
              </>
            )}

            <AdminEscrowTable
              records={filteredEscrowRecords}
              isLoading={escrowQuery.isLoading}
              onViewDetails={(rideId) => {
                setActionError(null);
                setSelectedEscrowRideId(rideId);
              }}
            />
            <AdminEscrowDetailDialog
              detail={escrowDetailQuery.data || null}
              isOpen={!!selectedEscrowRideId}
              isLoading={escrowDetailQuery.isLoading}
              isActionPending={escrowActionMutation.isPending}
              actionError={actionError}
              onOpenChange={(open) => {
                if (!open) setSelectedEscrowRideId(null);
              }}
              onAction={(action, reason) => {
                if (!selectedEscrowRideId) return;
                escrowActionMutation.mutate({
                  rideId: selectedEscrowRideId,
                  action,
                  reason,
                });
              }}
            />
          </TabsContent>

          <TabsContent value="leads" className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Founding Access Leads</h2>
              <p className="text-sm text-muted-foreground">
                Manage scored driver, investor, sponsor, and partner interest from the public landing page.
              </p>
            </div>
            <AdminLeadManagement />
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Admin Activity</h2>
              <p className="text-sm text-muted-foreground">
                Persistent audit trail for sensitive escrow and operator actions.
              </p>
            </div>
            {auditQuery.isError && (
              <Card className="border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
                Admin audit logs are protected. Sign in as an admin to view activity.
              </Card>
            )}
            <AdminAuditLogTable
              entries={auditQuery.data?.entries || []}
              isLoading={auditQuery.isLoading}
              filters={auditFilters}
              onFiltersChange={setAuditFilters}
            />
          </TabsContent>

          <TabsContent value="drivers" className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Driver Compliance</h2>
              <p className="text-sm text-muted-foreground">
                Review driver applications, document expiration, Orlando permit, and MCO eligibility before dispatch.
              </p>
            </div>
            {driverComplianceQuery.isError && (
              <Card className="border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
                Driver compliance data is protected. Sign in as an admin to view applications.
              </Card>
            )}
            <AdminDriverComplianceTable
              drivers={driverComplianceQuery.data?.drivers || []}
              isLoading={driverComplianceQuery.isLoading}
              status={driverFilters.status}
              search={driverFilters.search}
              onStatusChange={(status) => setDriverFilters((current) => ({ ...current, status }))}
              onSearchChange={(search) => setDriverFilters((current) => ({ ...current, search }))}
              onViewDetails={(driverId) => {
                setDriverActionError(null);
                setSelectedDriverId(driverId);
              }}
            />
            <AdminDriverComplianceDetailDialog
              driver={driverDetailQuery.data || null}
              isOpen={!!selectedDriverId}
              isLoading={driverDetailQuery.isLoading}
              isActionPending={driverActionMutation.isPending}
              actionError={driverActionError}
              onOpenChange={(open) => {
                if (!open) setSelectedDriverId(null);
              }}
              onAction={(action, reason) => {
                if (!selectedDriverId) return;
                driverActionMutation.mutate({
                  driverId: selectedDriverId,
                  action,
                  reason,
                });
              }}
            />
          </TabsContent>

          {/* Rides Table */}
          <TabsContent value="rides">
            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Demo Rides</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Live data from demo backend · auto-refreshes every 5s</p>
                </div>
                <div className="flex items-center gap-3">
                  {demoRidesQuery.isFetching && (
                    <span className="text-xs text-muted-foreground">Refreshing…</span>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {demoRidesQuery.data?.total ?? 0} rides
                  </Badge>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ride ID</TableHead>
                    <TableHead>Rider</TableHead>
                    <TableHead>Pickup → Destination</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fare (USDC)</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(demoRidesQuery.data?.rides ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No demo rides yet. Use the Rider tab to request one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (demoRidesQuery.data?.rides ?? []).map((ride) => (
                      <TableRow key={ride.id} data-testid={`row-ride-${ride.id}`}>
                        <TableCell className="font-mono text-xs">{ride.id.slice(0, 8)}…</TableCell>
                        <TableCell>{ride.riderName}</TableCell>
                        <TableCell className="text-xs max-w-[220px]">
                          <div className="truncate">{ride.pickup}</div>
                          <div className="truncate text-muted-foreground">→ {ride.destination}</div>
                        </TableCell>
                        <TableCell>{ride.driverName ?? <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell>{getStatusBadge(ride.status)}</TableCell>
                        <TableCell className="font-semibold">{ride.fareUsdc} USDC</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {new Date(ride.createdAt).toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Disputes Table */}
          <TabsContent value="disputes">
            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold">Dispute Management</h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dispute ID</TableHead>
                    <TableHead>Ride ID</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockDisputes.map((dispute) => (
                    <TableRow key={dispute.id} data-testid={`row-dispute-${dispute.id}`}>
                      <TableCell className="font-mono text-sm">{dispute.id}</TableCell>
                      <TableCell className="font-mono text-sm">{dispute.rideId}</TableCell>
                      <TableCell>{dispute.reporter}</TableCell>
                      <TableCell>{dispute.reason}</TableCell>
                      <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{dispute.timestamp}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" data-testid={`button-resolve-dispute-${dispute.id}`}>
                          Resolve
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* SOS Alerts Table */}
          <TabsContent value="sos">
            <Card className="bg-white/5 backdrop-blur-lg border-white/10 border-destructive">
              <div className="p-6 border-b border-border bg-destructive/10">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  SOS Alerts - Immediate Action Required
                </h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alert ID</TableHead>
                    <TableHead>Ride ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockSOSAlerts.map((alert) => (
                    <TableRow key={alert.id} className="bg-destructive/5" data-testid={`row-sos-${alert.id}`}>
                      <TableCell className="font-mono text-sm font-bold">{alert.id}</TableCell>
                      <TableCell className="font-mono text-sm">{alert.rideId}</TableCell>
                      <TableCell className="font-semibold">{alert.user}</TableCell>
                      <TableCell className="font-mono text-sm">{alert.location}</TableCell>
                      <TableCell>
                        {alert.resolved ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Resolved
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="animate-pulse">
                            <XCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-destructive font-semibold">{alert.timestamp}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="destructive" size="sm" data-testid={`button-contact-sos-${alert.id}`}>
                            Contact
                          </Button>
                          <Button variant="outline" size="sm" data-testid={`button-resolve-sos-${alert.id}`}>
                            Mark Resolved
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
