import type { Metadata } from "next";
import { LegalDoc } from "@/components/site/LegalDoc";

export const metadata: Metadata = { title: "Cookies" };

export default function CookiesPage() {
  return <LegalDoc doc="cookies" />;
}
