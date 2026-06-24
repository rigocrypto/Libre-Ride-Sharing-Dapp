import { Router } from "express";
import { z } from "zod";
import {
  buildFoundingDriverEmail,
  buildFoundingDriverEmailText,
  buildInvestorEmail,
  getAppBaseUrl,
  sendEmail,
  type EmailResult,
} from "../email";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  createFoundingDriverLead,
  createInvestorInterestLead,
  DuplicateLeadError,
  leadsToCsv,
  listFoundingDriverLeads,
  listInvestorInterestLeads,
  updateFoundingDriverLead,
  updateInvestorInterestLead,
} from "../services/leadsService";
import { syncLeadToCrm } from "../services/crmService";
import { isTransientConnectionError } from "../db/retry";

const router = Router();

const ipHits = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = 3;

function rateLimitByIp(req: any, res: any, next: any) {
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const now = Date.now();
  const hits = (ipHits.get(ip) || []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (hits.length >= LIMIT) {
    return res.status(429).json({ error: "Too many submissions. Please try again later." });
  }
  hits.push(now);
  ipHits.set(ip, hits);
  next();
}

const driverLeadSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  city: z.string().optional(),
  currentApps: z.array(z.string()).default([]),
  yearsDriving: z.coerce.number().int().min(0).max(60).optional(),
  driverType: z.string().optional(),
  vehicleType: z.string().optional(),
  vehicleYear: z.coerce.number().int().min(1980).max(2035).optional(),
  vehicleMakeModel: z.string().optional(),
  hasCommercialInsurance: z.boolean().optional(),
  interestedInAirport: z.boolean().optional(),
  airportExperience: z.string().optional(),
  preferredZones: z.array(z.string()).default([]),
  source: z.string().optional(),
  referralName: z.string().optional(),
  referredByCode: z.string().optional(),
  wantsDemoAccess: z.boolean().default(false),
  wantsWhatsAppInvite: z.boolean().default(false),
  consentContact: z.literal(true),
  consentVerification: z.literal(true),
  consentPrivacy: z.literal(true),
  notes: z.string().max(1000).optional(),
});

const investorLeadSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  leadType: z.string().min(2),
  interestRange: z.string().optional(),
  accredited: z.string().optional(),
  interestType: z.string().optional(),
  preferredNextStep: z.string().optional(),
  source: z.string().optional(),
  referralCode: z.string().optional(),
  referralName: z.string().optional(),
  wantsDemoAccess: z.boolean().default(false),
  wantsInvestorDeck: z.boolean().default(false),
  wantsWhatsAppInvite: z.boolean().default(false),
  consentContact: z.literal(true),
  consentNotOffering: z.literal(true),
  consentPrivacy: z.literal(true),
  message: z.string().max(500).optional(),
});

const leadUpdateSchema = z.object({
  status: z.enum(["new", "contacted", "qualified", "rejected", "converted"]).optional(),
  adminNotes: z.string().max(3000).optional(),
  followUpAt: z
    .string()
    .datetime()
    .optional()
    .nullable()
    .transform((value) => (value ? new Date(value) : value)),
  lastContactedAt: z
    .string()
    .datetime()
    .optional()
    .nullable()
    .transform((value) => (value ? new Date(value) : value)),
});

// Friendly, action-oriented message shown to users when the core lead save
// fails. The real technical error is logged server-side only.
const USER_FACING_SAVE_ERROR =
  "We couldn't complete your registration right now. Please try again in a moment, or contact LIBRE directly on WhatsApp.";

function handleLeadError(res: any, error: unknown, _fallback: string) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ error: "Invalid lead data", details: error.errors });
  }
  if (error instanceof DuplicateLeadError) {
    return res.status(409).json({ error: error.message });
  }
  // Log a structured, PII-safe diagnostic server-side so production failures are
  // debuggable without leaking request bodies (no email/phone/notes here). The
  // pg `code`/`constraint` fields pinpoint Neon cold-start vs real DB errors.
  const retryable = isTransientConnectionError(error);
  const err = error as { name?: string; code?: string; constraint?: string; message?: string };
  console.error("[Leads] Failed to process lead:", {
    name: err?.name,
    code: err?.code, // pg SQLSTATE (e.g. 57P01) or node errno (e.g. ETIMEDOUT)
    constraint: err?.constraint, // set on unique/not-null violations
    retryable,
    message: err?.message,
  });
  return res.status(retryable ? 503 : 500).json({
    error: USER_FACING_SAVE_ERROR,
    retryable,
  });
}

