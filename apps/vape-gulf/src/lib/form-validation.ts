/**
 * Shared validation for the public lead forms (wholesale inquiry + newsletter).
 * Pure functions, no side effects — safe to import from client components
 * and route handlers alike.
 *
 * The caps double as spam hardening: oversized strings are rejected before
 * they ever reach a delivery channel (Resend email / Feishu Bitable).
 *
 * Field mapping on the wholesale form:
 *   company (required) · country (required) · email (required)
 *   phone / volume / notes / brands (optional)
 */

/** Hard upper bounds per field, in characters (post-trim). */
export const FIELD_LIMITS = {
  /** Short person-name style text (also used for volume / brand entries). */
  NAME: 200,
  EMAIL: 320,
  PHONE: 40,
  /** Long free text — the "notes" textarea on the wholesale form. */
  MESSAGE: 5000,
  COMPANY: 200,
} as const;

/**
 * Hidden anti-bot field. The routes return a fake success when it is
 * non-empty, so bots get no signal; humans never see the input.
 */
export const HONEYPOT_FIELD = "website";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: unknown): boolean {
  return typeof value === "string" && EMAIL_RE.test(value.trim());
}

export interface ValidationResult {
  ok: boolean;
  errors: Record<string, string>;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function requireField(
  errors: Record<string, string>,
  key: string,
  label: string,
  value: unknown,
): void {
  if (text(value).length === 0) {
    errors[key] = `${label} is required.`;
  }
}

function capField(
  errors: Record<string, string>,
  key: string,
  label: string,
  value: unknown,
  limit: number,
): void {
  if (text(value).length > limit) {
    errors[key] = `${label} must be at most ${limit} characters.`;
  }
}

export function validateInquiry(
  payload: Record<string, unknown>,
): ValidationResult {
  const errors: Record<string, string> = {};

  requireField(errors, "company", "Company", payload.company);
  capField(errors, "company", "Company", payload.company, FIELD_LIMITS.COMPANY);

  requireField(errors, "country", "Country", payload.country);
  capField(errors, "country", "Country", payload.country, FIELD_LIMITS.COMPANY);

  requireField(errors, "email", "Email", payload.email);
  if (!errors.email) {
    capField(errors, "email", "Email", payload.email, FIELD_LIMITS.EMAIL);
    if (!errors.email && !isValidEmail(payload.email)) {
      errors.email = "Please enter a valid email address.";
    }
  }

  capField(errors, "phone", "Phone", payload.phone, FIELD_LIMITS.PHONE);
  capField(errors, "volume", "Volume", payload.volume, FIELD_LIMITS.NAME);
  capField(errors, "notes", "Message", payload.notes, FIELD_LIMITS.MESSAGE);

  if (payload.brands !== undefined) {
    if (!Array.isArray(payload.brands)) {
      errors.brands = "Brands must be a list.";
    } else if (payload.brands.length > 50) {
      errors.brands = "Too many brands selected.";
    } else if (payload.brands.some((b) => text(b).length > FIELD_LIMITS.NAME)) {
      errors.brands = `Brand entries must be at most ${FIELD_LIMITS.NAME} characters.`;
    }
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateNewsletter(
  payload: Record<string, unknown>,
): ValidationResult {
  const errors: Record<string, string> = {};
  const email = text(payload.email);
  if (email.length === 0) {
    errors.email = "Email is required.";
  } else if (email.length > FIELD_LIMITS.EMAIL) {
    errors.email = `Email must be at most ${FIELD_LIMITS.EMAIL} characters.`;
  } else if (!isValidEmail(email)) {
    errors.email = "Please enter a valid email address.";
  }
  return { ok: Object.keys(errors).length === 0, errors };
}
