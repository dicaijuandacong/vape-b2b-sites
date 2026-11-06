"use client";

import * as React from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";

/**
 * Lightweight cookie-consent banner. Stores the visitor's choice in
 * localStorage under `cookie-consent-v1`. Non-essential scripts (e.g.
 * analytics) must check this key before loading — see ConsentAnalytics:
 * "Decline optional" means analytics is NOT loaded unless accepted.
 *
 * This is a consent UI, not legal advice. The cookie policy lives at
 * /legal/cookies and the underlying text still needs lawyer sign-off.
 */
export const CONSENT_KEY = "cookie-consent-v1";
const KEY = CONSENT_KEY;

export function CookieConsent() {
  const { locale } = useLocale();
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* private mode — stay hidden */
    }
  }, []);

  const decide = React.useCallback((value: "accepted" | "rejected") => {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      /* ignore */
    }
    setShow(false);
  }, []);

  if (!show) return null;
  const isAr = (locale as string) === "ar";

  return (
    <div
      role="dialog"
      aria-label={isAr ? "موافقة ملفات تعريف الارتباط" : "Cookie consent"}
      dir={isAr ? "rtl" : "ltr"}
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:pb-6"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-popover/95 p-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)] backdrop-blur sm:p-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {isAr ? (
            <>
              نستخدم ملفات وتخزين محلي ضروري لتشغيل الموقع (اللغة/الدولة). لا نستخدم
              إعلانات تابعة لطرف ثالث. اطّلع على{" "}
              <Link href="/legal/cookies" className="font-medium text-primary hover:underline">
                سياسة ملفات تعريف الارتباط
              </Link>
              .
            </>
          ) : (
            <>
              We use strictly-necessary storage to run the site (your language and
              country). No third-party ad trackers. See our{" "}
              <Link href="/legal/cookies" className="font-medium text-primary hover:underline">
                cookie policy
              </Link>
              .
            </>
          )}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => decide("rejected")}
            className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {isAr ? "رفض الاختياري" : "Decline optional"}
          </button>
          <button
            onClick={() => decide("accepted")}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {isAr ? "قبول" : "Accept"}
          </button>
        </div>
      </div>
    </div>
  );
}
