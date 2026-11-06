"use client";

import * as React from "react";
import { COUNTRIES } from "@/lib/i18n";
import { useCountry } from "@/lib/country-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlobeIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export function CountrySelector({ className }: { className?: string }) {
  const { country, setCountry } = useCountry();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 gap-2 rounded-full border border-border/60 px-3 text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground",
            className
          )}
          aria-label={`Country: ${country.name}`}
        >
          <GlobeIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{country.flag}</span>
          <span className="font-mono text-[10px] tracking-[0.18em]">{country.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Ship to</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {COUNTRIES.map((c) => (
          <DropdownMenuItem
            key={c.code}
            onSelect={() => setCountry(c.code)}
            className={cn(
              "flex items-start gap-3 py-2",
              c.code === country.code && "bg-card"
            )}
          >
            <span aria-hidden className="mt-0.5 text-base leading-none">
              {c.flag}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">{c.name}</span>
                <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
                  {c.code}
                </span>
              </div>
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">
                {c.currency}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
