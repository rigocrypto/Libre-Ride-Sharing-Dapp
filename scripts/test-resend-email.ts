import "dotenv/config";
import { sendEmail, getEmailConfig } from "../server/email";

async function main() {
  const missingVars: string[] = [];
  if (!process.env.RESEND_API_KEY) missingVars.push("RESEND_API_KEY");
  if (!process.env.EMAIL_FROM) missingVars.push("EMAIL_FROM");
  if (!process.env.TEST_EMAIL_TO) missingVars.push("TEST_EMAIL_TO");

  if (missingVars.length > 0) {
    console.error(`Missing required env vars: ${missingVars.join(", ")}`);
    console.error("Add them to .env or export them before running this script.");
    process.exit(1);
  }

  const config = getEmailConfig();
  console.log("Email config:", config);

  console.log(`Sending test email to ${process.env.TEST_EMAIL_TO}...`);

  const result = await sendEmail({
    to: process.env.TEST_EMAIL_TO!,
    subject: "Libre Resend Test",
    html: "<p>Libre email configuration is working.</p>",
  });

  if (result.sent) {
    console.log("Email sent successfully.");
    console.log("Resend message id:", result.messageId);
  } else {
    console.error("Email send failed:");
    console.error(result.error ?? result.reason);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Test script failed:", error);
  process.exit(1);
});
