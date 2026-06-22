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
