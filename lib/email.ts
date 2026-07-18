import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

/**
 * SMTP mailer. Configure via env: SMTP_HOST, SMTP_PORT, SMTP_USER,
 * SMTP_PASS (or SMTP_PASSWORD), SMTP_FROM (optional), SMTP_SECURE (optional "true"/"false").
 * When SMTP is not configured, emails are NOT sent — the code is logged to the
 * server console instead so the flow still works in development.
 */
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_FROM, SMTP_SECURE } = process.env;
// Accept either SMTP_PASS or SMTP_PASSWORD for the credential.
const SMTP_PASS = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;

const COMPANY = "Lebami";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@lebami.com";
const LOGO_PATH = path.join(process.cwd(), "public", "images", "lebami.png");
const LOGO_CID = "lebami-logo";

let cached: nodemailer.Transporter | null = null;

export function isEmailConfigured(): boolean {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

function getTransporter(): nodemailer.Transporter | null {
  if (cached) return cached;
  if (!isEmailConfigured()) return null;
  const port = Number(SMTP_PORT || 587);
  cached = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: SMTP_SECURE ? SMTP_SECURE === "true" : port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return cached;
}

const FROM = SMTP_FROM || (SMTP_USER ? `"${COMPANY}" <${SMTP_USER}>` : `${COMPANY} <no-reply@lebami.com>`);

type Attachment = { filename: string; path: string; cid?: string };

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: Attachment[];
}): Promise<{ sent: boolean }> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn(`[email] SMTP not configured — email to ${opts.to} not sent (subject: "${opts.subject}").`);
    return { sent: false };
  }
  try {
    await transporter.sendMail({ from: FROM, ...opts });
    return { sent: true };
  } catch (e: any) {
    console.error(`[email] Failed to send to ${opts.to}:`, e?.message || e);
    throw e;
  }
}

/** Inline logo attachment (CID) when the file exists, so it renders in email clients. */
function logoAttachment(): Attachment[] {
  try {
    if (fs.existsSync(LOGO_PATH)) return [{ filename: "lebami.png", path: LOGO_PATH, cid: LOGO_CID }];
  } catch {
    /* ignore */
  }
  return [];
}

/** Professional HTML template for the verification code email. */
export function otpEmailTemplate(firstName: string, otp: string, hasLogo: boolean): { subject: string; html: string; text: string } {
  const name = firstName?.trim() || "there";
  const subject = "Verify Your Email";
  const header = hasLogo
    ? `<img src="cid:${LOGO_CID}" alt="${COMPANY}" width="150" style="max-width:170px;height:auto;display:inline-block;" />`
    : `<span style="color:#61000B;font-size:24px;letter-spacing:3px;text-transform:uppercase;font-weight:bold;">${COMPANY}</span>`;

  const html = `
  <!doctype html>
  <html>
    <body style="margin:0;padding:0;background:#f5f2ee;font-family:Georgia,'Times New Roman',serif;color:#2b2b2b;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ee;padding:32px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #ece7df;border-radius:8px;overflow:hidden;max-width:480px;width:100%;">
              <tr>
                <td style="background:#ffffff;padding:28px 32px 22px;text-align:center;border-bottom:1px solid #f0ece5;">
                  ${header}
                </td>
              </tr>
              <tr>
                <td style="padding:36px 32px 8px;">
                  <p style="margin:0 0 16px;font-size:16px;">Hello ${name},</p>
                  <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#555;">Thank you for creating your account. Your verification code is:</p>
                  <div style="text-align:center;margin:8px 0 24px;">
                    <span style="display:inline-block;font-family:'Courier New',monospace;font-size:34px;letter-spacing:10px;font-weight:bold;color:#61000B;background:#faf7f2;border:1px solid #ece7df;border-radius:8px;padding:16px 24px;">${otp}</span>
                  </div>
                  <p style="margin:0 0 8px;font-size:14px;color:#777;line-height:1.6;">This code is valid for <strong>5 minutes</strong>.</p>
                  <p style="margin:0 0 24px;font-size:13px;color:#999;line-height:1.6;">If you did not request this, you can safely ignore this email.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 32px 32px;border-top:1px solid #f0ece5;">
                  <p style="margin:0 0 6px;font-size:13px;color:#999;">
                    Need help? Contact us at
                    <a href="mailto:${SUPPORT_EMAIL}" style="color:#61000B;text-decoration:none;">${SUPPORT_EMAIL}</a>.
                  </p>
                  <p style="margin:0;font-size:13px;color:#999;">Regards,<br/>${COMPANY}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
  const text = `Hello ${name},\n\nThank you for creating your account.\n\nYour verification code is ${otp}\n\nThis code is valid for 5 minutes.\n\nIf you did not request this, you can safely ignore this email.\n\nNeed help? Contact us at ${SUPPORT_EMAIL}.\n\nRegards,\n${COMPANY}`;
  return { subject, html, text };
}

export async function sendOtpEmail(to: string, firstName: string, otp: string): Promise<{ sent: boolean }> {
  // In non-production, always surface the code in the server log for convenience.
  if (process.env.NODE_ENV !== "production") {
    console.log(`\n========================================\n🔑 OTP for ${to}: ${otp}\n========================================\n`);
  }
  const attachments = logoAttachment();
  const { subject, html, text } = otpEmailTemplate(firstName, otp, attachments.length > 0);
  return sendMail({ to, subject, html, text, attachments });
}
