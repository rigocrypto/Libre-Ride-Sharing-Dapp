import { randomUUID } from "node:crypto";
import { desc } from "drizzle-orm";

export type FoundingDriverLeadInput = {
  fullName: string;
  email: string;
  phone?: string;
  city?: string;
  currentApps?: string[];
  yearsDriving?: number;
  vehicleType?: string;
  hasCommercialInsurance?: boolean;
  interestedInAirport?: boolean;
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
  message?: string;
  ipAddress?: string;
};

export class DuplicateLeadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateLeadError";
  }
}

const driverLeads: Array<FoundingDriverLeadInput & { id: string; createdAt: Date }> = [];
const investorLeads: Array<InvestorInterestLeadInput & { id: string; createdAt: Date }> = [];

function normalizedEmail(email: string) {
  return email.trim().toLowerCase();
}

function shouldUsePersistentLeads(): boolean {
  const engine = process.env.STORAGE_ENGINE;
  return !!process.env.DATABASE_URL && engine !== "mem" && process.env.NODE_ENV !== "test";
}

function isDuplicateKeyError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return message.includes("duplicate key") || message.includes("unique constraint");
}

export async function createFoundingDriverLead(input: FoundingDriverLeadInput) {
  const email = normalizedEmail(input.email);

  if (shouldUsePersistentLeads()) {
    const [{ db }, { foundingDriverLeads }] = await Promise.all([
      import("../db/client"),
      import("../db/schema"),
    ]);
    try {
      const [inserted] = await db
        .insert(foundingDriverLeads)
        .values({ ...input, email })
        .returning();
      return inserted;
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
  const lead = { ...input, email, id: randomUUID(), createdAt: new Date() };
  driverLeads.push(lead);
  return lead;
}

export async function createInvestorInterestLead(input: InvestorInterestLeadInput) {
  const email = normalizedEmail(input.email);

  if (shouldUsePersistentLeads()) {
    const [{ db }, { investorInterestLeads }] = await Promise.all([
      import("../db/client"),
      import("../db/schema"),
    ]);
    try {
      const [inserted] = await db
        .insert(investorInterestLeads)
        .values({ ...input, email })
        .returning();
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
  const lead = { ...input, email, id: randomUUID(), createdAt: new Date() };
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

export function clearLeadsForTests() {
  driverLeads.length = 0;
  investorLeads.length = 0;
}
