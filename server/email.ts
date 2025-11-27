import { Resend } from "resend";

// Lazy initialize Resend to handle missing API key gracefully
let resend: Resend | null = null;

function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload) {
  const client = getResend();
  if (!client) {
    console.warn("RESEND_API_KEY not set, skipping email to", payload.to);
    return { success: false, reason: "No API key" };
  }

  try {
    const result = await client.emails.send({
      from: "noreply@libre.sh",
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });
    return { success: true, result };
  } catch (error) {
    console.error("Email send failed:", error);
    return { success: false, error };
  }
}

export function generateOnboardingStartedEmail(driverName: string): string {
  return `
    <div style="font-family: 'Arial', sans-serif; color: #333;">
      <h2 style="color: #ff2d92;">Welcome to Libre, ${driverName}! 🚗</h2>
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
  return `
    <div style="font-family: 'Arial', sans-serif; color: #333;">
      <h2 style="color: #02f7f3;">🎉 You're Verified, ${driverName}!</h2>
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
  return `
    <div style="font-family: 'Arial', sans-serif; color: #333;">
      <h2 style="color: #ff2d92;">Document Review</h2>
      <p>Hi ${driverName},</p>
      <p>One of your documents was reviewed and requires resubmission:</p>
      <p style="background-color: #fff3cd; padding: 10px; border-left: 4px solid #ff6b6b;">
        <strong>Reason:</strong> ${reason}
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
  return `
    <div style="font-family: 'Arial', sans-serif; color: #333;">
      <h2 style="color: #02f7f3;">Trip Receipt</h2>
      <p>Thanks for riding with Libre, ${riderName}!</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Driver:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${driverName}</td>
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
