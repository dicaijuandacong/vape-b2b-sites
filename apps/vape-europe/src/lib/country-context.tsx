"use client";

import * as React from "react";
import { COUNTRIES, DEFAULT_COUNTRY, getCountry } from "@/lib/i18n";
import type { Country } from "@/types/product";

const STORAGE_KEY = "vfg.country";

type Ctx = {
  country: Country;
  setCountry: (code: string) => void;
  hydrated: boolean;
};

const CountryContext = React.createContext<Ctx | null>(null);

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [code, setCodeState] = React.useState<string>(DEFAULT_COUNTRY.code);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && COUNTRIES.some((c) => c.code === stored)) {
        setCodeState(stored);
      }
    } catch {}
    setHydrated(true);
  }, []);

  const setCountry = React.useCallback((next: string) => {
    setCodeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }, []);

  const value = React.useMemo<Ctx>(
    () => ({ country: getCountry(code), setCountry, hydrated }),
    [code, setCountry, hydrated]
  );

  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>;
}

export function useCountry(): Ctx {
  const ctx = React.useContext(CountryContext);
  if (!ctx) {
    // Graceful fallback for components that mount before provider
    return { country: DEFAULT_COUNTRY, setCountry: () => {}, hydrated: false };
  }
  return ctx;
}
