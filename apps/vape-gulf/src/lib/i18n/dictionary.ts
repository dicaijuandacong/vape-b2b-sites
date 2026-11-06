/**
 * Lightweight i18n dictionary for the marketing surfaces.
 * Saudi / GCC site: EN (default) · AR (RTL, Saudi business register).
 *
 * Keys are dot-notated. Lookup falls back to English if missing.
 *
 * Translation provenance: hand-crafted, marketing-tone, not back-translated.
 * For long-form (legal, product specs) we keep English.
 */

export type Locale = "en" | "ar";

export const LOCALES: { code: Locale; name: string; native: string; flag: string; rtl?: boolean }[] = [
  { code: "en", name: "English", native: "English", flag: "🇸🇦" },
  { code: "ar", name: "Arabic",  native: "العربية",  flag: "🇸🇦", rtl: true },
];

export function isRtl(locale: Locale): boolean {
  return LOCALES.find((l) => l.code === locale)?.rtl === true;
}

type Dict = Record<string, string>;

const en: Dict = {
  // Price labels
  "price.from": "From",
  "price.fromPerUnit": "From (per unit)",
  "price.onRequest": "Pricing on request",
  // Header / nav
  "nav.brands": "Brands",
  "nav.catalog": "Catalog",
  "nav.wholesale": "Wholesale",
  "nav.about": "About",
  "nav.viewAll": "View all brands",
  "nav.search": "Search",
  "nav.openMenu": "Open menu",
  "nav.navigate": "Navigate",
  "nav.cta.buyWholesale": "Buy Wholesale",

  // Promo marquee
  "promo.1": "Wholesale only — vape distributor for Saudi Arabia & the GCC",
  "promo.2": "Riyadh bonded warehouse · 2-3 days KSA · 3-5 days across the GCC",
  "promo.3": "14 manufacturer-grade brands · {skus} flagship SKUs · {flavors}+ flavors",
  "promo.4": "B2B from 50 units · Tiered pricing · Sample boxes from SAR 399",
  "promo.5": "Custom branding & private label · MOQ from 1,000 units",

  // Hero
  "hero.chip": "Live Riyadh inventory · KSA 2-3 days · GCC 3-5 days",
  "hero.title.1": "The Kingdom's",
  "hero.title.2": "wholesale stack for",
  "hero.title.3": "next-gen vapor.",
  "hero.body": "14 manufacturer-grade brands. {skus}+ flagship SKUs. {flavors}+ flavors. SFDA / SASO conforming stock in Riyadh, excise-stamped at origin, 2-3 days across the Kingdom. The wholesale stack Saudi retailers actually want to stock.",
  "hero.stat.brands": "Brands",
  "hero.stat.skus": "SKUs",
  "hero.stat.flavors": "Flavors",
  "hero.cta.sample": "Request a sample box",
  "hero.cta.browse": "Browse 14 brands",
  "gallery.featured": "Maison pick",
  "gallery.chapter.01": "A curated wholesale catalog",
  "gallery.chapter.02": "Seven maisons, one purchase order",
  "gallery.chapter.03": "Formats & a single spotlight",
  "maison.title": "Seven maisons under one roof.",
  "maison.eyebrow": "Each a signed, SFDA-conforming line — stocked in Riyadh.",
  "maison.skus": "SKUs",
  "maison.flavors": "flavors",
  "maison.houses": "maisons",

  // ThreeHero
  "three.eyebrow": "GulfVape picks",
  "three.title": "Three flagship SKUs, three velocities.",
  "three.cta.fullCatalog": "See full catalog",
  "three.cta.viewProduct": "View product",

  // Categories
  "cat.eyebrow": "Shop by form factor",
  "cat.title": "Five product formats. One catalog.",
  "cat.rechargeable": "Rechargeable",
  "cat.rechargeable.desc": "Refillable flagships",
  "cat.disposable": "Disposable",
  "cat.disposable.desc": "Single-use bars",
  "cat.shisha": "Shisha-style",
  "cat.shisha.desc": "Hookah-format devices",
  "cat.podkit": "Pod kits",
  "cat.podkit.desc": "Refillable systems",
  "cat.eliquid": "E-liquids",
  "cat.eliquid.desc": "10ml refill bottles",

  // Featured spotlight
  "spotlight.eyebrow": "Featured this month",
  "spotlight.title": "The flagship that moves the most cartons.",
  "spotlight.cta.spec": "See full spec",
  "spotlight.cta.quote": "Quote this SKU",

  // Brands grid
  "brands.eyebrow": "Distributor portfolio",
  "brands.title": "Seven manufacturer-grade vape brands, one Kingdom stocking partner.",
  "brands.body": "Each brand below is a signed, Riyadh-warehoused, GCC-shippable line.",
  "brands.openCatalog": "Open brand catalog",

  // Top movers
  "top.eyebrow": "Top movers · Q1 2026",
  "top.title": "The eight SKUs Saudi distributors reorder fastest.",

  // Why distributors
  "why.eyebrow": "Why distributors choose GulfVape",
  "why.title": "Three reasons buyers say yes on the first call.",

  // B2B CTA
  "b2b.chip": "Wholesale · Riyadh bonded · KSA 2-3 days",
  "b2b.title": "One PO, seven brands, one warehouse.",
  "b2b.body": "Custom assortments from 50 units per SKU. Sample boxes for tier-1 retail buyers from SAR 399. Private label runs from 1,000 units, 12-week lead time.",
  "b2b.cta.portal": "Open wholesale portal",
  "b2b.cta.sample": "Order a sample box · SAR 399",

  // Newsletter
  "news.eyebrow": "Newsletter",
  "news.title.1": "Quarterly drop.",
  "news.title.2": "New SKUs.",
  "news.title.3": "Distributor pricing.",
  "news.body": "One email per quarter. No spam. Unsubscribe in one click. We never share your address.",
  "news.placeholder": "buyer@yourtrading.sa",
  "news.cta.subscribe": "Subscribe",
  "news.cta.subscribed": "Subscribed ✓",
  "news.cta.subscribing": "Subscribing…",

  // Footer
  "footer.section.catalog": "Catalog",
  "footer.section.wholesale": "Wholesale",
  "footer.section.company": "Company",
  "footer.tagline": "Saudi wholesale distributor for next-generation vapor brands. Riyadh bonded warehouse, 2-3 day KSA delivery, single PO across 14 manufacturer lines.",
  "footer.partner.title": "Riyadh stocking partner",
  "footer.legal.terms": "Terms",
  "footer.legal.privacy": "Privacy",
  "footer.legal.cookies": "Cookies",
  "footer.payment": "Payment",
  "footer.disclaimer": "Wholesale only · 18+",

  "hero.marquee1": "SAUDI · WHOLESALE · DISTRIBUTOR · 7 BRANDS",
  "hero.marquee2": "KSA 2-3 DAYS · RIYADH BONDED WAREHOUSE · TIERED PRICING",
};

