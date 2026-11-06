/**
 * Real bilingual (EN / AR) legal boilerplate for the wholesale site.
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
      { h: "Retention", p: "Inquiry and order records are retained for the duration of the business relationship plus the period required by UAE tax and commercial record-keeping law, then deleted or anonymised." },
      { h: "Your rights", p: "You may request access to, correction of, or deletion of your data by emailing " + EMAIL + ". If you are in a jurisdiction with a data-protection authority, you may complain to that authority." },
      { h: "Applicable data law", p: "We process personal data in line with UAE Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data (PDPL) and its Executive Regulation. Complaints may be directed to the UAE Data Office." },
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
      { h: "Conformity & excise", p: "Products conform with UAE standards (ESMA) where applicable. E-cigarette and nicotine products attract UAE Federal Excise Tax; the buyer is responsible for any excise, VAT, and licensing duties in the destination market." },
      { h: "Governing law", p: `These terms are governed by the laws of ${JURISDICTION}. Disputes are resolved in the competent courts of that jurisdiction, except where mandatory local law requires otherwise.` },
    ],
  },
  cookies: {
    title: "Cookie policy",
    intro: `${BRAND} uses a minimal set of cookies and local storage to run the site. We do not run third-party advertising trackers.`,
    effective: `Effective: January ${new Date().getFullYear()}.`,
    sections: [
      { h: "Strictly necessary", p: "A preference store records your selected language and country so the site loads in the right locale on your next visit. These are required for the site to function and cannot be disabled from within the site." },
      { h: "Statistics", p: "We use privacy-respecting analytics to understand aggregate traffic. Where a cookie is used for this, it stores only an anonymised identifier." },
      { h: "Forms", p: "When you submit the wholesale inquiry or sample-box form, the details you enter are sent to our sales inbox. No payment-card data is ever collected or stored by this site." },
      { h: "Managing cookies", p: "You can clear cookies and local storage from your browser settings at any time; the site will then revert to its default language." },
    ],
  },
};

const ar: Record<LegalDoc, Doc> = {
  privacy: {
    title: "سياسة الخصوصية",
    intro: `${BRAND} مورّد جملة للأعمال (B2B). توضّح هذه السياسة بيانات الأعمال التي نجمعها من المشترين وكيفية استخدامها. لا نبيع للمستهلكين ولا نجمع عن قصد بيانات شخصية لأفراد دون سن 18 عاماً.`,
    effective: `التاريخ: يناير ${new Date().getFullYear()}.`,
    sections: [
      { h: "البيانات التي نجمعها", p: "بيانات التواصل والشركة التي تُدخلها عبر نموذج الاستفسار الجملة أو طلب صندوق العينات (الاسم، البريد المهني، الهاتف، الشركة، الدولة، حجم الطلب المتوقع)، وسجلّات الخادم القياسية (عنوان IP، المتصفح، الصفحات المُزارة) اللازمة لتشغيل الموقع وحمايته." },
      { h: "سبب معالجتها", p: "للرد على استفسارك، وإعداد عرض سعر، وتنفيذ الطلبات، وحفظ سجلّ العلاقة التجارية. الأساس القانوني هو تنفيذ العقد ومصلحتنا المشروعة في تشغيل عمل الجملة." },
      { h: "المشاركة", p: "نشارك البيانات فقط مع الأطراف اللازمة لتنفيذ طلبك: شريك اللوجستيات (عنوان الشحن)، ومزوّد خدمة الدفع، ومزوّد الاستضافة/شبكة التوزيع. بالإضافة إلى ذلك، تُعالَج البيانات المُرسلة من نموذج الاستفسار الجملة وطلب العينات عبر مزوّدَي خدمة يعملانان بتعليماتنا: Resend (إرسال بريد معاملات يحتوي بيانات طلبك إلى صندوق مبيعاتنا) و Feishu / Lark Bitable (نظام إدارة العمليات لدينا، حيث يُخزَّن استفسارك لمتابعة المبيعات — تُخزِّن Lark هذه السجلات على خوادم داخل جمهورية الصين الشعبية، لذا فإن إرسال النموذج يعني انتقال بيانات التواصل الخاصة بعملك ومعالجتها هناك). لا نبيع بياناتك ولا نؤجّرها." },
      { h: "الاحتفاظ", p: "تُحفظ سجلّات الاستفسار والطلب طوال مدة العلاقة التجارية مضافاً إليها المدة التي تفرضها قوانين الضرائب وحفظ السجلّات التجارية في الإمارات، ثم تُحذف أو تُؤخذ منها الهوية." },
      { h: "حقوقك", p: `يمكنك طلب الاطلاع على بياناتك أو تصحيحها أو حذفها بالبريد إلى ${EMAIL}. وإذا كنت في ولاية تتمتع بجهة لحماية البيانات، فيحق لك التقديم بشكوى أمامها.` },
      { h: "قانون البيانات", p: "نُعالج البيانات الشخصية وفق المرسوم الاتحادي رقم 45 لسنة 2021 بشأن حماية البيانات الشخصية (الإمارات) ولائحته التنفيذية. ويمكن توجيه الشكاوى إلى مكتب حماية البيانات الإماراتي." },
    ],
  },
  terms: {
    title: "الشروط والأحكام",
    intro: `تحكم هذه الشروط عمليات شراء الجملة (B2B) من ${BRAND}. بإرسالك استفساراً أو أمر شراء فإنك تقبلها. البيع للمؤسّسات المُسجّلة فقط؛ لا نبيع للمستهلكين.`,
    effective: `التاريخ: يناير ${new Date().getFullYear()}.`,
    sections: [
      { h: "جملة فقط · +18", p: "تُباع جميع المنتجات بين الأعمال للموزّعين وتجار التجزئة المرخّصين. المخزون مخصّص لمن هم فوق 18 عاماً. والمشتري مسؤول عن الالتزام بقواعد الاستيراد والضريبة وتقييد العمر في سوق الوجهة." },
      { h: "عروض الأسعار والتسعير", p: "تُحدَّد الأسعار بالدرهم (أو العملة المتفق عليها) خارج المستودع وتبقى سارية 30 يوماً ما لم يُذكر غير ذلك. ويعتبر عرض السعر المكتوب نافذاً بدلاً من أي سعر استرشادي يظهر على الموقع. وتُطبَّق كميات طلب أدنى لكل منتج." },
      { h: "الدفع", p: "تدفع الحسابات الجديدة عربوناً على المنتجات المخصّصة للإنتاج والعلامات الخاصة؛ وقد تُمنح الحسابات المتكررة شروط ائتمان بتقديرنا. وتنتقل ملكية البضائع عند السداد الكامل، وينتقل الخطر عند تسليم البضاعة إلى الناقل." },
      { h: "التوصيل", p: "تُشحن البضائع من مستودعنا في جبل علي وفق المُدد المُحدَّدة في عرض السعر. ومُدد التوصيل تقديرية وغير مضمونة. ويجب على المشتري فحص البضائع عند الوصول والإبلاغ عن أي نقص أو تلف خلال 7 أيام." },
      { h: "الإرجاع", p: "نظراً لأنها منتجات خاضعة لتنظيم، يُقبل الإرجاع فقط لعيوب تصنيع مؤكَّدة يُبلَّغ عنها خلال نافذة الفحص، وتتم المعالجة بالاستبدال أو رصيد دائن وفق خيارنا." },
      { h: "المطابقة والضريبة الانتقائية", p: "تتوافق المنتجات مع معايير هيئة المواصفات والمقاييس (ESMA) حيثما ينطبق. وتخضع منتجات السجائر الإلكترونية والنيكوتين للضريبة الاتحادية الانتقائية، والمشتري مسؤول عن أي ضريبة انتقائية أو قيمة مضافة أو تراخيص في سوق الوجهة." },
      { h: "القانون الحاكم", p: `تحكم هذه الشروط قوانين ${JURISDICTION}، وتُفضّ المنازعات أمام المحاكم المختصة في تلك الولاية، إلا حيث يفرض القانون المحلّي الإجرائي خلافاً لذلك.` },
    ],
  },
  cookies: {
    title: "سياسة ملفات تعريف الارتباط",
    intro: `${BRAND} يستخدم مجموعة محدودة من ملفات تعريف الارتباط والتخزين المحلّي لتشغيل الموقع. ولا نشغّل أدوات تتبّع إعلانية لطرف ثالث.`,
    effective: `التاريخ: يناير ${new Date().getFullYear()}.`,
    sections: [
      { h: "ضرورية بحتة", p: "يسجّل مخزن التفضيلات اللغة والدولة التي اخترتها حتى يُحمَّل الموقع بالإعدادات الصحيحة في زيارتك القادمة. وهذه لازمة لعمل الموقع ولا يمكن تعطيلها من داخله." },
      { h: "إحصاءات", p: "نستخدم أدوات تحليل تحترم الخصوصية لفهم حركة الزيارات المُجمَّعة. وعند استخدام ملف تعريف ارتباط لذلك، فإنه يخزّن مُعرّفاً مُؤخذةً منه الهوية فقط." },
      { h: "النماذج", p: "عند إرسال نموذج الاستفسار أو طلب العينة، تُرسَل التفاصيل التي أدخلتها إلى بريد مبيعاتنا. ولا نجمع ولا نخزّن أي بيانات بطاقات دفع على هذا الموقع إطلاقاً." },
      { h: "إدارة الملفات", p: "يمكنك حذف ملفات تعريف الارتباط والتخزين المحلّي من إعدادات متصفحك في أي وقت؛ وسيعود الموقع حينها إلى لغته الافتراضية." },
    ],
  },
};

export function getLegalDoc(doc: LegalDoc, locale: string): Doc {
  return locale === "ar" ? ar[doc] : en[doc];
}
