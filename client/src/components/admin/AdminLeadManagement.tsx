import { Badge } from "@/components/ui/badge";
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
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Check, MessageCircle, Download } from "lucide-react";
import { useMemo, useState } from "react";
import {
  buildWhatsAppInviteMessage,
  buildWhatsAppInviteUrl,
} from "@/lib/whatsapp";

type LeadKind = "drivers" | "investors";
type Lead = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  status?: string;
  leadScore?: number;
  source?: string | null;
  wantsDemoAccess?: boolean;
  wantsWhatsAppInvite?: boolean;
  wantsInvestorDeck?: boolean;
  city?: string | null;
  leadType?: string | null;
  followUpAt?: string | null;
  adminNotes?: string | null;
  referralCode?: string | null;
  referredByCode?: string | null;
  referralCount?: number;
};

async function fetchLeads(kind: LeadKind): Promise<{ leads: Lead[] }> {
  const response = await apiRequest("GET", `/api/admin/leads/${kind}`);
  return response.json();
}

async function updateLead(args: { kind: LeadKind; id: string; status: string }) {
  const response = await apiRequest("PATCH", `/api/admin/leads/${args.kind}/${args.id}`, {
    status: args.status,
  });
  return response.json();
}

export function AdminLeadManagement() {
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<LeadKind>("drivers");
  const [status, setStatus] = useState("all");
  const [minScore, setMinScore] = useState("");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["/api/admin/leads", kind],
    queryFn: () => fetchLeads(kind),
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: updateLead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/leads", kind] }),
  });

  const leads = useMemo(() => {
    const floor = minScore ? Number(minScore) : 0;
    return (query.data?.leads || []).filter((lead) => {
      const haystack = `${lead.fullName} ${lead.email} ${lead.phone || ""} ${lead.city || ""} ${lead.leadType || ""}`.toLowerCase();
      if (status !== "all" && lead.status !== status) return false;
      if (floor && (lead.leadScore || 0) < floor) return false;
      if (search && !haystack.includes(search.toLowerCase())) return false;
      return true;
    });
  }, [query.data?.leads, minScore, search, status]);

  const exportHref = `/api/admin/leads/${kind}.csv`;

  function handleCopyMessage(lead: Lead) {
    const firstName = lead.fullName.trim().split(/\s+/)[0] || lead.fullName;
    const message = buildWhatsAppInviteMessage(firstName, lead.referralCode);
    navigator.clipboard.writeText(message).then(() => {
      setCopiedId(lead.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  return (
    <Card className="border-white/10 bg-white/5 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-lg font-bold">Lead CRM</h3>
          <p className="text-sm text-muted-foreground">
            Score, filter, export, and follow up with founding drivers, investors, sponsors, and partners.
          </p>
        </div>
        <Button asChild variant="outline" className="border-white/15">
          <a href={exportHref}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </a>
        </Button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Select value={kind} onValueChange={(value) => setKind(value as LeadKind)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="drivers">Driver leads</SelectItem>
            <SelectItem value="investors">Investor leads</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {["all", "new", "contacted", "qualified", "rejected", "converted"].map((item) => (
              <SelectItem key={item} value={item}>{item}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input value={minScore} onChange={(event) => setMinScore(event.target.value)} placeholder="Minimum score" />
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, city" />
      </div>

      <div className="mt-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Referral</TableHead>
              <TableHead>Intent</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading && (
              <TableRow>
                <TableCell colSpan={7}>Loading leads...</TableCell>
              </TableRow>
            )}
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <div className="font-medium">{lead.fullName}</div>
                  <div className="text-xs text-muted-foreground">{lead.email}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={(lead.leadScore || 0) >= 75 ? "default" : "outline"}>
                    {lead.leadScore || 0}
                  </Badge>
                </TableCell>
                <TableCell>{lead.status || "new"}</TableCell>
                <TableCell>{lead.source || "-"}</TableCell>
                <TableCell className="text-xs">
                  {lead.referralCode ? (
                    <div className="space-y-0.5">
                      <div className="font-mono text-xs">{lead.referralCode}</div>
                      {(lead.referralCount ?? 0) > 0 && (
                        <div className="text-emerald-400">{lead.referralCount} referred</div>
                      )}
                      {lead.referredByCode && (
                        <div className="text-slate-400">via {lead.referredByCode}</div>
                      )}
                    </div>
                  ) : "-"}
                </TableCell>
                <TableCell className="text-xs">
                  {lead.wantsInvestorDeck ? "Deck " : ""}
                  {lead.wantsDemoAccess ? "Demo " : ""}
                  {lead.wantsWhatsAppInvite ? "WhatsApp" : ""}
                  {!lead.wantsInvestorDeck && !lead.wantsDemoAccess && !lead.wantsWhatsAppInvite ? "-" : ""}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-1">
                      {["contacted", "qualified", "converted", "rejected"].map((nextStatus) => (
                        <Button
                          key={nextStatus}
                          size="sm"
                          variant="outline"
                          disabled={mutation.isPending}
                          onClick={() => mutation.mutate({ kind, id: lead.id, status: nextStatus })}
                        >
                          {nextStatus}
                        </Button>
                      ))}
                    </div>
                    {kind === "drivers" && lead.wantsWhatsAppInvite && (() => {
                      const waUrl = buildWhatsAppInviteUrl(lead);
                      if (!waUrl) return null;
                      return (
                        <div className="flex items-center gap-1">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-600/40 text-green-400 hover:bg-green-600/10 hover:text-green-300"
                            >
                              <MessageCircle className="mr-1 h-3 w-3" />
                              WhatsApp Invite
                            </Button>
                          </a>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Copy invite message"
                            onClick={() => handleCopyMessage(lead)}
                          >
                            {copiedId === lead.id
                              ? <Check className="h-3 w-3 text-green-400" />
                              : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      );
                    })()}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!query.isLoading && leads.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>No leads match the current filters.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
