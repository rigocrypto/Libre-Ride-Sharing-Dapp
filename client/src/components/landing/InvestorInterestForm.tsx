import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

export function InvestorInterestForm() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    leadType: "",
    interestRange: "",
    accredited: "",
    interestType: "",
    message: "",
    complianceAcknowledged: false,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/leads/investor-interest", {
        ...form,
        phone: form.phone || undefined,
        interestRange: form.interestRange || undefined,
        accredited: form.accredited || undefined,
        interestType: form.interestType || undefined,
        message: form.message || undefined,
      });
      return response.json();
    },
  });

  return (
    <Card id="investor-form" className="border-white/10 bg-slate-950/80 p-5 text-white shadow-2xl shadow-black/30 backdrop-blur-xl">
      <h3 className="text-2xl font-black">Request Investor or Partner Access</h3>
      <p className="mt-2 text-sm text-slate-300">
        This is interest collection for a future compliant process, not an offer to sell securities.
      </p>
      <form
        className="mt-6 grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="investor-full-name">Full name</Label>
            <Input
              id="investor-full-name"
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="investor-email">Email</Label>
            <Input
              id="investor-email"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="investor-phone">Phone</Label>
            <Input
              id="investor-phone"
              type="tel"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={form.leadType} onValueChange={(value) => setForm({ ...form, leadType: value })} required>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {["Investor", "Sponsor", "Driver-Investor", "Transportation Operator", "Strategic Partner", "Other"].map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>Interest range</Label>
            <Select value={form.interestRange} onValueChange={(value) => setForm({ ...form, interestRange: value })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {["Under $500", "$500-$2,500", "$2,500-$10,000", "$10,000-$25,000", "$25,000+", "Prefer not to say"].map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Accredited investor?</Label>
            <Select value={form.accredited} onValueChange={(value) => setForm({ ...form, accredited: value })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {["Yes", "No", "Not sure", "Prefer not to say"].map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Interest type</Label>
            <Select value={form.interestType} onValueChange={(value) => setForm({ ...form, interestType: value })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {["Equity", "SAFE", "Sponsorship", "Utility Token", "Partnership", "Not sure yet"].map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="investor-message">Message</Label>
          <Textarea
            id="investor-message"
            maxLength={500}
            value={form.message}
            onChange={(event) => setForm({ ...form, message: event.target.value })}
            placeholder="Tell us what kind of partnership, sponsorship, or future compliant process you want to discuss."
          />
        </div>

        <label className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-200">
          <Checkbox
            checked={form.complianceAcknowledged}
            onCheckedChange={(checked) =>
              setForm({ ...form, complianceAcknowledged: checked === true })
            }
            required
          />
          <span>
            I understand this is not a securities offering and LIBRE is collecting interest only
            for a future compliant process.
          </span>
        </label>

        {mutation.isSuccess && (
          <p className="flex items-center gap-2 rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-3 text-sm text-emerald-100">
            <CheckCircle className="h-4 w-4" />
            You're on the investor and partner interest list. We'll follow up with next steps.
          </p>
        )}
        {mutation.isError && (
          <p className="flex items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">
            <XCircle className="h-4 w-4" />
            {mutation.error.message.includes("already")
              ? "You're already on the list. We'll be in touch."
              : mutation.error.message}
          </p>
        )}
        <Button
          type="submit"
          disabled={mutation.isPending || !form.complianceAcknowledged}
          className="bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-400"
        >
          {mutation.isPending ? "Submitting..." : "Join Investor Interest List"}
        </Button>
      </form>
    </Card>
  );
}
