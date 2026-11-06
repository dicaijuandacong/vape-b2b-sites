"use client";

import { useLocale } from "@/lib/i18n/locale-context";
import { LOCALES } from "@/lib/i18n/dictionary";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function LocaleSelector({ className }: { className?: string }) {
  const { locale, setLocale, hydrated } = useLocale();
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 gap-1.5 rounded-full border border-border/60 px-3 text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground",
            className
          )}
          aria-label={`Language: ${current.native}`}
          suppressHydrationWarning
        >
          <span className="font-mono text-[10px] tracking-[0.18em]">
            {hydrated ? current.code.toUpperCase() : "EN"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onSelect={() => setLocale(l.code)}
            className={cn(
              "flex items-center gap-3 py-2",
              l.code === locale && "bg-card"
            )}
          >
            <span aria-hidden className="text-base leading-none">{l.flag}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">{l.native}</div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {l.name}
              </div>
            </div>
            <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
              {l.code.toUpperCase()}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