// Optional integrations (email confirmation, CRM sync) must never break a
// registration that has already been persisted. Run each defensively so a
// thrown error degrades to a logged warning instead of a 500.
async function runOptionalIntegration<T>(
  label: string,
  task: () => Promise<T>,
): Promise<T | { failed: true; error: string }> {
  try {
    return await task();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Leads] Optional integration '${label}' failed (non-blocking): ${message}`);
    return { failed: true, error: message };
  }
}

async function sendLeadConfirmation(
  kind: "driver" | "investor",
  lead: { fullName: string; email: string },
  referralCode?: string | null,
): Promise<EmailResult> {
  const isDriver = kind === "driver";

  let inviteUrl: string | null = null;
  if (isDriver && referralCode) {
    const base = getAppBaseUrl();
    if (base) {
      inviteUrl = `${base}/founding-access?ref=${referralCode}`;
    } else {
      console.warn("[EMAIL] referral invite link omitted");
    }
  }

  const subject = isDriver
    ? "You're on the Libre founding driver list"
    : "LIBRE investor and partner interest received";

  const html = isDriver
    ? buildFoundingDriverEmail(lead.fullName, referralCode, inviteUrl)
    : buildInvestorEmail(lead.fullName);

  const text = isDriver
    ? buildFoundingDriverEmailText(lead.fullName, referralCode, inviteUrl)
    : undefined;

  const result = await sendEmail({ to: lead.email, subject, html, text });

  if (result.sent) {
    const detail = isDriver && referralCode ? "with referral code" : "without referral link";
    console.info(`[EMAIL] founding driver confirmation sent ${detail} to ${lead.email} (id: ${result.messageId})`);
  } else if (result.skipped) {
    console.warn(`[Leads] Confirmation email skipped for ${lead.email}: ${result.reason}`);
  } else {
    console.error(`[Leads] Confirmation email failed for ${lead.email}: ${result.error}`);
  }

  return result;
}

function filterLeads(leads: any[], query: any, driver = false) {
  const minScore = query.minScore ? Number(query.minScore) : undefined;
  const now = new Date();
  return leads.filter((lead) => {
    if (query.status && lead.status !== query.status) return false;
    if (query.source && lead.source !== query.source) return false;
    if (Number.isFinite(minScore) && (lead.leadScore || 0) < minScore!) return false;
    if (query.wantsDemo === "true" && !lead.wantsDemoAccess) return false;
    if (driver && query.wantsWhatsApp === "true" && !lead.wantsWhatsAppInvite) return false;
    if (query.followUpDue === "true") {
      const due = lead.followUpAt ? new Date(lead.followUpAt) : null;
      if (!due || due > now) return false;
    }
    return true;
  });
}

router.post("/api/leads/founding-driver", rateLimitByIp, async (req, res) => {
  try {
    const data = driverLeadSchema.parse(req.body);
    // Core registration: if this throws, the lead was NOT saved -> error response.
    const { lead, referralStatus } = await createFoundingDriverLead({
      ...data,
      ipAddress: req.ip,
    });
    // Lead is persisted. Optional integrations below can fail without losing it.
    const emailResult = await runOptionalIntegration("driver confirmation email", () =>
      sendLeadConfirmation("driver", lead, lead.referralCode),
    );
    const crmResult = await runOptionalIntegration("driver CRM sync", () =>
      syncLeadToCrm("founding_driver", {
        fullName: lead.fullName,
        email: lead.email,
        phone: lead.phone,
        city: lead.city,
        vehicleMakeModel: lead.vehicleMakeModel,
        vehicleYear: lead.vehicleYear,
        preferredZones: lead.preferredZones,
        driverType: lead.driverType,
        leadScore: lead.leadScore,
        status: lead.status,
        referralCode: lead.referralCode,
        referredByCode: lead.referredByCode,
        wantsWhatsAppInvite: lead.wantsWhatsAppInvite,
        createdAt: lead.createdAt,
      }),
    );
    const response: Record<string, unknown> = {
      success: true,
      message:
        "You're on the founding driver list. We'll reach out before the Orlando pilot. Watch your email.",
      referralCode: lead.referralCode,
    };
    if (process.env.NODE_ENV !== "production") {
      response.emailStatus = emailResult;
      response.referredByCode = lead.referredByCode ?? null;
      response.referralStatus = referralStatus;
      response.crmStatus = crmResult;
    }
    res.json(response);
  } catch (error) {
    return handleLeadError(res, error, "Failed to create founding driver lead");
  }
});

router.post("/api/leads/investor-interest", rateLimitByIp, async (req, res) => {
  try {
    const data = investorLeadSchema.parse(req.body);
    const lead = await createInvestorInterestLead({
      ...data,
      ipAddress: req.ip,
    });
    const emailResult = await runOptionalIntegration("investor confirmation email", () =>
      sendLeadConfirmation("investor", lead),
    );
    const crmResult = await runOptionalIntegration("investor CRM sync", () =>
      syncLeadToCrm("investor_interest", {
        fullName: lead.fullName,
        email: lead.email,
        phone: lead.phone,
        leadType: lead.leadType,
        interestRange: lead.interestRange,
        interestType: lead.interestType,
        message: lead.message,
        leadScore: lead.leadScore,
        status: lead.status,
        createdAt: lead.createdAt,
      }),
    );
    const response: Record<string, unknown> = {
      success: true,
      message:
        "You're on the investor and partner interest list. We'll follow up with next steps.",
    };
    if (process.env.NODE_ENV !== "production") {
      response.emailStatus = emailResult;
      response.crmStatus = crmResult;
    }
    res.json(response);
  } catch (error) {
    return handleLeadError(res, error, "Failed to create investor interest lead");
  }
});

router.get(
  "/api/admin/leads/drivers.csv",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const leads = filterLeads(await listFoundingDriverLeads(), req.query, true);
    const csv = leadsToCsv(leads as Array<Record<string, unknown>>, [
      "id",
      "fullName",
      "email",
      "phone",
      "city",
      "status",
      "leadScore",
      "source",
      "referralCode",
      "referredByCode",
      "currentApps",
      "yearsDriving",
      "driverType",
      "vehicleType",
      "vehicleYear",
      "interestedInAirport",
      "wantsDemoAccess",
      "wantsWhatsAppInvite",
      "followUpAt",
      "lastContactedAt",
      "createdAt",
    ]);
    res.header("Content-Type", "text/csv");
    res.attachment("founding-driver-leads.csv").send(csv);
  }
);

router.get(
  "/api/admin/leads/investors.csv",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const leads = filterLeads(await listInvestorInterestLeads(), req.query);
    const csv = leadsToCsv(leads as Array<Record<string, unknown>>, [
      "id",
      "fullName",
      "email",
      "phone",
      "leadType",
      "status",
      "leadScore",
      "source",
      "interestRange",
      "accredited",
      "interestType",
      "preferredNextStep",
      "wantsInvestorDeck",
      "wantsDemoAccess",
      "followUpAt",
      "lastContactedAt",
      "createdAt",
    ]);
    res.header("Content-Type", "text/csv");
    res.attachment("investor-interest-leads.csv").send(csv);
  }
);

router.get(
  "/api/admin/leads/drivers",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const allLeads = await listFoundingDriverLeads();
    const referralCounts = new Map<string, number>();
    for (const lead of allLeads) {
      const code = (lead as any).referredByCode as string | null | undefined;
      if (code) referralCounts.set(code, (referralCounts.get(code) ?? 0) + 1);
    }
    const filtered = filterLeads(allLeads, req.query, true);
    const withCount = filtered.map((lead) => ({
      ...lead,
      referralCount: referralCounts.get((lead as any).referralCode ?? "") ?? 0,
    }));
    res.json({ leads: withCount });
  }
);

router.get(
  "/api/admin/leads/investors",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    res.json({ leads: filterLeads(await listInvestorInterestLeads(), req.query) });
  }
);

router.patch(
  "/api/admin/leads/drivers/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const data = leadUpdateSchema.parse(req.body);
      const lead = await updateFoundingDriverLead(req.params.id, data as Parameters<typeof updateFoundingDriverLead>[1]);
      if (!lead) return res.status(404).json({ error: "Driver lead not found" });
      return res.json({ lead });
    } catch (error) {
      return handleLeadError(res, error, "Failed to update driver lead");
    }
  }
);

router.patch(
  "/api/admin/leads/investors/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const data = leadUpdateSchema.parse(req.body);
      const lead = await updateInvestorInterestLead(req.params.id, data as Parameters<typeof updateInvestorInterestLead>[1]);
      if (!lead) return res.status(404).json({ error: "Investor lead not found" });
      return res.json({ lead });
    } catch (error) {
      return handleLeadError(res, error, "Failed to update investor lead");
    }
  }
);

export default router;
