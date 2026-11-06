import { appendInbox } from "@/lib/inbox";
import { SITE } from "@/lib/site";

/**
 * Lead delivery — env-driven so the same code works in dev and on Vercel.
 *
 * - RESEND_API_KEY set → forward the lead to RESEND_TO (defaults to SITE.email)
 *   via the Resend API. This is the production path (Vercel fs is read-only).
 * - not set → fall back to the local JSONL inbox (dev only).
 *
 * Add RESEND_API_KEY in Vercel → Settings → Environment Variables.
 * Optional: RESEND_FROM (verified sender), RESEND_TO (recipient).
 */
const RESEND_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM =
  process.env.RESEND_FROM ?? `${SITE.shortName} <onboarding@resend.dev>`;
const RESEND_TO = process.env.RESEND_TO ?? SITE.email;

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendEmail(subject: string, html: string): Promise<void> {
  if (!RESEND_KEY) throw new Error("RESEND_API_KEY not set");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: RESEND_FROM, to: [RESEND_TO], subject, html }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Resend ${res.status}: ${detail}`);
  }
}

export type Delivery = "email" | "local" | "failed";

export async function notifyWholesale(
  payload: Record<string, unknown>,
): Promise<Delivery> {
  const rows = Object.entries(payload)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;color:#6b7280;font-family:ui-monospace,monospace;font-size:12px;text-transform:uppercase">${esc(k)}</td><td style="padding:6px 12px;font-family:ui-sans-serif,system-ui">${esc(v)}</td></tr>`,
    )
    .join("");
  const html = `<div style="font-family:ui-sans-serif,system-ui;max-width:560px"><h2 style="margin:0 0 8px">New wholesale inquiry</h2><p style="color:#6b7280;margin:0 0 16px">${esc(SITE.name)} · ${esc(SITE.regionLabel)}</p><table style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">${rows}</table></div>`;
  if (RESEND_KEY) {
    try {
      await sendEmail(
        `Wholesale inquiry — ${payload.company ?? "new lead"}`,
        html,
      );
      return "email";
    } catch (e) {
      console.error("[notify] email failed, falling back to local:", e);
    }
  }
  try {
    await appendInbox("wholesale", payload);
    return "local";
  } catch (e) {
    console.error("[notify] local inbox append failed (wholesale):", e);
    return "failed";
  }
}

export async function notifyNewsletter(
  email: string,
  meta: Record<string, unknown>,
): Promise<Delivery> {
  const html = `<div style="font-family:ui-sans-serif,system-ui"><h2 style="margin:0 0 8px">New newsletter signup</h2><p style="color:#6b7280;margin:0 0 16px">${esc(SITE.name)}</p><p style="font-size:16px">${esc(email)}</p></div>`;
  if (RESEND_KEY) {
    try {
      await sendEmail(`Newsletter signup — ${email}`, html);
      return "email";
    } catch (e) {
      console.error("[notify] email failed, falling back to local:", e);
    }
  }
  try {
    await appendInbox("newsletter", { email, ...meta });
    return "local";
  } catch (e) {
    console.error("[notify] local inbox append failed (newsletter):", e);
    return "failed";
  }
}
