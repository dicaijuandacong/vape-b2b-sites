"use client";

import * as React from "react";
import { useLocale } from "@/lib/i18n/locale-context";

/**
 * Localized "pricing on request" label. Per-SKU wholesale prices are shared
 * 1-on-1 after a quote request (factory pricing is never shown publicly), so
 * every former price slot renders this instead. Safe in server parents
 * (it is a client island reading the locale context).
 */
export function QuoteLabel() {
  const { t } = useLocale();
  return <>{t("price.onRequest")}</>;
}
