import { formatInteger, formatPercent } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { AttendanceSplit } from "@/types/analytics";

type AttendanceSplitCardProps = {
  split: AttendanceSplit;
};

/**
 * Parte-de-um-todo com 2 partes: barra segmentada fina (sem texto) acima de uma lista que já traz
 * nome, quantidade e percentual de cada parte. A cor nunca é o único canal de identificação.
 */
export function AttendanceSplitCard({ split }: AttendanceSplitCardProps) {
  const total = split.ai + split.human;
  const parts = [
    { key: "ai", label: "Resolvidas pela IA", value: split.ai, colorClassName: "bg-chart-1" },
    {
      key: "human",
      label: "Atendidas pela equipe",
      value: split.human,
      colorClassName: "bg-chart-2",
    },
  ].map((part) => ({ ...part, share: total > 0 ? (part.value / total) * 100 : 0 }));

  const ariaLabel = parts
    .map((part) => `${part.label}: ${formatInteger(part.value)} (${formatPercent(part.share)})`)
    .join("; ");

  return (
    <div className="flex flex-col gap-5">
      <div role="img" aria-label={ariaLabel} className="flex h-2 w-full gap-0.5">
        {parts.map((part) =>
          part.value > 0 ? (
            <span
              key={part.key}
              className={cn("h-full rounded-full", part.colorClassName)}
              style={{ width: `${part.share}%` }}
            />
          ) : null,
        )}
      </div>

      <ul className="flex flex-col gap-3">
        {parts.map((part) => (
          <li key={part.key} className="flex items-center gap-3 text-sm">
            <span
              className={cn("size-2.5 shrink-0 rounded-sm", part.colorClassName)}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{part.label}</span>
            <span className="font-semibold tabular-nums">{formatInteger(part.value)}</span>
            <span className="w-14 text-right text-muted-foreground tabular-nums">
              {formatPercent(part.share)}
            </span>
          </li>
        ))}
      </ul>

      <p className="border-t pt-4 text-xs text-muted-foreground">
        Total de {formatInteger(total)} atendimentos encerrados no período.
      </p>
    </div>
  );
}
