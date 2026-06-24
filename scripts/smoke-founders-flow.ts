/**
 * Production smoke test for the LIBRE founding-driver registration flow.
 *
 * Run this against the deployed backend BEFORE/AFTER a deploy to confirm the
 * public Founding Driver form will work end-to-end. It checks:
 *   1. API health endpoint responds
 *   2. CORS allows the GitHub Pages origin
 *   3. The founding-driver lead endpoint accepts a valid payload (no 500)
 *   4. Missing required fields are rejected with 400 (validation alive)
 *
 * Usage:
 *   API_BASE_URL=https://libre-api.onrender.com tsx scripts/smoke-founders-flow.ts
 *
 * Optional:
 *   SMOKE_ORIGIN   - origin to send/expect for CORS (default https://rigocrypto.github.io)
 *   SMOKE_KEEP     - set to "1" to keep the created test lead (default: warns it persists)
 */

const API_BASE_URL = (process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const ORIGIN = process.env.SMOKE_ORIGIN || "https://rigocrypto.github.io";

if (!API_BASE_URL) {
  console.error("✖ API_BASE_URL is not set. Example:\n  API_BASE_URL=https://libre-api.onrender.com tsx scripts/smoke-founders-flow.ts");
  process.exit(2);
}

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  if (ok) {
    console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    failures += 1;
    console.error(`✖ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  console.log(`Smoke testing ${API_BASE_URL} (origin: ${ORIGIN})\n`);

  // 1. Health endpoint
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    const body = await res.json().catch(() => ({}));
    check("health endpoint", res.ok && body?.status === "ok", `status ${res.status}`);
  } catch (err) {
    check("health endpoint", false, err instanceof Error ? err.message : String(err));
  }

  // 2. CORS preflight for the founding-driver endpoint
  try {
    const res = await fetch(`${API_BASE_URL}/api/leads/founding-driver`, {
      method: "OPTIONS",
      headers: {
        Origin: ORIGIN,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
      },
    });
    const allowOrigin = res.headers.get("access-control-allow-origin");
    check("CORS allows GitHub Pages origin", allowOrigin === ORIGIN, `allow-origin: ${allowOrigin ?? "(none)"}`);
  } catch (err) {
    check("CORS preflight", false, err instanceof Error ? err.message : String(err));
  }

  // 3. Valid founding-driver submission — full realistic payload matching every
  //    field the real mobile form can send (not just the minimal required set),
  //    so the smoke test exercises the same insert path real drivers hit.
  const testEmail = `smoke+${Date.now()}@libre-smoke.test`;
  try {
    const res = await fetch(`${API_BASE_URL}/api/leads/founding-driver`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: ORIGIN },
      body: JSON.stringify({
        fullName: "Smoke Test Driver",
        email: testEmail,
        phone: "407-555-0100",
        city: "Orlando, FL",
        currentApps: ["Uber", "Lyft", "Other"],
        yearsDriving: 7,
        driverType: "Full-time",
        vehicleType: "SUV",
        vehicleYear: 2021,
        vehicleMakeModel: "Toyota Highlander",
        hasCommercialInsurance: true,
        interestedInAirport: true,
        airportExperience: "experienced",
        preferredZones: ["MCO Airport", "Disney/Lake Buena Vista"],
        source: "WhatsApp driver group",
        referralName: "Smoke referral",
        wantsDemoAccess: true,
        wantsWhatsAppInvite: false,
        consentContact: true,
        consentVerification: true,
        consentPrivacy: true,
        notes: "Smoke test full payload with accents: ñ á é í ó ú.",
      }),
    });
    const body = await res.json().catch(() => ({}));
    check("valid submission returns success (no 500)", res.ok && body?.success === true, `status ${res.status}`);
    if (res.ok) {
      check("referral code generated", typeof body?.referralCode === "string" && body.referralCode.length > 0, body?.referralCode);
      console.log(`  ↳ created test lead: ${testEmail}${process.env.SMOKE_KEEP === "1" ? "" : " (persists — clean up if needed)"}`);
    }
  } catch (err) {
    check("valid submission", false, err instanceof Error ? err.message : String(err));
  }

  // 4. Validation: missing consent should be rejected with 400 (not 500)
  try {
    const res = await fetch(`${API_BASE_URL}/api/leads/founding-driver`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: ORIGIN },
      body: JSON.stringify({ fullName: "No Consent", email: `smoke-bad+${Date.now()}@libre-smoke.test` }),
    });
    check("missing required fields rejected with 400", res.status === 400, `status ${res.status}`);
  } catch (err) {
    check("validation check", false, err instanceof Error ? err.message : String(err));
  }

  console.log("");
  if (failures > 0) {
    console.error(`✖ Smoke test FAILED with ${failures} problem(s).`);
    process.exit(1);
  }
  console.log("✓ Smoke test passed. Founding-driver flow is healthy.");
}

main().catch((err) => {
  console.error("✖ Smoke test crashed:", err);
  process.exit(1);
});
