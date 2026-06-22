// Re-export service functions for backwards compatibility
export { getEmailConfig, sendEmail, getAppBaseUrl } from "./email-service";
export type { EmailConfig, EmailPayload, EmailResult } from "./email-service";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildFoundingDriverEmail(
  name: string,
  referralCode: string | null | undefined,
  inviteUrl: string | null | undefined,
): string {
  const escapedName = escapeHtml(name);
  const escapedReferralCode = referralCode ? escapeHtml(referralCode) : null;
  const escapedInviteUrl = inviteUrl ? escapeHtml(inviteUrl) : null;

  const referralBlock = escapedReferralCode
    ? `
      <div style="margin:24px 0;padding:20px;background:#0f172a;border:1px solid #1e3a5f;border-radius:8px;">
        <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#64748b;">Your invite code</p>
        <p style="margin:0;font-size:24px;font-weight:700;letter-spacing:.18em;color:#67e8f9;font-family:monospace;">${escapedReferralCode}</p>
        ${escapedInviteUrl ? `
          <p style="margin:16px 0 4px;font-size:13px;color:#94a3b8;">Share your invite link with other Orlando drivers:</p>
          <a href="${escapedInviteUrl}" style="color:#38bdf8;font-size:13px;word-break:break-all;">${escapedInviteUrl}</a>
          <p style="margin:12px 0 0;font-size:12px;color:#64748b;">Every driver who joins through your link helps grow the founding list and shows operator interest before launch.</p>
        ` : ""}
      </div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e2e8f0;">
  <div style="max-width:560px;margin:40px auto;padding:0 16px;">
    <div style="margin-bottom:20px;">
      <span style="font-size:17px;font-weight:900;letter-spacing:.18em;color:#fff;">LIBRE</span>
    </div>
    <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:32px;">
      <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#fff;">You're on the founding driver list.</h1>
      <p style="margin:0 0 14px;color:#cbd5e1;line-height:1.65;">Hi ${escapedName},</p>
      <p style="margin:0 0 14px;color:#cbd5e1;line-height:1.65;">You're officially on the LIBRE founding driver list. We'll reach out as launch preparation continues — founding drivers are first in line for onboarding and pilot access.</p>
      ${referralBlock}
      <p style="margin:20px 0 0;font-size:13px;color:#64748b;line-height:1.6;">LIBRE is building a driver-first ridesharing network for Orlando — fairer economics, transparent payments, and stronger driver ownership. Approval requires license, vehicle, insurance, and background verification.</p>
    </div>
    <p style="margin:16px 0 0;font-size:12px;color:#475569;text-align:center;">LIBRE Ride · Orlando, FL</p>
  </div>
</body>
</html>`;

  return html;
}

export function buildFoundingDriverEmailText(
  name: string,
  referralCode: string | null | undefined,
  inviteUrl: string | null | undefined,
): string {
  // Plain text doesn't need HTML escaping, but we should still sanitize
  return [
    `Hi ${name},`,
    "",
    "You're officially on the LIBRE founding driver list.",
    "We'll reach out as launch preparation continues.",
    "",
    ...(referralCode ? [`Your invite code: ${referralCode}`] : []),
    ...(inviteUrl ? [`Share your invite link: ${inviteUrl}`, ""] : []),
    "LIBRE is building a driver-first ridesharing network for Orlando — fairer economics, transparent payments, and stronger driver ownership.",
    "",
    "Approval requires license, vehicle, insurance, and background verification.",
    "",
    "— LIBRE Ride · Orlando, FL",
  ].join("\n");
}

export function buildInvestorEmail(name: string): string {
  const escapedName = escapeHtml(name);
  return `<p>Hi ${escapedName},</p><p>Thank you for your interest in LIBRE.</p><p>We are collecting investor and partner interest for a future compliant funding process. This is not a public securities offering. Our team may contact you with demo access, investor materials, or a partner meeting invitation.</p><p>LIBRE Ride</p>`;
}

export function generateOnboardingStartedEmail(driverName: string): string {
  const escapedDriverName = escapeHtml(driverName);
  return `
    <div style="font-family: 'Arial', sans-serif; color: #333;">
      <h2 style="color: #ff2d92;">Welcome to Libre, ${escapedDriverName}! 🚗</h2>
      <p>We're excited to have you as a Libre driver in Orlando.</p>
      <p>To get started, please complete your profile verification:</p>
      <ol>
        <li>Upload your profile photo</li>
        <li>Upload your Florida driver's license (front & back)</li>
        <li>Upload vehicle photos (front, side, back, plate)</li>
        <li>Upload proof of insurance</li>
        <li>Authorize background check</li>
      </ol>
      <p>Once verified, you'll be able to go online and start accepting rides.</p>
      <a href="https://libre.sh/driver/onboarding" style="background-color: #ff2d92; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Start Verification</a>
    </div>
  `;
}

export function generateVerificationCompleteEmail(driverName: string): string {
  const escapedDriverName = escapeHtml(driverName);
  return `
    <div style="font-family: 'Arial', sans-serif; color: #333;">
      <h2 style="color: #02f7f3;">🎉 You're Verified, ${escapedDriverName}!</h2>
      <p>Congratulations! Your profile has been approved by our compliance team.</p>
      <p>You can now go online and start accepting rides in Orlando.</p>
      <p style="background-color: #f0f0f0; padding: 10px; border-left: 4px solid #a020f0;">
        <strong>Key Info:</strong> Drivers earn 97% of ride fares. 3% goes to the platform.
      </p>
      <a href="https://libre.sh/driver/dashboard" style="background-color: #02f7f3; color: #000; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Go to Dashboard</a>
    </div>
  `;
}

export function generateDocumentRejectedEmail(driverName: string, reason: string): string {
  const escapedDriverName = escapeHtml(driverName);
  const escapedReason = escapeHtml(reason);
  return `
    <div style="font-family: 'Arial', sans-serif; color: #333;">
      <h2 style="color: #ff2d92;">Document Review</h2>
      <p>Hi ${escapedDriverName},</p>
      <p>One of your documents was reviewed and requires resubmission:</p>
      <p style="background-color: #fff3cd; padding: 10px; border-left: 4px solid #ff6b6b;">
        <strong>Reason:</strong> ${escapedReason}
      </p>
      <p>Please reupload the document. If you have questions, contact support@libre.sh</p>
      <a href="https://libre.sh/driver/onboarding" style="background-color: #ff2d92; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Resubmit Documents</a>
    </div>
  `;
}

export function generateRideReceiptEmail(
  riderName: string,
  driverName: string,
  amount: number,
  distance: number,
  duration: number
): string {
  const escapedRiderName = escapeHtml(riderName);
  const escapedDriverName = escapeHtml(driverName);
  return `
    <div style="font-family: 'Arial', sans-serif; color: #333;">
      <h2 style="color: #02f7f3;">Trip Receipt</h2>
      <p>Thanks for riding with Libre, ${escapedRiderName}!</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Driver:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${escapedDriverName}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Distance:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${distance.toFixed(1)} miles</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Duration:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${duration} minutes</td>
        </tr>
        <tr style="background-color: #f0f0f0;">
          <td style="padding: 10px; font-weight: bold;"><strong>Amount:</strong></td>
          <td style="padding: 10px; font-weight: bold;">$${amount.toFixed(2)}</td>
        </tr>
      </table>
      <p style="margin-top: 20px; color: #666; font-size: 12px;">This receipt has been recorded on the Base blockchain.</p>
    </div>
  `;
}
