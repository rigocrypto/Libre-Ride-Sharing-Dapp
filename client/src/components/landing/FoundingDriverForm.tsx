import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

const appOptions = ["Uber", "Lyft", "Empower", "HopSkipDrive", "Other"];

export function FoundingDriverForm() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "Orlando, FL",
    currentApps: [] as string[],
    yearsDriving: "",
    vehicleType: "",
    hasCommercialInsurance: "",
    interestedInAirport: "",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/leads/founding-driver", {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || undefined,
        city: form.city || undefined,
        currentApps: form.currentApps,
        yearsDriving: form.yearsDriving ? Number(form.yearsDriving) : undefined,
        vehicleType: form.vehicleType || undefined,
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
        notes: form.notes || undefined,
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

  return (
    <Card id="founding-driver-form" className="border-white/10 bg-slate-950/80 p-5 text-white shadow-2xl shadow-black/30 backdrop-blur-xl">
      <h3 className="text-2xl font-black">Apply as Founding Driver</h3>
      <p className="mt-2 text-sm text-slate-300">
        Tell us how you drive today and what kind of Orlando pilot access you want.
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
            <Input
              id="driver-full-name"
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="driver-email">Email</Label>
            <Input
              id="driver-email"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="driver-phone">Phone</Label>
            <Input
              id="driver-phone"
              type="tel"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="driver-city">City</Label>
            <Input
              id="driver-city"
              value={form.city}
              onChange={(event) => setForm({ ...form, city: event.target.value })}
            />
          </div>
        </div>

        <div>
          <Label>Apps you drive on now</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {appOptions.map((app) => (
              <button
                key={app}
                type="button"
                onClick={() => toggleApp(app)}
                className={`rounded-full border px-3 py-2 text-sm ${
                  form.currentApps.includes(app)
                    ? "border-cyan-300 bg-cyan-300/15 text-cyan-100"
                    : "border-white/10 bg-white/[0.04] text-slate-300"
                }`}
              >
                {app}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
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
          <Label htmlFor="driver-notes">Notes</Label>
          <Textarea
            id="driver-notes"
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            placeholder="Tell us about your routes, vehicle, airport interest, or beta availability."
          />
        </div>

        {mutation.isSuccess && (
          <p className="flex items-center gap-2 rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-3 text-sm text-emerald-100">
            <CheckCircle className="h-4 w-4" />
            You're on the founding driver list. We'll reach out before the Orlando pilot. Watch your email.
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
          disabled={mutation.isPending}
          className="bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-400"
        >
          {mutation.isPending ? "Submitting..." : "Apply as Founding Driver"}
        </Button>
      </form>
    </Card>
  );
}
