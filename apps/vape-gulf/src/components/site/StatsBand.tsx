import { PRODUCTS_STATS } from "@/lib/data";

export function StatsBand() {
  const stats = [
    { value: String(PRODUCTS_STATS.total_brands), label: "Brands stocked" },
    { value: String(PRODUCTS_STATS.total_products), label: "SKUs available" },
    { value: `${PRODUCTS_STATS.unique_flavors_estimate}+`, label: "Unique flavors" },
    { value: "6", label: "GCC rule sets" },
    { value: "2-3d", label: "KSA lead time" },
    { value: "SFDA", label: "Conforming" },
  ];
  return (
    <section className="border-y border-border/60 bg-[#080D0A] py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center sm:text-left">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {s.label}
              </dt>
              <dd className="mt-1 font-display text-3xl font-semibold leading-none tracking-tight text-foreground">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
