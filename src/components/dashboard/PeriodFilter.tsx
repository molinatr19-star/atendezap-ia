import Link from "next/link";

import { PERIOD_OPTIONS } from "@/features/dashboard/period";
import { cn } from "@/lib/utils/cn";
import type { PeriodKey } from "@/types/analytics";

type PeriodFilterProps = {
  value: PeriodKey;
};

/**
 * Filtro de período por links (?periodo=7d): funciona sem JavaScript, fica no histórico
 * do navegador e gera URLs compartilháveis.
 */
export function PeriodFilter({ value }: PeriodFilterProps) {
  return (
    <nav aria-label="Período" className="inline-flex rounded-lg border bg-surface p-1">
      {PERIOD_OPTIONS.map((option) => {
        const selected = option.key === value;
        return (
          <Link
            key={option.key}
            href={`/dashboard?periodo=${option.key}`}
            scroll={false}
            aria-current={selected ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              selected
                ? "bg-primary-soft text-primary-soft-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </nav>
  );
}
