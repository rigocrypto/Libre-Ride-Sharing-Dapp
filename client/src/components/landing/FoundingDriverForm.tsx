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
import { trackLandingEvent } from "@/lib/landingAnalytics";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle, Copy, XCircle } from "lucide-react";
import type React from "react";
import { useState } from "react";

type DriverLeadResponse = {
  success: boolean;
  data: {
    message: string;
    referralCode?: string;
  };
};

const appOptions = ["Uber", "Lyft", "Empower", "HopSkipDrive", "Other"];
const sourceOptions = [
  "WhatsApp driver group",
  "LinkedIn",
  "Friend/referral",
  "Facebook",
  "Instagram",
  "Google search",
  "Orlando driver community",
  "Investor contact",
  "Other",
];
const zoneOptions = [
  "MCO Airport",
  "Disney/Lake Buena Vista",
  "Universal/I-Drive",
  "Downtown Orlando",
  "Kissimmee",
  "Convention Center",
];

export function FoundingDriverForm() {
  const [referredByCode] = useState(
    () => new URLSearchParams(window.location.search).get("ref")?.toUpperCase().trim() || "",
  );
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "Orlando, FL",
    currentApps: [] as string[],
    yearsDriving: "",
    driverType: "",
    vehicleType: "",
    vehicleYear: "",
    vehicleMakeModel: "",
    hasCommercialInsurance: "",
    interestedInAirport: "",
    airportExperience: "",
    preferredZones: [] as string[],
    source: "",
    referralName: "",
    wantsDemoAccess: false,
    wantsWhatsAppInvite: false,
    consentContact: false,
    consentVerification: false,
    consentPrivacy: false,
    notes: "",
  });

  const mutation = useMutation<DriverLeadResponse>({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/leads/founding-driver", {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || undefined,
        city: form.city || undefined,
        currentApps: form.currentApps,
        yearsDriving: form.yearsDriving ? Number(form.yearsDriving) : undefined,
        driverType: form.driverType || undefined,
        vehicleType: form.vehicleType || undefined,
        vehicleYear: form.vehicleYear ? Number(form.vehicleYear) : undefined,
        vehicleMakeModel: form.vehicleMakeModel || undefined,
        hasCommercialInsurance:
          form.hasCommercialInsurance === "yes"
            ? true
            : form.hasCommercialInsurance === "no"
              ? false
              : undefined,
        interestedInAirport:
          form.interestedInAirport === "yes"
            ? true
            : form.interestedInAirport === "no"
              ? false
              : undefined,
        airportExperience: form.airportExperience || undefined,
        preferredZones: form.preferredZones,
        source: form.source || undefined,
        referralName: form.referralName || undefined,
        referredByCode: referredByCode || undefined,
        wantsDemoAccess: form.wantsDemoAccess,
        wantsWhatsAppInvite: form.wantsWhatsAppInvite,
        consentContact: form.consentContact,
        consentVerification: form.consentVerification,
        consentPrivacy: form.consentPrivacy,
        notes: form.notes || undefined,
      });
      trackLandingEvent("driver_form_submitted", {
        wantsDemoAccess: form.wantsDemoAccess,
        wantsWhatsAppInvite: form.wantsWhatsAppInvite,
        source: form.source,
      });
      return response.json();
    },
  });

  const toggleApp = (app: string) => {
    setForm((current) => ({
      ...current,
      currentApps: current.currentApps.includes(app)
        ? current.currentApps.filter((item) => item !== app)
        : [...current.currentApps, app],
    }));
  };

  const toggleZone = (zone: string) => {
    setForm((current) => ({
      ...current,
      preferredZones: current.preferredZones.includes(zone)
        ? current.preferredZones.filter((item) => item !== zone)
        : [...current.preferredZones, zone],
    }));
  };

  const canSubmit = form.consentContact && form.consentVerification && form.consentPrivacy;

  return (
    <Card id="founding-driver-form" className="border-white/10 bg-slate-950/80 p-5 text-white shadow-2xl shadow-black/30 backdrop-blur-xl">
      <h3 className="text-2xl font-black">Apply as Founding Driver</h3>
      <p className="mt-2 text-sm text-slate-300">
        Tell us how you drive today, where you want to operate, and how LIBRE should follow up.
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
            <Label htmlFor="driver-full-name">Full name</Label>
            <Input id="driver-full-name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />
          </div>
          <div>
            <Label htmlFor="driver-email">Email</Label>
            <Input id="driver-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          </div>
          <div>
            <Label htmlFor="driver-phone">Phone</Label>
            <Input id="driver-phone" type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </div>
          <div>
            <Label htmlFor="driver-city">City</Label>
            <Input id="driver-city" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
          </div>
        </div>

        <div>
          <Label>Apps you drive on now</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {appOptions.map((app) => (
              <button key={app} type="button" onClick={() => toggleApp(app)} className={`rounded-full border px-3 py-2 text-sm ${form.currentApps.includes(app) ? "border-cyan-300 bg-cyan-300/15 text-cyan-100" : "border-white/10 bg-white/[0.04] text-slate-300"}`}>
                {app}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>Driver schedule</Label>
            <Select value={form.driverType} onValueChange={(value) => setForm({ ...form, driverType: value })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {["Full-time", "Part-time", "Weekends", "Airport-focused", "Not currently driving"].map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Years driving</Label>
            <Select value={form.yearsDriving} onValueChange={(value) => setForm({ ...form, yearsDriving: value })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Less than 1</SelectItem>
                <SelectItem value="2">1-3</SelectItem>
                <SelectItem value="4">3-5</SelectItem>
                <SelectItem value="7">5-10</SelectItem>
                <SelectItem value="11">10+</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Commercial/TNC insurance</Label>
            <Select value={form.hasCommercialInsurance} onValueChange={(value) => setForm({ ...form, hasCommercialInsurance: value })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="working">Not yet, working on it</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>Vehicle type</Label>
            <Select value={form.vehicleType} onValueChange={(value) => setForm({ ...form, vehicleType: value })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {["Sedan", "SUV", "Minivan", "Truck", "Luxury", "Other"].map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="driver-vehicle-year">Vehicle year</Label>
            <Input id="driver-vehicle-year" inputMode="numeric" value={form.vehicleYear} onChange={(event) => setForm({ ...form, vehicleYear: event.target.value })} placeholder="2021" />
          </div>
          <div>
            <Label htmlFor="driver-vehicle-model">Make/model</Label>
            <Input id="driver-vehicle-model" value={form.vehicleMakeModel} onChange={(event) => setForm({ ...form, vehicleMakeModel: event.target.value })} placeholder="Toyota Highlander" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Interested in airport/MCO rides?</Label>
            <Select value={form.interestedInAirport} onValueChange={(value) => setForm({ ...form, interestedInAirport: value })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="maybe">Maybe</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Airport pickup experience</Label>
            <Select value={form.airportExperience} onValueChange={(value) => setForm({ ...form, airportExperience: value })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="experienced">Experienced</SelectItem>
                <SelectItem value="some">Some experience</SelectItem>
                <SelectItem value="none">No experience yet</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Preferred Orlando zones</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {zoneOptions.map((zone) => (
              <button key={zone} type="button" onClick={() => toggleZone(zone)} className={`rounded-full border px-3 py-2 text-sm ${form.preferredZones.includes(zone) ? "border-emerald-300 bg-emerald-300/15 text-emerald-100" : "border-white/10 bg-white/[0.04] text-slate-300"}`}>
                {zone}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>How did you hear about LIBRE?</Label>
            <Select value={form.source} onValueChange={(value) => setForm({ ...form, source: value })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {sourceOptions.map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="driver-referral">Referral name/code</Label>
            <Input id="driver-referral" value={form.referralName} onChange={(event) => setForm({ ...form, referralName: event.target.value })} />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <ConsentRow checked={form.wantsDemoAccess} onChange={(checked) => setForm({ ...form, wantsDemoAccess: checked })}>
            I want early demo access.
          </ConsentRow>
          <ConsentRow checked={form.wantsWhatsAppInvite} onChange={(checked) => setForm({ ...form, wantsWhatsAppInvite: checked })}>
            Request a LIBRE Orlando driver WhatsApp invite.
          </ConsentRow>
        </div>

        <div>
          <Label htmlFor="driver-notes">Notes</Label>
          <Textarea id="driver-notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Tell us about your routes, airport interest, beta availability, or compliance readiness." />
        </div>

        <div className="grid gap-3">
          <ConsentRow checked={form.consentContact} onChange={(checked) => setForm({ ...form, consentContact: checked })}>
            I agree to be contacted by LIBRE about the Orlando pilot.
          </ConsentRow>
          <ConsentRow checked={form.consentVerification} onChange={(checked) => setForm({ ...form, consentVerification: checked })}>
            I understand driver approval may require license, insurance, vehicle, and background verification.
          </ConsentRow>
          <ConsentRow checked={form.consentPrivacy} onChange={(checked) => setForm({ ...form, consentPrivacy: checked })}>
            I agree to the Privacy Policy.
          </ConsentRow>
        </div>

        {mutation.isSuccess && (() => {
          const code = mutation.data?.data?.referralCode;
          const inviteUrl = code
            ? `${window.location.origin}/founding-access?ref=${code}`
            : null;
          return (
            <div className="space-y-3 rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-4 text-sm text-emerald-100">
              <p className="flex items-center gap-2 font-medium">
                <CheckCircle className="h-4 w-4 shrink-0" />
                You're on the founding driver list. We'll reach out before the Orlando pilot. Watch your email.
              </p>
              {code && inviteUrl && (
                <div className="space-y-2 border-t border-emerald-300/20 pt-3">
                  <p className="text-xs text-emerald-200">
                    Your invite code: <span className="font-mono font-bold tracking-widest text-white">{code}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono text-xs text-emerald-200">{inviteUrl}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(inviteUrl);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        } catch (error) {
                          console.error("Failed to copy to clipboard:", error);
                        }
                      }}
                      className="flex shrink-0 items-center gap-1 rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-2 py-1 text-xs hover:bg-emerald-300/20"
                    >
                      <Copy className="h-3 w-3" />
                      {copied ? "Copied!" : "Copy link"}
                    </button>
                  </div>
                  <p className="text-xs text-emerald-300">Share this link with other Orlando drivers to grow the waitlist.</p>
                </div>
              )}
            </div>
          );
        })()}
        {mutation.isError && (
          <p className="flex items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">
            <XCircle className="h-4 w-4" />
            {mutation.error.message.includes("already") ? "You're already on the list. We'll be in touch." : mutation.error.message}
          </p>
        )}
        <Button type="submit" disabled={mutation.isPending || !canSubmit} className="bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-400">
          {mutation.isPending ? "Submitting..." : "Apply as Founding Driver"}
        </Button>
      </form>
    </Card>
  );
}

function ConsentRow({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-200">
      <Checkbox checked={checked} onCheckedChange={(value) => onChange(value === true)} />
      <span>{children}</span>
    </label>
  );
}
