"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogoLockup, MenuIcon, SearchIcon, ArrowRightIcon } from "@/components/icons";
import { CountrySelector } from "./CountrySelector";
import { LocaleSelector } from "./LocaleSelector";
import { BRAND_INDEX } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";

export function Header() {
  const [scrolled, setScrolled] = React.useState(false);
  const { t } = useLocale();
  const NAV = [
    { label: t("nav.brands"), href: "/brands" },
    { label: t("nav.catalog"), href: "/products" },
    { label: t("nav.wholesale"), href: "/wholesale" },
    { label: t("nav.about"), href: "/about" },
  ];

  React.useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 16);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-300",
        scrolled
          ? "border-b border-border/60 bg-background/85 backdrop-blur-xl"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0" aria-label="EuroVape Supply home">
          <LogoLockup />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Open brands menu"
              >
                {t("nav.brands")}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                  <path d="m2 4 3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="grid w-[480px] grid-cols-2 gap-1 p-3">
              {BRAND_INDEX.map((b) => (
                <Link
                  key={b.id}
                  href={`/brands/${b.slug}`}
                  className="group flex items-start gap-2 rounded-md p-2 transition-colors hover:bg-card"
                >
                  <span className="font-display text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                    {b.name}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">{b.product_count} SKUs</span>
                </Link>
              ))}
              <Link
                href="/brands"
                className="col-span-2 mt-2 flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm text-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                <span>{t("nav.viewAll")}</span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>

          {NAV.slice(1).map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            aria-label={t("nav.search")}
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            <SearchIcon className="h-4 w-4" />
          </button>

          <LocaleSelector />
          <CountrySelector />

          <Button asChild size="sm" className="hidden h-9 rounded-full px-4 sm:inline-flex">
            <Link href="/wholesale">
              {t("nav.cta.buyWholesale")}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label={t("nav.openMenu")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:text-foreground lg:hidden"
              >
                <MenuIcon className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-md bg-card/95 backdrop-blur-xl">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <LogoLockup />
                </SheetTitle>
              </SheetHeader>

              <nav className="mt-8 flex flex-col gap-1">
                <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {t("nav.navigate")}
                </p>
                {NAV.map((n) => (
                  <SheetClose asChild key={n.href}>
                    <Link
                      href={n.href}
                      className="rounded-md px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-background"
                    >
                      {n.label}
                    </Link>
                  </SheetClose>
                ))}

                <p className="mt-6 px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {t("nav.brands")}
                </p>
                {BRAND_INDEX.map((b) => (
                  <SheetClose asChild key={b.id}>
                    <Link
                      href={`/brands/${b.slug}`}
                      className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                    >
                      <span>{b.name}</span>
                      <span className="text-xs">{b.product_count}</span>
                    </Link>
                  </SheetClose>
                ))}
              </nav>

              <SheetClose asChild>
                <Button asChild size="lg" className="mt-8 w-full rounded-full">
                  <Link href="/wholesale">{t("nav.cta.buyWholesale")}</Link>
                </Button>
              </SheetClose>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
