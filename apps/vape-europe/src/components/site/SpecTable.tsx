"use client";

import { useLocale } from "@/lib/i18n/locale-context";
import { SectionNumber } from "@/components/site/SectionNumber";

/**
 * Europe "Engineering Spec" signature.
 *
 * A metric / before / after comparison table — mono, spec-sheet feel.
 * Communicates "operational transparency" to a compliance-minded EU buyer.
 */
export function SpecTable() {
  const { t } = useLocale();
  const rows = [
    { metric: t("spec.row1.m"), before: t("spec.row1.b"), after: t("spec.row1.a") },
    { metric: t("spec.row2.m"), before: t("spec.row2.b"), after: t("spec.row2.a") },
    { metric: t("spec.row3.m"), before: t("spec.row3.b"), after: t("spec.row3.a") },
    { metric: t("spec.row4.m"), before: t("spec.row4.b"), after: t("spec.row4.a") },
  ];

  return (
    <section className="border-b border-border bg-card/30 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <SectionNumber n="05" className="mb-6">{t("spec.eyebrow")}</SectionNumber>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t("spec.title")}
        </h2>

        <div className="mt-8 overflow-hidden rounded-xl border border-border">
          <table className="w-full border-collapse font-mono text-sm">
            <thead>
              <tr className="border-b border-border bg-background/60 text-left text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <th className="px-4 py-3 sm:px-6">{t("spec.col.metric")}</th>
                <th className="px-4 py-3 sm:px-6">{t("spec.col.before")}</th>
                <th className="px-4 py-3 text-primary sm:px-6">{t("spec.col.after")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3.5 font-sans font-medium text-foreground sm:px-6">{r.metric}</td>
                  <td className="px-4 py-3.5 text-muted-foreground line-through decoration-muted-foreground/40 sm:px-6">{r.before}</td>
                  <td className="px-4 py-3.5 font-semibold text-primary sm:px-6">{r.after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
