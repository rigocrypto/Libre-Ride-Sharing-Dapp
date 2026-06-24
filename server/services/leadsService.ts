import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { withDbRetry } from "../db/retry";

// Characters that avoid visual ambiguity (no 0/O, no I/1)
const REFERRAL_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type LeadStatus = "new" | "contacted" | "qualified" | "rejected" | "converted";

export type FoundingDriverLeadInput = {
  fullName: string;
  email: string;
  phone?: string;
  city?: string;
  currentApps?: string[];
  yearsDriving?: number;
  driverType?: string;
  vehicleType?: string;
  vehicleYear?: number;
  vehicleMakeModel?: string;
  hasCommercialInsurance?: boolean;
  interestedInAirport?: boolean;
  airportExperience?: string;
  preferredZones?: string[];
  source?: string;
  referralName?: string;
  referredByCode?: string | null;
  wantsDemoAccess?: boolean;
  wantsWhatsAppInvite?: boolean;
  consentContact?: boolean;
  consentVerification?: boolean;
  consentPrivacy?: boolean;
  notes?: string;
  ipAddress?: string;
};

export type InvestorInterestLeadInput = {
  fullName: string;
  email: string;
  phone?: string;
  leadType: string;
  interestRange?: string;
  accredited?: string;
  interestType?: string;
  preferredNextStep?: string;
  source?: string;
  referralCode?: string;
  referralName?: string;
  wantsDemoAccess?: boolean;
  wantsInvestorDeck?: boolean;
  wantsWhatsAppInvite?: boolean;
  consentContact?: boolean;
  consentNotOffering?: boolean;
  consentPrivacy?: boolean;
  message?: string;
  ipAddress?: string;
};

export type LeadUpdateInput = {
  status?: LeadStatus;
  adminNotes?: string;
  followUpAt?: Date | null;
  lastContactedAt?: Date | null;
};

type DriverLeadRecord = FoundingDriverLeadInput & {
  id: string;
  status: LeadStatus;
  leadScore: number;
  referralCode: string;
  referredByCode?: string | null;
  adminNotes?: string | null;
  followUpAt?: Date | null;
  lastContactedAt?: Date | null;
  createdAt: Date;
};

type InvestorLeadRecord = InvestorInterestLeadInput & {
  id: string;
  status: LeadStatus;
  leadScore: number;
  adminNotes?: string | null;
  followUpAt?: Date | null;
  lastContactedAt?: Date | null;
  createdAt: Date;
};

export class DuplicateLeadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateLeadError";
  }
}

const driverLeads: DriverLeadRecord[] = [];
const investorLeads: InvestorLeadRecord[] = [];

function normalizedEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizedText(value?: string) {
  return value?.trim().toLowerCase() || "";
}

function shouldUsePersistentLeads(): boolean {
  const engine = process.env.STORAGE_ENGINE;
  return !!process.env.DATABASE_URL && engine !== "mem" && process.env.NODE_ENV !== "test";
}

function isDuplicateKeyError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return message.includes("duplicate key") || message.includes("unique constraint");
}

export function scoreFoundingDriverLead(input: FoundingDriverLeadInput): number {
  let score = 0;
  const city = normalizedText(input.city);
  const apps = (input.currentApps || []).map(normalizedText);
  const vehicleType = normalizedText(input.vehicleType);
  const airportExperience = normalizedText(input.airportExperience);

  if (["orlando", "kissimmee", "lake buena vista", "winter park"].some((area) => city.includes(area))) {
    score += 10;
  }
  if (apps.some((app) => ["uber", "lyft", "empower", "hopskipdrive"].includes(app))) {
    score += 20;
  }
  if ((input.yearsDriving || 0) >= 2) {
    score += 20;
  }
  if (["sedan", "suv", "minivan", "luxury"].includes(vehicleType)) {
    score += 15;
  }
  if (input.vehicleYear && input.vehicleYear >= 2015) {
    score += 5;
  }
  if (input.interestedInAirport || ["yes", "experienced"].includes(airportExperience)) {
    score += 15;
  }
  if (input.hasCommercialInsurance) {
    score += 15;
  }
  if (input.wantsDemoAccess) {
    score += 5;
  }
  if (input.wantsWhatsAppInvite) {
    score += 5;
  }

  return Math.min(score, 100);
}