const ar: Dict = {
  // Price labels
  "price.from": "ابتداءً من",
  "price.fromPerUnit": "ابتداءً من (للوحدة)",
  "price.onRequest": "السعر عند الطلب",
  // Header / nav
  "nav.brands": "العلامات",
  "nav.catalog": "الكتالوج",
  "nav.wholesale": "الجملة",
  "nav.about": "من نحن",
  "nav.viewAll": "عرض كل العلامات",
  "nav.search": "بحث",
  "nav.openMenu": "فتح القائمة",
  "nav.navigate": "التنقل",
  "nav.cta.buyWholesale": "اشترِ بالجملة",

  // Promo marquee
  "promo.1": "جملة فقط — موزّع فيب للمملكة العربية السعودية ودول الخليج",
  "promo.2": "مستودع جمركي في الرياض · 2-3 أيام داخل المملكة · 3-5 أيام للخليج",
  "promo.3": "14 علامة بجودة المصنع · {skus} منتجاً رائداً · أكثر من {flavors} نكهة",
  "promo.4": "للشركات من 50 قطعة · أسعار متدرجة · صناديق عينات من 399 ريال",
  "promo.5": "علامة خاصة وتخصيص كامل · حد أدنى من 1,000 قطعة",

  // Hero
  "hero.chip": "مخزون الرياض المباشر · المملكة 2-3 أيام · الخليج 3-5 أيام",
  "hero.title.1": "منصة المملكة",
  "hero.title.2": "لجملة الجيل",
  "hero.title.3": "الجديد من الفيب.",
  "hero.body": "14 علامة بجودة المصنع. أكثر من {skus} منتجاً رائداً. أكثر من {flavors} نكهة. مخزون مطابق لمواصفات SFDA / SASO في الرياض، مختوم بالطوابع الضريبية من المنشأ، وتوصيل خلال 2-3 أيام في جميع أنحاء المملكة. منصة الجملة التي يفضلها تجار التجزئة في السعودية.",
  "hero.stat.brands": "علامة",
  "hero.stat.skus": "منتج",
  "hero.stat.flavors": "نكهة",
  "hero.cta.sample": "اطلب صندوق عينات",
  "hero.cta.browse": "تصفح 14 علامة",
  "gallery.featured": "اختيار الدار",
  "gallery.chapter.01": "كتالوج جملة مُختار بعناية",
  "gallery.chapter.02": "سبع دور، أمر شراء واحد",
  "gallery.chapter.03": "الأشكال ومنتج رائد واحد",
  "maison.title": "سبع دور تحت سقف واحد.",
  "maison.eyebrow": "كلٌّ منها علامة مُوقَّعة ومطابقة للهيئة العامة للغذاء والدواء — مخزّنة في الرياض.",
  "maison.skus": "وحدة",
  "maison.flavors": "نكهة",
  "maison.houses": "دور",

  // ThreeHero
  "three.eyebrow": "مختارات غلف فيب",
  "three.title": "ثلاثة منتجات رائدة، ثلاث سرعات بيع.",
  "three.cta.fullCatalog": "الكتالوج الكامل",
  "three.cta.viewProduct": "عرض المنتج",

  // Categories
  "cat.eyebrow": "تسوق حسب النوع",
  "cat.title": "خمس فئات منتجات. كتالوج واحد.",
  "cat.rechargeable": "قابلة للشحن",
  "cat.rechargeable.desc": "أجهزة رائدة قابلة لإعادة التعبئة",
  "cat.disposable": "للاستعمال مرة واحدة",
  "cat.disposable.desc": "أجهزة أحادية الاستخدام",
  "cat.shisha": "نمط الشيشة",
  "cat.shisha.desc": "أجهزة بصيغة المعسل",
  "cat.podkit": "أنظمة البود",
  "cat.podkit.desc": "أنظمة قابلة لإعادة التعبئة",
  "cat.eliquid": "السوائل الإلكترونية",
  "cat.eliquid.desc": "زجاجات تعبئة 10 مل",

  // Featured spotlight
  "spotlight.eyebrow": "مختار هذا الشهر",
  "spotlight.title": "المنتج الرائد الأكثر مبيعاً بالكراتين.",
  "spotlight.cta.spec": "المواصفات الكاملة",
  "spotlight.cta.quote": "اطلب عرض سعر",

  // Brands grid
  "brands.eyebrow": "محفظة الموزع",
  "brands.title": "سبع علامات فيب بجودة المصنع، وشريك تخزين واحد في المملكة.",
  "brands.body": "كل علامة أدناه خط موقّع ومخزّن في الرياض وقابل للشحن لدول الخليج.",
  "brands.openCatalog": "افتح كتالوج العلامة",

  // Top movers
  "top.eyebrow": "الأكثر طلباً · الربع الأول 2026",
  "top.title": "المنتجات الثمانية التي يعيد موزعو السعودية طلبها أولاً.",

  // Why distributors
  "why.eyebrow": "لماذا يختار الموزعون غلف فيب",
  "why.title": "ثلاثة أسباب تجعل المشترين يوافقون من أول مكالمة.",

  // B2B CTA
  "b2b.chip": "جملة · مستودع الرياض الجمركي · المملكة 2-3 أيام",
  "b2b.title": "أمر شراء واحد، سبع علامات، مستودع واحد.",
  "b2b.body": "تشكيلات مخصصة من 50 قطعة لكل منتج. صناديق عينات لتجار التجزئة من 399 ريال. إنتاج بالعلامة الخاصة من 1,000 قطعة، بمهلة 12 أسبوعاً.",
  "b2b.cta.portal": "افتح بوابة الجملة",
  "b2b.cta.sample": "اطلب صندوق عينات · 399 ريال",

  // Newsletter
  "news.eyebrow": "النشرة البريدية",
  "news.title.1": "إصدار ربع سنوي.",
  "news.title.2": "منتجات جديدة.",
  "news.title.3": "أسعار الموزعين.",
  "news.body": "بريد واحد كل ربع سنة. بلا إزعاج. إلغاء الاشتراك بنقرة واحدة. لا نشارك عنوانك أبداً.",
  "news.placeholder": "buyer@yourtrading.sa",
  "news.cta.subscribe": "اشترك",
  "news.cta.subscribed": "تم الاشتراك ✓",
  "news.cta.subscribing": "جارٍ الاشتراك…",

  // Footer
  "footer.section.catalog": "الكتالوج",
  "footer.section.wholesale": "الجملة",
  "footer.section.company": "الشركة",
  "footer.tagline": "موزع جملة في السعودية للجيل الجديد من علامات الفيب. مستودع جمركي في الرياض، توصيل خلال 2-3 أيام داخل المملكة، وأمر شراء واحد عبر سبعة خطوط تصنيع.",
  "footer.partner.title": "شريك التخزين في الرياض",
  "footer.legal.terms": "الشروط",
  "footer.legal.privacy": "الخصوصية",
  "footer.legal.cookies": "ملفات الارتباط",
  "footer.payment": "الدفع",
  "footer.disclaimer": "جملة فقط · +18",

  "hero.marquee1": "السعودية · جملة · موزّع · ٧ علامات",
  "hero.marquee2": "السعودية ٢-٣ أيام · مستودع الرياض · أسعار متدرجة",
};

export const DICTIONARY: Record<Locale, Dict> = { en, ar };

/** Look up a translation key. Falls back to English, then to the key itself. */
export function translate(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  let raw = DICTIONARY[locale]?.[key];
  if (raw === undefined) raw = DICTIONARY.en[key];
  if (raw === undefined) raw = key;
  if (vars) {
    raw = raw.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`));
  }
  return raw;
}
