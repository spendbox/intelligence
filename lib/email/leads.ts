import { Resend } from "resend";
import { env } from "@/lib/env";

let _resend: Resend | null = null;
function client() {
  if (!_resend) _resend = new Resend(env.resendApiKey());
  return _resend;
}

const FROM = () => env.resendFrom();
const APP = () => env.appUrl();

function shell(title: string, inner: string) {
  return `<!doctype html><html><body style="margin:0;background:#f8fafc;padding:24px;font-family:system-ui,sans-serif;color:#0f172a">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;padding:28px;border:1px solid #e2e8f0">
      <p style="margin:0 0 4px;color:#7c3aed;font-weight:600;letter-spacing:.08em;font-size:12px;text-transform:uppercase">Folio</p>
      <h2 style="margin:0 0 12px">${title}</h2>
      ${inner}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
      <p style="color:#64748b;font-size:12px;margin:0">folio.cafe · notifications@folio.cafe</p>
    </div>
  </body></html>`;
}

export async function sendOrderVerificationEmail(to: string, code: string) {
  return client().emails.send({
    from: FROM(),
    to,
    subject: `Your Folio verification code: ${code}`,
    html: shell(
      "Confirm your email",
      `<p>Enter this 4-digit code to submit your request. It expires in 10 minutes.</p>
       <div style="font-size:36px;letter-spacing:8px;font-weight:700;padding:16px 24px;background:#f5f3ff;color:#5b21b6;border-radius:8px;display:inline-block;margin:12px 0">${code}</div>`
    ),
  });
}

export async function sendOrderReceivedEmail(to: string, name: string) {
  return client().emails.send({
    from: FROM(),
    to,
    subject: "We received your request",
    html: shell(
      `Thanks, ${name}.`,
      `<p>We've received your request and our team is reviewing it.</p>
       <p>As soon as it's approved we'll match it with vetted businesses in your area. They'll reach out to you directly with quotes.</p>`
    ),
  });
}

export async function sendOrderApprovedEmail(to: string, name: string) {
  return client().emails.send({
    from: FROM(),
    to,
    subject: "Your request is now live",
    html: shell(
      `Your request is live, ${name}.`,
      `<p>We've matched your request with relevant businesses. They'll contact you in the next few days.</p>
       <p>Tip: respond quickly — the first 24 hours usually get the best offers.</p>`
    ),
  });
}

export async function sendAdminNewRequestEmail(adminTo: string, payload: { id: string; name: string; description: string; location: string }) {
  return client().emails.send({
    from: FROM(),
    to: adminTo,
    subject: `New request from ${payload.name}`,
    html: shell(
      "New lead request",
      `<p><strong>${payload.name}</strong> just submitted a request in <strong>${payload.location}</strong>.</p>
       <p style="color:#475569">${payload.description.replace(/[<>]/g, "")}</p>
       <p><a href="${APP()}/admin/requests/${payload.id}" style="display:inline-block;background:#7c3aed;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">Open in admin →</a></p>`
    ),
  });
}

export async function sendBusinessApprovedEmail(to: string, payload: { businessName: string; slug: string }) {
  return client().emails.send({
    from: FROM(),
    to,
    subject: "Your Folio business is verified",
    html: shell(
      `Welcome to the verified club, ${payload.businessName}.`,
      `<p>Your business has been reviewed and approved on Folio. You now have a <strong>Verified</strong> badge on your public page and lead notifications.</p>
       <p>Verified businesses build trust faster and unlock priority benefits we're rolling out — first dibs on high-budget leads, featured placement and more.</p>
       <p><a href="${APP()}/b/${payload.slug}" style="display:inline-block;background:#7c3aed;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">View your page →</a></p>`
    ),
  });
}

export async function sendBusinessLeadEmail(to: string, payload: {
  requestId: string;
  industryName: string;
  budget: string;
  location: string;
  unlockCredits: number;
}) {
  return client().emails.send({
    from: FROM(),
    to,
    subject: `New ${payload.industryName} lead in ${payload.location}`,
    html: shell(
      "New lead matched for you",
      `<p>A new request was just matched to your business.</p>
       <ul style="line-height:1.7">
         <li><strong>Industry:</strong> ${payload.industryName}</li>
         <li><strong>Location:</strong> ${payload.location}</li>
         <li><strong>Budget:</strong> ${payload.budget}</li>
         <li><strong>Unlock cost:</strong> ${payload.unlockCredits} credits</li>
       </ul>
       <p>Open the lead to see the brief. Use credits to reveal the client's contact details — first 10 businesses to unlock get the lead.</p>
       <p><a href="${APP()}/business/leads/${payload.requestId}" style="display:inline-block;background:#7c3aed;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">View lead →</a></p>`
    ),
  });
}
