import { Hero } from "@/components/site/Hero";
import { NeonSweep } from "@/components/site/NeonSweep";
import { ProductFilmstrip } from "@/components/site/ProductFilmstrip";
import { SkylineDivider } from "@/components/site/SkylineDivider";
import { Categories } from "@/components/site/Categories";
import { FeaturedSpotlight } from "@/components/site/FeaturedSpotlight";
import { BrandsGrid } from "@/components/site/BrandsGrid";
import { B2BCta } from "@/components/site/B2BCta";
import { Newsletter } from "@/components/site/Newsletter";

/**
 * Dubai homepage — "Neon Editorial Night".
 *
 * Deliberately different from the sister sites (no spinning ring, no giant
 * marquee strips): editorial hero → neon sweep stats → product filmstrip
 * (horizontal) → Dubai skyline anchor → catalog sections → CTA.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <NeonSweep />
      <ProductFilmstrip />
      <SkylineDivider />
      <BrandsGrid />
      <Categories />
      <FeaturedSpotlight />
      <B2BCta />
      <Newsletter />
    </>
  );
}
