import { NextResponse } from "next/server";
import { readInbox } from "@/lib/inbox";
import { notifyNewsletter } from "@/lib/notify";
import { appendLead, notifyNewLead, type LeadPayload } from "@/lib/feishu";
import { SITE } from "@/lib/site";
import { HONEYPOT_FIELD, validateNewsletter } from "@/lib/form-validation";

export const runtime = "nodejs";

const RATE_LIMIT_WINDOW_MS = 60_000;

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { ok: false, error: "Body must be an object" },
      { status: 400 },
    );
  }

  const obj = body as Record<string, unknown>;

  // Honeypot: bots that fill the hidden "website" field get a fake success.
  // No delivery is attempted — humans never see this input.
  const honeypot = obj[HONEYPOT_FIELD];
  if (typeof honeypot === "string" && honeypot.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const { ok: valid, errors } = validateNewsletter(obj);
  if (!valid) {
    return NextResponse.json(
      { ok: false, error: "validation_failed", errors },
      { status: 400 },
    );
  }

  const email = (obj.email as string).trim().toLowerCase();

  // Naive rate-limit: same email within the last 60s.
  // If the dedupe store is unreadable we still accept — better to risk a
  // duplicate than to lose a lead.
  try {
    const recent = await readInbox("newsletter");
    const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
    const dup = recent.find((r) => {
      const ts = typeof r.ts === "string" ? Date.parse(r.ts) : NaN;
      const e = typeof r.email === "string" ? r.email.toLowerCase() : "";
      return e === email && Number.isFinite(ts) && ts >= cutoff;
    });
    if (dup) {
      return NextResponse.json(
        { ok: false, error: "Please wait a moment before subscribing again." },
        { status: 429 },
      );
    }
  } catch {
    // Rate-limit read failed — continue with delivery.
  }

  const ip = request.headers.get("x-forwarded-for");
  const ua = request.headers.get("user-agent");

  // P0 fix: the delivery result is checked, never discarded.
  const delivery = await notifyNewsletter(email, { ip, ua });

  // Ops pipeline: mirror the signup into Feishu Bitable + push group-bot card.
  let feishuSaved = false;
  let recordId: string | undefined;
  const lead: LeadPayload = {
    siteKey: SITE.siteKey,
    type: "newsletter",
    email,
    ip: ip ?? null,
    ua: ua ?? null,
  };
  try {
    recordId = await appendLead(lead);
    feishuSaved = true;
    await notifyNewLead(lead, recordId).catch((e) => console.error("[feishu:bot]", e));
  } catch (e) {
    console.error("[feishu:lead]", e);
  }

  // Dual-channel verdict: succeed if at least one channel has the signup.
  // Logs must not contain PII: use the Feishu recordId when available,
  // otherwise only the email domain (enough to spot domain-level failures).
  if (delivery === "failed" && !feishuSaved) {
    const emailDomain = email.split("@")[1] ?? "unknown";
    console.error(
      `[newsletter] ALL delivery channels failed for email domain ${emailDomain} — ` +
        `email status "failed" (see [notify] logs above), Feishu append failed ` +
        `(see [feishu:lead] log above). Signup LOST.`,
    );
    return NextResponse.json(
      { ok: false, error: "delivery_failed" },
      { status: 500 },
    );
  }
  if (delivery === "failed") {
    console.error(
      `[newsletter] email delivery failed for record ${recordId ?? "unknown"}; signup saved to Feishu only.`,
    );
  }

  return NextResponse.json({ ok: true });
}
