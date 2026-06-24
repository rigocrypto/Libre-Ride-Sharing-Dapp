export function normalizeWhatsAppPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return digits;
  return null;
}

export function buildWhatsAppInviteMessage(
  firstName: string,
  referralCode?: string | null,
): string {
  const base = `Hi ${firstName}, this is the LIBRE Ride team. Thanks for joining the founding driver list. We're preparing the Orlando launch and wanted to invite you to our driver WhatsApp updates group.`;
  return referralCode ? `${base} Your invite code is ${referralCode}.` : base;
}

export function buildWhatsAppInviteUrl(lead: {
  phone?: string | null;
  fullName: string;
  referralCode?: string | null;
}): string | null {
  if (!lead.phone) return null;
  const phone = normalizeWhatsAppPhone(lead.phone);
  if (!phone) return null;
  const firstName = lead.fullName.trim().split(/\s+/)[0] || lead.fullName;
  const message = buildWhatsAppInviteMessage(firstName, lead.referralCode);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

// --- Founding driver registration fallback ---
// When the API submission fails, drivers can still reach LIBRE manually with
// their details pre-filled. VITE_LIBRE_WHATSAPP overrides the team's WhatsApp
// number; if neither env nor the default resolve, we degrade to a mailto: link.
export const DEFAULT_LIBRE_WHATSAPP = "16892165223";
export const DEFAULT_LIBRE_CONTACT_EMAIL = "security@gmx-labs.com";

export interface FoundingDriverFallbackInput {
  fullName?: string;
  phone?: string;
  email?: string;
  city?: string;
  preferredZones?: string[];
  driverType?: string;
  hasCommercialInsurance?: string;
}

export function buildFoundingDriverFallbackMessage(input: FoundingDriverFallbackInput): string {
  const lines = [
    "Hi LIBRE, I tried to apply as a Founding Driver but the form failed. Here is my information:",
    "",
    input.fullName ? `Name: ${input.fullName}` : null,
    input.phone ? `Phone: ${input.phone}` : null,
    input.email ? `Email: ${input.email}` : null,
    input.city ? `City: ${input.city}` : null,
    input.preferredZones?.length ? `Preferred zones: ${input.preferredZones.join(", ")}` : null,
    input.driverType ? `Availability: ${input.driverType}` : null,
    input.hasCommercialInsurance ? `Commercial/TNC insurance: ${input.hasCommercialInsurance}` : null,
  ].filter((line): line is string => line !== null);
  return lines.join("\n");
}

/**
 * Returns a ready-to-open contact link (and matching button label) so a failed
 * registration is never lost. Prefers WhatsApp when VITE_LIBRE_WHATSAPP is set,
 * otherwise falls back to a pre-filled email.
 */
export function buildFoundingDriverFallback(input: FoundingDriverFallbackInput): {
  href: string;
  label: string;
  channel: "whatsapp" | "email";
} {
  const message = buildFoundingDriverFallbackMessage(input);
  const rawNumber =
    ((import.meta.env.VITE_LIBRE_WHATSAPP as string | undefined)?.trim() || DEFAULT_LIBRE_WHATSAPP);
  const supportEmail =
    (import.meta.env.VITE_LIBRE_CONTACT_EMAIL as string | undefined)?.trim() || DEFAULT_LIBRE_CONTACT_EMAIL;
  const supportPhone = normalizeWhatsAppPhone(rawNumber);

  if (supportPhone) {
    return {
      href: `https://wa.me/${supportPhone}?text=${encodeURIComponent(message)}`,
      label: "Send registration by WhatsApp",
      channel: "whatsapp",
    };
  }

  const subject = "Founding Driver application (form failed)";
  return {
    href: `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`,
    label: "Send registration by email",
    channel: "email",
  };
}
