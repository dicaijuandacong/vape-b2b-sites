import type { Country } from "@/types/product";

export const COUNTRIES: Country[] = [
  {
    code: "SA",
    name: "Saudi Arabia",
    flag: "🇸🇦",
    currency: "SAR",
    disposable_allowed: true,
    dtc_allowed: false,
    warning_label:
      "This product contains nicotine which is a highly addictive substance. 18+ only.",
    notes:
      "Regulated under SFDA / SASO technical regulations. 100% excise tax + 15% VAT. We supply licensed distributors and retail chains from our Riyadh bonded warehouse.",
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    flag: "🇦🇪",
    currency: "AED",
    disposable_allowed: true,
    dtc_allowed: true,
    warning_label:
      "This product contains nicotine which is a highly addictive substance. 18+ only.",
    notes:
      "E-cigarettes legal since April 2019 under ESMA / UAE.S 5030:2018. 100% excise tax + 5% VAT. 3-5 day line-haul from Riyadh or ex-Jebel Ali partner stock.",
  },
  {
    code: "QA",
    name: "Qatar",
    flag: "🇶🇦",
    currency: "QAR",
    disposable_allowed: true,
    dtc_allowed: false,
    warning_label:
      "This product contains nicotine which is a highly addictive substance. 18+ only.",
    notes:
      "Vaping products regulated; retail sale restricted. We ship B2B to licensed importers only — confirm your import licence before ordering.",
  },
  {
    code: "KW",
    name: "Kuwait",
    flag: "🇰🇼",
    currency: "KWD",
    disposable_allowed: true,
    dtc_allowed: false,
    warning_label:
      "This product contains nicotine which is a highly addictive substance. 18+ only.",
    notes:
      "Sale of e-cigarettes permitted under ministry oversight. B2B supply to licensed shops; excise stamps arranged at origin.",
  },
  {
    code: "BH",
    name: "Bahrain",
    flag: "🇧🇭",
    currency: "BHD",
    disposable_allowed: true,
    dtc_allowed: false,
    warning_label:
      "This product contains nicotine which is a highly addictive substance. 18+ only.",
    notes:
      "Legal and regulated since 2016. 100% excise tax + 10% VAT. B2B supply via licensed importers.",
  },
  {
    code: "OM",
    name: "Oman",
    flag: "🇴🇲",
    currency: "OMR",
    disposable_allowed: true,
    dtc_allowed: false,
    warning_label:
      "This product contains nicotine which is a highly addictive substance. 18+ only.",
    notes:
      "Sale legalised in 2021 under GCC standardisation. 100% excise tax + 5% VAT. B2B import partners only.",
  },
];

export const DEFAULT_COUNTRY: Country = COUNTRIES.find((c) => c.code === "SA")!;

export function getCountry(code: string): Country {
  return COUNTRIES.find((c) => c.code === code) ?? DEFAULT_COUNTRY;
}
