import { describe, it, expect } from "vitest";
import {
  FIELD_LIMITS,
  HONEYPOT_FIELD,
  isValidEmail,
  validateInquiry,
  validateNewsletter,
} from "../form-validation";

const VALID_INQUIRY = {
  company: "Acme Distribution",
  country: "DE",
  email: "buyer@acme.eu",
};

describe("constants", () => {
  it("exports the agreed field caps and honeypot field name", () => {
    expect(FIELD_LIMITS).toEqual({
      NAME: 200,
      EMAIL: 320,
      PHONE: 40,
      MESSAGE: 5000,
      COMPANY: 200,
    });
    expect(HONEYPOT_FIELD).toBe("website");
  });
});

describe("isValidEmail", () => {
  it.each([
    ["buyer@acme.eu"],
    ["first.last+tag@sub.example.co.uk"],
    ["a@b.c"],
    ["  padded@around.com  "], // trimmed before testing
  ])("accepts %s", (v) => {
    expect(isValidEmail(v)).toBe(true);
  });

  it.each([
    [""],
    ["plainaddress"],
    ["missing-tld@localhost"], // no dot after @
    ["a@.com"], // domain starts with dot
    ["@no-local.com"], // empty local part
    ["spaces in@address.com"],
    ["two@ats@address.com"],
    ["trailing@dot."],
    [null],
    [undefined],
    [12345],
  ])("rejects %s", (v) => {
    expect(isValidEmail(v)).toBe(false);
  });
});

describe("validateInquiry", () => {
  it("passes a complete valid inquiry", () => {
    const r = validateInquiry({
      ...VALID_INQUIRY,
      phone: "+49 30 1234 5678",
      volume: "500-2,000",
      notes: "Mixed assortment, retail channel.",
      brands: ["Elfbar", "Geekbar"],
    });
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual({});
  });

  it("passes with only the required fields", () => {
    expect(validateInquiry(VALID_INQUIRY).ok).toBe(true);
  });

  it.each([
    ["company", { ...VALID_INQUIRY, company: "" }],
    ["company", { ...VALID_INQUIRY, company: "   " }],
    ["country", { ...VALID_INQUIRY, country: "" }],
    ["email", { ...VALID_INQUIRY, email: "" }],
    ["email", { ...VALID_INQUIRY, email: "not-an-email" }],
    ["email", { ...VALID_INQUIRY, email: 42 as unknown }],
  ])("reports a validation error for invalid %s", (_field, payload) => {
    const r = validateInquiry(payload as Record<string, unknown>);
    expect(r.ok).toBe(false);
    expect(Object.keys(r.errors).length).toBeGreaterThan(0);
  });

  it("aggregates every missing required field at once", () => {
    const r = validateInquiry({});
    expect(r.ok).toBe(false);
    expect(Object.keys(r.errors).sort()).toEqual(["company", "country", "email"]);
  });

  describe("boundary caps (exactly at / one over)", () => {
    it("company at exactly COMPANY chars passes, +1 fails", () => {
      const at = "c".repeat(FIELD_LIMITS.COMPANY);
      const over = "c".repeat(FIELD_LIMITS.COMPANY + 1);
      expect(validateInquiry({ ...VALID_INQUIRY, company: at }).ok).toBe(true);
      const r = validateInquiry({ ...VALID_INQUIRY, company: over });
      expect(r.ok).toBe(false);
      expect(r.errors.company).toContain(String(FIELD_LIMITS.COMPANY));
    });

    it("email at exactly EMAIL chars passes, +1 fails", () => {
      const domain = "@example.com";
      const at = "a".repeat(FIELD_LIMITS.EMAIL - domain.length) + domain;
      const over = "a".repeat(FIELD_LIMITS.EMAIL - domain.length + 1) + domain;
      expect(at.length).toBe(FIELD_LIMITS.EMAIL);
      expect(validateInquiry({ ...VALID_INQUIRY, email: at }).ok).toBe(true);
      const r = validateInquiry({ ...VALID_INQUIRY, email: over });
      expect(r.ok).toBe(false);
      expect(r.errors.email).toContain(String(FIELD_LIMITS.EMAIL));
    });

    it("phone at exactly PHONE chars passes, +1 fails", () => {
      const at = "+" + "1".repeat(FIELD_LIMITS.PHONE - 1);
      const over = "+" + "1".repeat(FIELD_LIMITS.PHONE);
      expect(validateInquiry({ ...VALID_INQUIRY, phone: at }).ok).toBe(true);
      expect(validateInquiry({ ...VALID_INQUIRY, phone: over }).errors.phone).toBeDefined();
    });

    it("notes at exactly MESSAGE chars passes, +1 fails", () => {
      const at = "n".repeat(FIELD_LIMITS.MESSAGE);
      const over = "n".repeat(FIELD_LIMITS.MESSAGE + 1);
      expect(validateInquiry({ ...VALID_INQUIRY, notes: at }).ok).toBe(true);
      const r = validateInquiry({ ...VALID_INQUIRY, notes: over });
      expect(r.errors.notes).toContain(String(FIELD_LIMITS.MESSAGE));
    });

    it("country over the cap fails", () => {
      const over = "c".repeat(FIELD_LIMITS.COMPANY + 1);
      expect(validateInquiry({ ...VALID_INQUIRY, country: over }).errors.country).toBeDefined();
    });
  });

  describe("brands", () => {
    it("rejects a non-array brands value", () => {
      const r = validateInquiry({ ...VALID_INQUIRY, brands: "Elfbar" });
      expect(r.ok).toBe(false);
      expect(r.errors.brands).toBeDefined();
    });

    it("rejects an oversized brand entry", () => {
      const r = validateInquiry({
        ...VALID_INQUIRY,
        brands: ["b".repeat(FIELD_LIMITS.NAME + 1)],
      });
      expect(r.errors.brands).toBeDefined();
    });

    it("rejects more than 50 entries", () => {
      const r = validateInquiry({
        ...VALID_INQUIRY,
        brands: Array.from({ length: 51 }, (_, i) => `brand-${i}`),
      });
      expect(r.errors.brands).toBeDefined();
    });
  });

  it("ignores the honeypot field entirely", () => {
    const r = validateInquiry({ ...VALID_INQUIRY, [HONEYPOT_FIELD]: "http://spam.example" });
    expect(r.ok).toBe(true);
  });
});

describe("validateNewsletter", () => {
  it("accepts a valid email", () => {
    expect(validateNewsletter({ email: "buyer@acme.eu" })).toEqual({ ok: true, errors: {} });
  });

  it("rejects a missing or invalid email", () => {
    expect(validateNewsletter({}).errors.email).toBeDefined();
    expect(validateNewsletter({ email: "nope" }).errors.email).toBeDefined();
    expect(validateNewsletter({ email: "" }).errors.email).toBeDefined();
  });

  it("enforces the email cap boundary", () => {
    const domain = "@example.com";
    const at = "a".repeat(FIELD_LIMITS.EMAIL - domain.length) + domain;
    const over = "a".repeat(FIELD_LIMITS.EMAIL - domain.length + 1) + domain;
    expect(validateNewsletter({ email: at }).ok).toBe(true);
    expect(validateNewsletter({ email: over }).errors.email).toBeDefined();
  });

  it("ignores the honeypot field", () => {
    expect(validateNewsletter({ email: "buyer@acme.eu", [HONEYPOT_FIELD]: "x" }).ok).toBe(true);
  });
});
