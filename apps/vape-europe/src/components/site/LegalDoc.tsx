"use client";

import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/locale-context";
import { getLegalDoc, type LegalDoc as DocKey } from "@/lib/legal-content";

/**
 * Renders a bilingual legal document. The body follows the active UI
 * locale (EN/AR), so the legal text matches the language the visitor is
 * reading — closing the gap where nav was translated but the body was
 * English-only.
 *
 * NOTE: the underlying text is draft boilerplate. It must be reviewed and
 * signed off by a qualified lawyer before launch.
 */
export function LegalDoc({ doc }: { doc: DocKey }) {
  const { locale } = useLocale();
  const d = getLegalDoc(doc, locale);
  const isAr = (locale as string) === "ar";

  return (
    <div className="pt-32 sm:pt-40">
      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6 lg:px-8">
        <Badge variant="muted" size="lg" className="mb-4">
          {isAr ? "قانوني" : "Legal"}
        </Badge>
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {d.title}
        </h1>
        <p className="mt-6 text-base leading-relaxed text-muted-foreground">{d.intro}</p>

        <div className="mt-6 rounded-xl border border-border/70 bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
          {isAr
            ? "هذا النص مسودّة قابلة للاستخدام وليست بديلاً عن مراجعة محامٍ مُرخَّص في الولاية الحاكمة قبل الإطلاق العام. يجب على the operator اعتماده قانونياً."
            : "This is usable draft text, not legal advice. It must be reviewed and signed off by a lawyer qualified in the governing-law jurisdiction before public launch."}
        </div>

        <div className="mt-10 space-y-8">
          {d.sections.map((s) => (
            <div key={s.h}>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">{s.h}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.p}</p>
            </div>
          ))}
        </div>

        <p className="mt-12 text-xs text-muted-foreground">{d.effective}</p>
      </section>
    </div>
  );
}