export function scoreInvestorInterestLead(input: InvestorInterestLeadInput): number {
  let score = 0;
  const interestRange = normalizedText(input.interestRange);
  const accredited = normalizedText(input.accredited);
  const leadType = normalizedText(input.leadType);
  const interestType = normalizedText(input.interestType);
  const nextStep = normalizedText(input.preferredNextStep);
  const message = normalizedText(input.message);

  if (interestRange.includes("10,000") || interestRange.includes("25,000") || interestRange.includes("25000")) {
    score += 25;
  }
  if (accredited === "yes") {
    score += 20;
  }
  if (
    ["strategic partner", "transportation operator", "sponsor"].includes(leadType) ||
    ["partnership", "sponsorship"].includes(interestType)
  ) {
    score += 20;
  }
  if (input.wantsDemoAccess || input.wantsInvestorDeck || ["book call", "see demo", "receive deck"].includes(nextStep)) {
    score += 15;
  }
  if (message.includes("transport") || message.includes("fleet") || message.includes("web3") || message.includes("payment")) {
    score += 10;
  }
  if (input.consentContact && input.consentNotOffering && input.consentPrivacy) {
    score += 10;
  }

  return Math.min(score, 100);
}

export function leadPriority(score: number): "Hot Lead" | "Warm Lead" | "Needs Review" | "Low Priority" {
  if (score >= 75) return "Hot Lead";
  if (score >= 50) return "Warm Lead";
  if (score >= 25) return "Needs Review";
  return "Low Priority";
}

// --- Referral code helpers ---

function referralPrefix(fullName?: string): string {
  if (!fullName) return "LIBRE";
  const first = fullName.trim().split(/\s+/)[0];
  const cleaned = first.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 8);
  return cleaned || "LIBRE";
}

function referralSuffix(): string {
  return Array.from({ length: 6 }, () =>
    REFERRAL_CHARS[Math.floor(Math.random() * REFERRAL_CHARS.length)],
  ).join("");
}

export function generateReferralCode(fullName?: string): string {
  return `${referralPrefix(fullName)}-${referralSuffix()}`;
}

async function generateUniqueReferralCode(fullName?: string): Promise<string> {
  if (shouldUsePersistentLeads()) {
    const [{ db }, { foundingDriverLeads }] = await Promise.all([
      import("../db/client"),
      import("../db/schema"),
    ]);
    for (let i = 0; i < 5; i++) {
      const code = generateReferralCode(fullName);
      const [existing] = await withDbRetry(
        () =>
          db
            .select({ id: foundingDriverLeads.id })
            .from(foundingDriverLeads)
            .where(eq(foundingDriverLeads.referralCode, code))
            .limit(1),
        { label: "referral code lookup" },
      );
      if (!existing) return code;
    }
  } else {
    for (let i = 0; i < 5; i++) {
      const code = generateReferralCode(fullName);
      if (!driverLeads.some((lead) => lead.referralCode === code)) return code;
    }
  }
  throw new Error("[REFERRAL] Failed to generate unique referral code after 5 attempts");
}

async function resolveReferredByCode(
  rawCode: string,
  submitterEmail: string,
): Promise<{ referredByCode: string | null; referralStatus: string }> {
  const code = rawCode.toUpperCase().trim();

  if (shouldUsePersistentLeads()) {
    const [{ db }, { foundingDriverLeads }] = await Promise.all([
      import("../db/client"),
      import("../db/schema"),
    ]);
    const [owner] = await withDbRetry(
      () =>
        db
          .select({ email: foundingDriverLeads.email })
          .from(foundingDriverLeads)
          .where(eq(foundingDriverLeads.referralCode, code))
          .limit(1),
      { label: "referred-by lookup" },
    );

    if (!owner) {
      console.warn(`[REFERRAL] invalid referral code ignored: ${code}`);
      return { referredByCode: null, referralStatus: "invalid" };
    }
    if (normalizedEmail(owner.email) === normalizedEmail(submitterEmail)) {
      console.warn(`[REFERRAL] self-referral ignored for: ${submitterEmail}`);
      return { referredByCode: null, referralStatus: "self" };
    }
    return { referredByCode: code, referralStatus: "attributed" };
  }

  const owner = driverLeads.find((lead) => lead.referralCode === code);
  if (!owner) {
    console.warn(`[REFERRAL] invalid referral code ignored: ${code}`);
    return { referredByCode: null, referralStatus: "invalid" };
  }
  if (normalizedEmail(owner.email) === normalizedEmail(submitterEmail)) {
    console.warn(`[REFERRAL] self-referral ignored for: ${submitterEmail}`);
    return { referredByCode: null, referralStatus: "self" };
  }
  return { referredByCode: code, referralStatus: "attributed" };
}

