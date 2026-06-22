export type CrmLeadKind = "founding_driver" | "investor_interest";

export interface CrmConfig {
  enabled: boolean;
  provider?: "airtable";
  reason?: string;
}

export interface CrmSyncResult {
  synced: boolean;
  skipped?: boolean;
  provider?: "airtable";
  reason?: string;
  externalId?: string;
  error?: string;
}

export interface FoundingDriverCrmPayload {
  fullName: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  vehicleMakeModel?: string | null;
  vehicleYear?: number | null;
  preferredZones?: string[] | null;
  driverType?: string | null;
  leadScore: number;
  status: string;
  referralCode?: string | null;
  referredByCode?: string | null;
  wantsWhatsAppInvite?: boolean | null;
  createdAt?: Date | string | null;
}

export interface InvestorCrmPayload {
  fullName: string;
  email: string;
  phone?: string | null;
  leadType: string;
  interestRange?: string | null;
  interestType?: string | null;
  message?: string | null;
  leadScore: number;
  status: string;
  createdAt?: Date | string | null;
}

export function getCrmConfig(): CrmConfig {
  if (process.env.CRM_ENABLED !== "true") {
    return { enabled: false, reason: "CRM_ENABLED is not 'true'" };
  }
  const provider = process.env.CRM_PROVIDER?.trim().toLowerCase();
  if (!provider) {
    return { enabled: false, reason: "CRM_PROVIDER is not set" };
  }
  if (provider !== "airtable") {
    return { enabled: false, reason: `Unsupported CRM provider: ${provider}` };
  }
  if (!process.env.AIRTABLE_API_KEY) {
    return { enabled: false, provider: "airtable", reason: "AIRTABLE_API_KEY is missing" };
  }
  if (!process.env.AIRTABLE_BASE_ID) {
    return { enabled: false, provider: "airtable", reason: "AIRTABLE_BASE_ID is missing" };
  }
  return { enabled: true, provider: "airtable" };
}

function toDateString(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : value;
}

function buildFoundingDriverFields(payload: FoundingDriverCrmPayload): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    Name: payload.fullName,
    Email: payload.email,
    Score: payload.leadScore,
    Status: payload.status,
  };
  if (payload.phone) fields["Phone"] = payload.phone;
  if (payload.city) fields["City"] = payload.city;
  if (payload.vehicleMakeModel) fields["Vehicle"] = payload.vehicleMakeModel;
  if (payload.vehicleYear) fields["Vehicle Year"] = payload.vehicleYear;
  if (payload.driverType) fields["Availability"] = payload.driverType;
  if (payload.preferredZones?.length) fields["Preferred Zones"] = payload.preferredZones.join(", ");
  if (payload.referralCode) fields["Referral Code"] = payload.referralCode;
  if (payload.referredByCode) fields["Referred By Code"] = payload.referredByCode;
  if (payload.wantsWhatsAppInvite != null) fields["Wants WhatsApp Invite"] = payload.wantsWhatsAppInvite;
  const createdAt = toDateString(payload.createdAt);
  if (createdAt) fields["Created At"] = createdAt;
  return fields;
}

function buildInvestorFields(payload: InvestorCrmPayload): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    Name: payload.fullName,
    Email: payload.email,
    "Investor Type": payload.leadType,
    Score: payload.leadScore,
    Status: payload.status,
  };
  if (payload.phone) fields["Phone"] = payload.phone;
  if (payload.interestRange) fields["Check Size"] = payload.interestRange;
  if (payload.interestType) fields["Interest Area"] = payload.interestType;
  if (payload.message) fields["Message"] = payload.message;
  const createdAt = toDateString(payload.createdAt);
  if (createdAt) fields["Created At"] = createdAt;
  return fields;
}

async function syncToAirtable(
  tableName: string,
  fields: Record<string, unknown>,
): Promise<CrmSyncResult> {
  const baseId = process.env.AIRTABLE_BASE_ID!;
  const apiKey = process.env.AIRTABLE_API_KEY!;
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[CRM] sync failed: ${error}`);
    return { synced: false, provider: "airtable", error };
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const error = `HTTP ${response.status}: ${body.slice(0, 200)}`;
    console.error(`[CRM] sync failed: ${error}`);
    return { synced: false, provider: "airtable", error };
  }

  const json = await response.json() as { id?: string };
  const externalId = json.id;
  return { synced: true, provider: "airtable", externalId };
}

export async function syncLeadToCrm(
  kind: CrmLeadKind,
  payload: FoundingDriverCrmPayload | InvestorCrmPayload,
): Promise<CrmSyncResult> {
  const config = getCrmConfig();

  if (!config.enabled) {
    console.info(`[CRM] sync skipped: ${config.reason}`);
    return { synced: false, skipped: true, reason: config.reason };
  }

  const isDriver = kind === "founding_driver";
  const tableEnvVar = isDriver ? "AIRTABLE_FOUNDING_DRIVERS_TABLE" : "AIRTABLE_INVESTORS_TABLE";
  const tableDefault = isDriver ? "Founding Drivers" : "Investors";
  const tableName = (process.env[tableEnvVar] || tableDefault).trim();

  const fields = isDriver
    ? buildFoundingDriverFields(payload as FoundingDriverCrmPayload)
    : buildInvestorFields(payload as InvestorCrmPayload);

  const result = await syncToAirtable(tableName, fields);

  if (result.synced) {
    const label = isDriver ? "founding driver" : "investor lead";
    console.info(`[CRM] ${label} synced to Airtable: ${result.externalId}`);
  }

  return result;
}
