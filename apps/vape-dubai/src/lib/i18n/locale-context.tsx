"use client";

import * as React from "react";
import { type Locale, translate, LOCALES, isRtl } from "./dictionary";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  hydrated: boolean;
};

const STORAGE_KEY = "vfg.locale";
const DEFAULT: Locale = "en";

/**
 * GCC countries whose local reading habit is Arabic-first. A visitor
 * geo-located here lands on the Arabic UI on first visit (they can still
 * switch). Serves the local small-retailer traffic that browses in Arabic.
 */
const ARABIC_DEFAULT_COUNTRIES = new Set(["AE", "SA", "QA", "KW", "BH", "OM", "EG", "JO"]);

const LocaleContext = React.createContext<Ctx | null>(null);

async function detectInitialLocale(): Promise<Locale> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && LOCALES.some((l) => l.code === stored)) return stored;
  } catch {}

  // Geo: Arabic-speaking region → Arabic UI (matches local reading habit).
  try {
    const res = await fetch("/api/geo", { cache: "no-store" });
    if (res.ok) {
      const { country } = (await res.json()) as { country: string | null };
      if (country && ARABIC_DEFAULT_COUNTRIES.has(country.toUpperCase())) return "ar";
    }
  } catch {}

  // Fallback: browser language.
  if (typeof navigator !== "undefined") {
    const nav = navigator.language.slice(0, 2).toLowerCase();
    const match = LOCALES.find((l) => l.code === nav);
    if (match) return match.code;
  }
  return DEFAULT;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>(DEFAULT);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    detectInitialLocale().then((l) => {
      if (!cancelled) {
        setLocaleState(l);
        setHydrated(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = React.useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {}
  }, []);

  // Keep <html dir> / <html lang> in sync with the active locale (RTL for Arabic).
  React.useEffect(() => {
    document.documentElement.dir = isRtl(locale) ? "rtl" : "ltr";
    document.documentElement.lang = locale;
  }, [locale]);

  const t = React.useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale]
  );

  const value = React.useMemo<Ctx>(
    () => ({ locale, setLocale, t, hydrated }),
    [locale, setLocale, t, hydrated]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Ctx {
  const ctx = React.useContext(LocaleContext);
  if (!ctx) {
    // Server-render fallback — no provider during SSR is OK
    return {
      locale: DEFAULT,
      setLocale: () => {},
      t: (key, vars) => translate(DEFAULT, key, vars),
      hydrated: false,
    };
  }
  return ctx;
}
