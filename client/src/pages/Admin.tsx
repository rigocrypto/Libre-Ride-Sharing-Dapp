import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Users, Car, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export default function Admin() {
  const [selectedTab, setSelectedTab] = useState("rides");

  const adminStats = {
    totalRevenue: 124567.89,
    activeRides: 42,
    totalDrivers: 1247,
    totalRiders: 8934,
    pendingDisputes: 3,
    sosAlerts: 1,
  };

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
            <TabsTrigger value="rides" data-testid="tab-rides">Rides</TabsTrigger>
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

          {/* Rides Table */}
          <TabsContent value="rides">
            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-bold">All Rides</h2>
                <Input
                  placeholder="Search rides..."
                  className="max-w-xs bg-muted/20"
                  data-testid="input-search-rides"
                />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ride ID</TableHead>
                    <TableHead>Rider</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fare</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRides.map((ride) => (
                    <TableRow key={ride.id} data-testid={`row-ride-${ride.id}`}>
                      <TableCell className="font-mono text-sm">{ride.id}</TableCell>
                      <TableCell>{ride.rider}</TableCell>
                      <TableCell>{ride.driver || "-"}</TableCell>
                      <TableCell>{getStatusBadge(ride.status)}</TableCell>
                      <TableCell className="font-semibold">{ride.fare}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{ride.timestamp}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" data-testid={`button-view-ride-${ride.id}`}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
