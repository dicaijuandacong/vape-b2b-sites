import type { Country } from "@/types/product";

export const COUNTRIES: Country[] = [
  {
    code: "GB",
    name: "United Kingdom",
    flag: "🇬🇧",
    currency: "GBP",
    disposable_allowed: false,
    dtc_allowed: false,
    warning_label:
      "This product contains nicotine which is a highly addictive substance.",
    notes: "From 1 June 2025, single-use vapes are banned for sale and supply in the UK. We display rechargeable, refillable and prefilled-pod systems only.",
  },
  {
    code: "FR",
    name: "France",
    flag: "🇫🇷",
    currency: "EUR",
    disposable_allowed: false,
    dtc_allowed: false,
    warning_label:
      "Ce produit contient de la nicotine, une substance hautement addictive.",
    notes: "Depuis le 26 février 2025, les puffs jetables sont interdits à la vente. Catalogue restreint aux systèmes rechargeables.",
  },
  {
    code: "DE",
    name: "Germany",
    flag: "🇩🇪",
    currency: "EUR",
    disposable_allowed: true,
    dtc_allowed: false,
    warning_label:
      "Dieses Produkt enthält Nikotin, einen stark abhängig machenden Stoff.",
    notes: "B2B-only. Direktverkauf an Endkunden derzeit nicht verfügbar.",
  },
  {
    code: "NL",
    name: "Netherlands",
    flag: "🇳🇱",
    currency: "EUR",
    disposable_allowed: true,
    dtc_allowed: false,
    warning_label:
      "Dit product bevat nicotine, een sterk verslavende stof.",
    notes: "Online sales of e-cigarettes to NL consumers prohibited since 1 July 2023. B2B trade only.",
  },
  {
    code: "BE",
    name: "Belgium",
    flag: "🇧🇪",
    currency: "EUR",
    disposable_allowed: false,
    dtc_allowed: false,
    warning_label:
      "Ce produit contient de la nicotine, une substance hautement addictive.",
    notes: "Disposable vapes banned since 1 January 2025. B2B and rechargeable systems only.",
  },
  {
    code: "ES",
    name: "Spain",
    flag: "🇪🇸",
    currency: "EUR",
    disposable_allowed: true,
    dtc_allowed: true,
    warning_label:
      "Este producto contiene nicotina, una sustancia muy adictiva.",
  },
  {
    code: "IT",
    name: "Italy",
    flag: "🇮🇹",
    currency: "EUR",
    disposable_allowed: true,
    dtc_allowed: true,
    warning_label:
      "Questo prodotto contiene nicotina, una sostanza che dà forte dipendenza.",
  },
  {
    code: "EU",
    name: "Other EU / EEA",
    flag: "🇪🇺",
    currency: "EUR",
    disposable_allowed: true,
    dtc_allowed: true,
    warning_label:
      "This product contains nicotine, a highly addictive substance.",
  },
];

export const DEFAULT_COUNTRY: Country = COUNTRIES.find((c) => c.code === "EU")!;

export function getCountry(code: string): Country {
  return COUNTRIES.find((c) => c.code === code) ?? DEFAULT_COUNTRY;
}
