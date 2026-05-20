import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  createFoundingDriverLead,
  createInvestorInterestLead,
  DuplicateLeadError,
  listFoundingDriverLeads,
  listInvestorInterestLeads,
} from "../services/leadsService";

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
  vehicleType: z.string().optional(),
  hasCommercialInsurance: z.boolean().optional(),
  interestedInAirport: z.boolean().optional(),
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
  message: z.string().max(500).optional(),
  complianceAcknowledged: z.literal(true),
});

function handleLeadError(res: any, error: unknown, fallback: string) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ error: "Invalid lead data", details: error.errors });
  }
  if (error instanceof DuplicateLeadError) {
    return res.status(409).json({ error: error.message });
  }
  console.error("[Leads] Failed to process lead:", error);
  return res.status(500).json({ error: fallback });
}

router.post("/api/leads/founding-driver", rateLimitByIp, async (req, res) => {
  try {
    const data = driverLeadSchema.parse(req.body);
    // TODO: integrate CRM webhook (HubSpot/Airtable/Notion)
    // TODO: send confirmation email via Resend/Postmark
    await createFoundingDriverLead({
      ...data,
      ipAddress: req.ip,
    });
    res.json({
      success: true,
      message:
        "You're on the founding driver list. We'll reach out before the Orlando pilot. Watch your email.",
    });
  } catch (error) {
    return handleLeadError(res, error, "Failed to create founding driver lead");
  }
});

router.post("/api/leads/investor-interest", rateLimitByIp, async (req, res) => {
  try {
    const { complianceAcknowledged: _complianceAcknowledged, ...data } =
      investorLeadSchema.parse(req.body);
    // TODO: integrate CRM webhook (HubSpot/Airtable/Notion)
    // TODO: send confirmation email via Resend/Postmark
    await createInvestorInterestLead({
      ...data,
      ipAddress: req.ip,
    });
    res.json({
      success: true,
      message:
        "You're on the investor and partner interest list. We'll follow up with next steps.",
    });
  } catch (error) {
    return handleLeadError(res, error, "Failed to create investor interest lead");
  }
});

router.get(
  "/api/admin/leads/drivers",
  requireAuth,
  requireRole("admin"),
  async (_req, res) => {
    res.json({ leads: await listFoundingDriverLeads() });
  }
);

router.get(
  "/api/admin/leads/investors",
  requireAuth,
  requireRole("admin"),
  async (_req, res) => {
    res.json({ leads: await listInvestorInterestLeads() });
  }
);

export default router;
