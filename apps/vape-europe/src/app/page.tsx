import { SpecHero } from "@/components/site/SpecHero";
import { BentoGrid } from "@/components/site/BentoGrid";
import { SpecTable } from "@/components/site/SpecTable";
import { BrandsGrid } from "@/components/site/BrandsGrid";
import { Categories } from "@/components/site/Categories";
import { B2BCta } from "@/components/site/B2BCta";
import { Newsletter } from "@/components/site/Newsletter";

/**
 * Europe homepage — "Engineering Spec / Bento".
 *
 * A numbered TOC spine, an asymmetric bento of operational tiles, and a
 * spec-sheet comparison table — reads as documentation/engineering rather
 * than the neon/gallery sisters.
 */
export default function Home() {
  return (
    <>
      <SpecHero />
      <BentoGrid />
      <SpecTable />
      <BrandsGrid />
      <Categories />
      <B2BCta />
      <Newsletter />
    </>
  );
}
