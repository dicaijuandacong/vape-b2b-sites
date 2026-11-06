/**
 * Legal boilerplate for the EU wholesale site (English only).
 *
 * NOTE — no Arabic on this site: the EU locale set (en/de/fr/es/it/nl/pl/
 * pt/sv/cs/ro/el) has no "ar", so an Arabic legal block would be dead code.
 * The UAE-facing Arabic text lives in the dubai/gulf site repos instead.
 *
 * This is usable draft text — NOT a substitute for sign-off by a lawyer
 * qualified in the governing-law jurisdiction before public launch.
 * Brand name, jurisdiction and contact are pulled from SITE so the same
 * structure serves any market site.
 */
import { SITE } from "@/lib/site";

export type LegalDoc = "privacy" | "terms" | "cookies";

type Section = { h: string; p: string };
type Doc = { title: string; intro: string; sections: Section[]; effective: string };

const BRAND = SITE.name;
const EMAIL = SITE.email;
const JURISDICTION = SITE.legalJurisdiction;
const WAREHOUSE = SITE.legalWarehouse;
const CCY = SITE.currency;

const en: Record<LegalDoc, Doc> = {
  privacy: {
    title: "Privacy policy",
    intro: `${BRAND} is a B2B wholesale supplier. This policy explains what business data we collect from buyers and how we use it. We do not sell to consumers and do not knowingly collect personal data of individuals under 18.`,
    effective: `Effective: January ${new Date().getFullYear()}.`,
    sections: [
      { h: "Data we collect", p: "Contact and company details you submit via the wholesale inquiry or sample-box forms (name, business email, phone, company, country, intended order volume), and the standard server logs (IP address, browser, pages visited) needed to operate and secure the site." },
      { h: "Why we process it", p: "To respond to your inquiry, prepare a quote, fulfil orders, and maintain a record of the B2B relationship. The lawful basis is contract performance and our legitimate interest in operating a wholesale business." },
      { h: "Sharing", p: "We share data only with the parties needed to fulfil your request: our logistics partner (shipping address), payment processor, and hosting/CDN provider. In addition, submissions from the inquiry and sample-box forms are handled by two service providers acting on our instructions: Resend (transactional e-mail delivery of your submission to our sales inbox) and Feishu / Lark Bitable (our operations CRM, where your inquiry is stored for sales follow-up — Lark stores these records on servers located in mainland China, so submitting a form means your business contact data is transferred to and processed there). We do not sell or rent your data." },
      { h: "Retention", p: "Inquiry and order records are kept for the duration of the business relationship, and beyond that only for as long as the commercial-bookkeeping and tax retention duties of our EU member state of establishment require (GDPR Art. 5(1)(e) storage-limitation principle); they are then deleted or anonymised." },
      { h: "Your rights", p: "You may request access to, correction of, or deletion of your data by emailing " + EMAIL + ". If you are in a jurisdiction with a data-protection authority, you may complain to that authority." },
      { h: "Your GDPR rights", p: "Under the EU General Data Protection Regulation (Regulation (EU) 2016/679) you may access, rectify, erase, restrict, port, and object to processing, and withdraw consent. Legal bases: Art 6(1)(b) to act on your inquiry (contract) and Art 6(1)(f) our legitimate interest in running a wholesale business. You may complain to your national data-protection authority." },
    ],
  },
  terms: {
    title: "Terms & conditions",
    intro: `These terms govern B2B wholesale purchases from ${BRAND}. By submitting an inquiry or purchase order you accept them. Sales are to registered businesses only; we do not sell to consumers.`,
    effective: `Effective: January ${new Date().getFullYear()}.`,
    sections: [
      { h: "Wholesale only · 18+", p: "All products are sold business-to-business to licensed distributors and retailers. Stock is strictly 18+. The buyer is responsible for complying with the import, excise, and age-restriction rules of their destination market." },
      { h: "Quotes and pricing", p: `Prices are quoted in ${CCY} (or as agreed) ex-warehouse and are valid for 30 days unless stated otherwise. A written quote supersedes any indicative price shown on the site. Minimum order quantities apply per SKU.` },
      { h: "Payment", p: "New accounts pay a deposit on production-only and private-label items; repeat accounts may be considered for credit terms at our discretion. Title in the goods passes on full payment; risk passes on handover to the carrier." },
      { h: "Delivery", p: `Shipments are made from ${WAREHOUSE} on the lead times quoted. Delivery times are estimates and are not guaranteed. The buyer must inspect goods on arrival and report shortages or damage within 7 days.` },
      { h: "Returns", p: "Because these are regulated products, returns are accepted only for confirmed manufacturer defects reported within the inspection window, and are handled by replacement or credit at our option." },
      { h: "Regulatory conformity", p: "Products are notified under the EU Tobacco Products Directive (Directive 2014/40/EU) and, for the UK, the MHRA where relevant. The buyer is responsible for VAT, distance-selling, notification, and 18+ age-verification duties in each destination member state." },
      { h: "Governing law", p: `These terms are governed by the laws of ${JURISDICTION}. Disputes are resolved in the competent courts of that jurisdiction, except where mandatory local law requires otherwise.` },
    ],
  },
  cookies: {
    title: "Cookie policy",
    intro: `${BRAND} uses a minimal set of cookies and local storage to run the site. We do not run third-party advertising trackers.`,
    effective: `Effective: January ${new Date().getFullYear()}.`,
    sections: [
      { h: "Strictly necessary", p: "A preference store records your selected language and country so the site loads in the right locale on your next visit. These are required for the site to function and cannot be disabled from within the site." },
      { h: "Statistics", p: "We use privacy-respecting analytics to understand aggregate traffic. Analytics scripts load only after you accept optional cookies in the consent banner; declining means no analytics is loaded. Where a cookie is used for this, it stores only an anonymised identifier." },
      { h: "Forms", p: "When you submit the wholesale inquiry or sample-box form, the details you enter are sent to our sales inbox. No payment-card data is ever collected or stored by this site." },
      { h: "Managing cookies", p: "You can clear cookies and local storage from your browser settings at any time; the site will then revert to its default language." },
    ],
  },
};

export function getLegalDoc(doc: LegalDoc, _locale?: string): Doc {
  // EU site serves 12 European locales, none of them Arabic — English legal
  // text is returned for every locale. The _locale parameter is kept so
  // callers (LegalDoc) stay signature-compatible with the dubai/gulf repos.
  return en[doc];
}
