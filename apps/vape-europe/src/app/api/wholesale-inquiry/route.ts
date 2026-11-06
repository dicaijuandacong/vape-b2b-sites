import { NextResponse } from "next/server";
import { notifyWholesale } from "@/lib/notify";
import { appendLead, notifyNewLead, type LeadPayload } from "@/lib/feishu";
import { SITE } from "@/lib/site";
import { HONEYPOT_FIELD, validateInquiry } from "@/lib/form-validation";

export const runtime = "nodejs";

interface WholesalePayload {
  company: string;
  country: string;
  email: string;
  phone?: string;
  brands?: string[];
  volume?: string;
  notes?: string;
}

function pickString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function pickStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: string[] = [];
  for (const v of value) {
    if (typeof v === "string" && v.trim().length > 0) {
      out.push(v.trim());
    }
  }
  return out.length > 0 ? out : undefined;
}

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

  const { ok: valid, errors } = validateInquiry(obj);
  if (!valid) {
    return NextResponse.json(
      { ok: false, error: "validation_failed", errors },
      { status: 400 },
    );
  }

  const company = pickString(obj.company) ?? "";
  const country = pickString(obj.country) ?? "";
  const emailRaw = pickString(obj.email) ?? "";

  const payload: WholesalePayload = {
    company,
    country,
    email: emailRaw.toLowerCase(),
  };

  const phone = pickString(obj.phone);
  if (phone) payload.phone = phone;

  const brands = pickStringArray(obj.brands);
  if (brands) payload.brands = brands;

  const volume = pickString(obj.volume);
  if (volume) payload.volume = volume;

  const notes = pickString(obj.notes);
  if (notes) payload.notes = notes;

  const ip = request.headers.get("x-forwarded-for");
  const ua = request.headers.get("user-agent");
  const id = Date.now();

  // P0 fix: the delivery result is checked, never discarded.
  // "email" | "local" = email pipeline succeeded; "failed" = both Resend
  // and the local inbox fallback inside notifyWholesale threw.
  const emailDelivery = await notifyWholesale({ id, ip, ua, ...payload });

  // Ops pipeline: mirror the lead into Feishu Bitable + push group-bot card.
  let feishuSaved = false;
  let recordId: string | undefined;
  const lead: LeadPayload = {
    siteKey: SITE.siteKey,
    type: "wholesale",
    email: payload.email,
    company,
    country,
    phone: payload.phone,
    brands: payload.brands,
    volume: payload.volume,
    notes: payload.notes,
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

  // Dual-channel verdict: succeed if at least one channel has the lead.
  // Logs must not contain PII: use the Feishu recordId when available,
  // otherwise only the email domain (enough to spot domain-level failures).
  if (emailDelivery === "failed" && !feishuSaved) {
    const emailDomain = payload.email.split("@")[1] ?? "unknown";
    console.error(
      `[wholesale-inquiry] ALL delivery channels failed for email domain ${emailDomain} — ` +
        `email status "failed" (see [notify] logs above), Feishu append failed ` +
        `(see [feishu:lead] log above). Lead LOST.`,
    );
    return NextResponse.json(
      { ok: false, error: "delivery_failed" },
      { status: 500 },
    );
  }
  if (emailDelivery === "failed") {
    console.error(
      `[wholesale-inquiry] email delivery failed for record ${recordId ?? "unknown"}; ` +
        `lead saved to Feishu only.`,
    );
  }

  return NextResponse.json({ ok: true, id });
}
