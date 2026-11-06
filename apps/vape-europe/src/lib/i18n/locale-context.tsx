"use client";

import * as React from "react";
import { type Locale, translate, LOCALES } from "./dictionary";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  hydrated: boolean;
};

const STORAGE_KEY = "vfg.locale";
const DEFAULT: Locale = "en";

const LocaleContext = React.createContext<Ctx | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>(DEFAULT);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (stored && LOCALES.some((l) => l.code === stored)) {
        setLocaleState(stored);
      } else if (typeof navigator !== "undefined") {
        // Auto-detect browser locale on first visit
        const nav = navigator.language.slice(0, 2).toLowerCase();
        const match = LOCALES.find((l) => l.code === nav);
        if (match) setLocaleState(match.code);
      }
    } catch {}
    setHydrated(true);
  }, []);

  const setLocale = React.useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {}
  }, []);

  // Keep <html lang/dir> in sync with the active locale — for SEO (correct
  // lang declaration) and screen readers. Europe locales are all LTR.
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
    document.documentElement.dir = "ltr";
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
