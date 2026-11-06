import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="pt-32 sm:pt-40">
      <section className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-muted-foreground">404 · not found</p>
        <h1 className="mt-4 font-display text-6xl font-semibold tracking-tight">
          We couldn&apos;t locate that SKU.
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          The catalog moves. Some country rule sets restrict pages from view. Try the brand list or our wholesale portal.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild size="lg"><Link href="/brands">Browse brands<ArrowRightIcon /></Link></Button>
          <Button asChild variant="outline" size="lg"><Link href="/wholesale">Wholesale</Link></Button>
        </div>
      </section>
    </div>
  );
}