export async function createFoundingDriverLead(input: FoundingDriverLeadInput) {
  const { referredByCode: rawRefCode, ...rest } = input;
  const email = normalizedEmail(rest.email);
  const leadScore = scoreFoundingDriverLead(input);
  const referralCode = await generateUniqueReferralCode(input.fullName);
  const { referredByCode, referralStatus } = rawRefCode
    ? await resolveReferredByCode(rawRefCode, email)
    : { referredByCode: null, referralStatus: "none" };

  const values = { ...rest, email, leadScore, status: "new" as LeadStatus, referralCode, referredByCode };

  if (shouldUsePersistentLeads()) {
    const [{ db }, { foundingDriverLeads }] = await Promise.all([
      import("../db/client"),
      import("../db/schema"),
    ]);
    try {
      const [inserted] = await withDbRetry(
        () => db.insert(foundingDriverLeads).values(values).returning(),
        { label: "founding driver insert" },
      );
      return { lead: inserted, referralStatus };
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new DuplicateLeadError("You're already on the founding driver list. We'll be in touch.");
      }
      throw error;
    }
  }

  if (driverLeads.some((lead) => normalizedEmail(lead.email) === email)) {
    throw new DuplicateLeadError("You're already on the founding driver list. We'll be in touch.");
  }
  const lead = { ...values, id: randomUUID(), createdAt: new Date() };
  driverLeads.push(lead);
  return { lead, referralStatus };
}

export async function createInvestorInterestLead(input: InvestorInterestLeadInput) {
  const email = normalizedEmail(input.email);
  const leadScore = scoreInvestorInterestLead(input);
  const values = { ...input, email, leadScore, status: "new" as LeadStatus };

  if (shouldUsePersistentLeads()) {
    const [{ db }, { investorInterestLeads }] = await Promise.all([
      import("../db/client"),
      import("../db/schema"),
    ]);
    try {
      const [inserted] = await withDbRetry(
        () => db.insert(investorInterestLeads).values(values).returning(),
        { label: "investor interest insert" },
      );
      return inserted;
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new DuplicateLeadError("You're already on the investor interest list. We'll be in touch.");
      }
      throw error;
    }
  }

  if (investorLeads.some((lead) => normalizedEmail(lead.email) === email)) {
    throw new DuplicateLeadError("You're already on the investor interest list. We'll be in touch.");
  }
  const lead = { ...values, id: randomUUID(), createdAt: new Date() };
  investorLeads.push(lead);
  return lead;
}

export async function listFoundingDriverLeads() {
  if (shouldUsePersistentLeads()) {
    const [{ db }, { foundingDriverLeads }] = await Promise.all([
      import("../db/client"),
      import("../db/schema"),
    ]);
    return db.select().from(foundingDriverLeads).orderBy(desc(foundingDriverLeads.createdAt));
  }
  return [...driverLeads].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function listInvestorInterestLeads() {
  if (shouldUsePersistentLeads()) {
    const [{ db }, { investorInterestLeads }] = await Promise.all([
      import("../db/client"),
      import("../db/schema"),
    ]);
    return db.select().from(investorInterestLeads).orderBy(desc(investorInterestLeads.createdAt));
  }
  return [...investorLeads].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function updateFoundingDriverLead(id: string, input: LeadUpdateInput) {
  const updates = normalizeLeadUpdates(input);
  if (shouldUsePersistentLeads()) {
    const [{ db }, { foundingDriverLeads }] = await Promise.all([
      import("../db/client"),
      import("../db/schema"),
    ]);
    const [updated] = await db
      .update(foundingDriverLeads)
      .set(updates)
      .where(eq(foundingDriverLeads.id, id))
      .returning();
    return updated ?? null;
  }

  const lead = driverLeads.find((item) => item.id === id);
  if (!lead) return null;
  Object.assign(lead, updates);
  return lead;
}

export async function updateInvestorInterestLead(id: string, input: LeadUpdateInput) {
  const updates = normalizeLeadUpdates(input);
  if (shouldUsePersistentLeads()) {
    const [{ db }, { investorInterestLeads }] = await Promise.all([
      import("../db/client"),
      import("../db/schema"),
    ]);
    const [updated] = await db
      .update(investorInterestLeads)
      .set(updates)
      .where(eq(investorInterestLeads.id, id))
      .returning();
    return updated ?? null;
  }

  const lead = investorLeads.find((item) => item.id === id);
  if (!lead) return null;
  Object.assign(lead, updates);
  return lead;
}

function normalizeLeadUpdates(input: LeadUpdateInput) {
  const updates: LeadUpdateInput = { ...input };
  if (updates.status === "contacted" && updates.lastContactedAt === undefined) {
    updates.lastContactedAt = new Date();
  }
  return updates;
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const normalized = Array.isArray(value) ? value.join("; ") : value instanceof Date ? value.toISOString() : String(value);
  return /[",\n\r]/.test(normalized) ? `"${normalized.replace(/"/g, '""')}"` : normalized;
}

export function leadsToCsv(leads: Array<Record<string, unknown>>, fields: string[]): string {
  const rows = [fields.join(",")];
  for (const lead of leads) {
    rows.push(fields.map((field) => csvEscape(lead[field])).join(","));
  }
  return `${rows.join("\n")}\n`;
}

export function clearLeadsForTests() {
  driverLeads.length = 0;
  investorLeads.length = 0;
}
