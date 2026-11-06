"use client";

import * as React from "react";
import { Analytics } from "@vercel/analytics/react";
import { CONSENT_KEY } from "@/components/site/CookieConsent";

/**
 * Consent gate for Vercel Analytics (A4 / P0#6).
 *
 * The cookie banner offers "Decline optional" — so optional analytics must
 * actually stay off until the visitor accepts. This component renders
 * <Analytics /> ONLY when localStorage[CONSENT_KEY] === "accepted".
 * Rejected or undecided → no analytics script is ever loaded.
 *
 * Re-evaluates on the "storage" event so a consent change in another tab
 * takes effect without a reload; same-tab changes apply on next navigation.
 */
export function ConsentAnalytics() {
  const [allowed, setAllowed] = React.useState(false);

  React.useEffect(() => {
    const read = () => {
      try {
        setAllowed(localStorage.getItem(CONSENT_KEY) === "accepted");
      } catch {
        setAllowed(false); // private mode → treat as no consent
      }
    };
    read();
    window.addEventListener("storage", read);
    return () => window.removeEventListener("storage", read);
  }, []);

  if (!allowed) return null;
  return <Analytics />;
}
