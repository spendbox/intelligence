import { Resend } from "resend";
import { env } from "@/lib/env";

let _resend: Resend | null = null;

function client(): Resend {
  if (!_resend) _resend = new Resend(env.resendApiKey());
  return _resend;
}

export async function sendPinEmail(to: string, pin: string) {
  return client().emails.send({
    from: env.resendFrom(),
    to,
    subject: `Your Folio login code: ${pin}`,
    html: pinHtml(pin),
    text: `Your Folio login code is ${pin}. It expires in 10 minutes.`,
  });
}

export async function sendInsightEmail(opts: {
  to: string;
  subject: string;
  html: string;
}) {
  return client().emails.send({
    from: env.resendFrom(),
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}

function pinHtml(pin: string): string {
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;padding:24px;color:#0f172a;background:#f8fafc">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e2e8f0">
      <p style="margin:0 0 4px;color:#7c3aed;font-weight:600;letter-spacing:.08em;font-size:12px;text-transform:uppercase">Folio</p>
      <h2 style="margin:0 0 12px">Your login code</h2>
      <p style="color:#475569">Use the code below to sign in. It expires in 10 minutes.</p>
      <div style="font-size:36px;letter-spacing:8px;font-weight:700;padding:16px 24px;background:#f5f3ff;color:#5b21b6;border-radius:8px;display:inline-block;margin:12px 0">${pin}</div>
      <p style="color:#64748b;font-size:13px">If you didn't request this, you can ignore this email.</p>
    </div>
  </body></html>`;
}
