import { ArrowDownRight, ArrowUpRight, Info, Minus } from "lucide-react";

import { formatDuration, formatInteger, formatPercent } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Kpi } from "@/types/analytics";

function formatValue(kpi: Kpi): string {
  if (kpi.unit === "seconds") return formatDuration(kpi.value);
  if (kpi.unit === "percent") return formatPercent(kpi.value);
  return formatInteger(kpi.value);
}

type Delta = { text: string; direction: "up" | "down" | "flat"; isGood: boolean | null };

/** Percentual usa pontos percentuais (p.p.); contagens e tempos usam variação relativa (%). */
function computeDelta(kpi: Kpi): Delta {
  const diff =
    kpi.unit === "percent"
      ? kpi.value - kpi.previousValue
      : kpi.previousValue === 0
        ? 0
        : ((kpi.value - kpi.previousValue) / kpi.previousValue) * 100;
  const rounded = Math.round(diff * 10) / 10;
  if (rounded === 0) return { text: "sem variação", direction: "flat", isGood: null };

  const direction = rounded > 0 ? "up" : "down";
  const magnitude = Math.abs(rounded).toLocaleString("pt-BR", { minimumFractionDigits: 1 });
  const sign = rounded > 0 ? "+" : "−";
  const text = kpi.unit === "percent" ? `${sign}${magnitude} p.p.` : `${sign}${magnitude}%`;
  const isGood = (direction === "up") === (kpi.polarity === "higher-is-better");
  return { text, direction, isGood };
}

type StatTileProps = {
  kpi: Kpi;
  comparisonLabel: string;
};

export function StatTile({ kpi, comparisonLabel }: StatTileProps) {
  const delta = computeDelta(kpi);
  const DeltaIcon =
    delta.direction === "up" ? ArrowUpRight : delta.direction === "down" ? ArrowDownRight : Minus;
  const definitionId = `kpi-${kpi.id}-definition`;

  return (
    <section
      aria-labelledby={`kpi-${kpi.id}-label`}
      className="flex flex-col gap-3 rounded-(--radius-card) border bg-surface p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 id={`kpi-${kpi.id}-label`} className="text-sm text-muted-foreground">
          {kpi.label}
        </h2>
        <span
          title={kpi.definition}
          className="text-muted-foreground"
          aria-describedby={definitionId}
        >
          <Info className="size-4" aria-hidden="true" />
          <span id={definitionId} className="sr-only">
            {kpi.definition}
          </span>
        </span>
      </div>

      <p className="text-3xl font-semibold tracking-tight">{formatValue(kpi)}</p>

      <p className="flex flex-wrap items-center gap-x-1.5 text-xs">
        <span
          className={cn(
            "inline-flex items-center gap-0.5 font-medium",
            delta.isGood === null
              ? "text-muted-foreground"
              : delta.isGood
                ? "text-success"
                : "text-danger",
          )}
        >
          <DeltaIcon className="size-3.5" aria-hidden="true" />
          {delta.text}
          {delta.isGood !== null ? (
            <span className="sr-only">{delta.isGood ? "(melhora)" : "(piora)"}</span>
          ) : null}
        </span>
        <span className="text-muted-foreground">{comparisonLabel}</span>
      </p>
    </section>
  );
}
