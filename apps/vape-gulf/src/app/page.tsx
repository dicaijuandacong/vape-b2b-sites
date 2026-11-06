import { GalleryHero } from "@/components/site/GalleryHero";
import { ChapterMark } from "@/components/site/ChapterMark";
import { GoldRule } from "@/components/site/GoldRule";
import { MaisonList } from "@/components/site/MaisonList";
import { PalmRule } from "@/components/site/PalmRule";
import { Categories } from "@/components/site/Categories";
import { FeaturedSpotlight } from "@/components/site/FeaturedSpotlight";
import { B2BCta } from "@/components/site/B2BCta";
import { Newsletter } from "@/components/site/Newsletter";

/**
 * Saudi homepage — "Luxury Gallery / Catalog".
 *
 * Numbered chapters (01/02/03), gold hairlines, a vertical maison roster,
 * and a date-palm motif — reads as a curated luxury catalog rather than
 * the neon/tech sisters.
 */
export default function Home() {
  return (
    <>
      <GalleryHero />

      {/* Chapter 02 — Seven maisons */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <ChapterMark number="02" labelKey="gallery.chapter.02" />
        </div>
      </section>
      <MaisonList />

      <GoldRule />

      {/* Chapter 03 — Categories & spotlight */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <ChapterMark number="03" labelKey="gallery.chapter.03" />
        </div>
      </section>
      <Categories />
      <FeaturedSpotlight />

      <PalmRule />
      <B2BCta />
      <Newsletter />
    </>
  );
}
