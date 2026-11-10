import { clamp } from "@/features/dashboard/chartScale";
import { cn } from "@/lib/utils/cn";

type TooltipRow = {
  label: string;
  value: string;
  /** Classe de cor do traço-chave da série (ex.: "bg-chart-accent"). */
  keyClassName: string;
};

type ChartTooltipProps = {
  /** Posição X do ponto, em pixels, relativa ao contêiner do gráfico. */
  x: number;
  containerWidth: number;
  title: string;
  rows: TooltipRow[];
};

const TOOLTIP_WIDTH = 168;

/** Tooltip: valor em destaque, nome da série secundário, chave em traço (não caixa). */
export function ChartTooltip({ x, containerWidth, title, rows }: ChartTooltipProps) {
  const left = clamp(x - TOOLTIP_WIDTH / 2, 0, Math.max(0, containerWidth - TOOLTIP_WIDTH));
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 z-10 rounded-lg border bg-surface px-3 py-2 text-xs shadow-md"
      style={{ left, width: TOOLTIP_WIDTH }}
    >
      <p className="text-muted-foreground">{title}</p>
      {rows.map((row) => (
        <p key={row.label} className="mt-1 flex items-center gap-2">
          <span className={cn("h-0.5 w-3 shrink-0 rounded-full", row.keyClassName)} />
          <span className="font-semibold text-foreground tabular-nums">{row.value}</span>
          <span className="truncate text-muted-foreground">{row.label}</span>
        </p>
      ))}
    </div>
  );
}
