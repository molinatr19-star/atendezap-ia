"use client";

import { niceTicks, topRoundedBarPath } from "@/features/dashboard/chartScale";
import { useActiveIndex } from "@/features/dashboard/useActiveIndex";
import { useElementWidth } from "@/hooks/useElementWidth";
import { formatCompact, formatInteger } from "@/lib/utils/format";
import type { HourlyPoint } from "@/types/analytics";

import { ChartDataTable } from "./ChartDataTable";
import { ChartTooltip } from "./ChartTooltip";

const HEIGHT = 220;
const MARGIN = { top: 56, right: 8, bottom: 28, left: 40 };

function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}h`;
}

type HourlyActivityChartProps = {
  points: HourlyPoint[];
};

/** Distribuição por hora do dia: colunas finas (até 24 px) a partir de uma única linha de base. */
export function HourlyActivityChart({ points }: HourlyActivityChartProps) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const { active, setActive, focusProps } = useActiveIndex(points.length);

  const peak = points.reduce(
    (best, point) => (point.conversations > best.conversations ? point : best),
    points[0] ?? { hour: 0, conversations: 0 },
  );
  const ariaLabel = `Atendimentos por hora do dia. Pico às ${hourLabel(peak.hour)}, com ${formatInteger(
    peak.conversations,
  )} atendimentos. Use as setas para percorrer as horas.`;

  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const ticks = niceTicks(Math.max(...points.map((point) => point.conversations), 1));
  const top = ticks[ticks.length - 1];
  const band = points.length > 0 ? innerWidth / points.length : 0;
  const barWidth = Math.min(24, Math.max(2, band - 4));
  const yAt = (value: number) => MARGIN.top + innerHeight * (1 - value / top);
  const bandX = (index: number) => MARGIN.left + index * band;
  const barCenter = (index: number) => bandX(index) + band / 2;
  const labelEvery = width < 480 ? 6 : 3;

  const activePoint = active !== null ? points[active] : undefined;

  return (
    <div>
      <div
        ref={ref}
        role="group"
        aria-label={ariaLabel}
        className="relative rounded-lg"
        style={{ height: HEIGHT }}
        {...focusProps}
      >
        {width > 0 ? (
          <svg width={width} height={HEIGHT} aria-hidden="true">
            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={MARGIN.left}
                  x2={width - MARGIN.right}
                  y1={yAt(tick)}
                  y2={yAt(tick)}
                  className={tick === 0 ? "stroke-chart-baseline" : "stroke-chart-grid"}
                  strokeWidth={1}
                  shapeRendering="crispEdges"
                />
                <text
                  x={MARGIN.left - 8}
                  y={yAt(tick)}
                  dy="0.32em"
                  textAnchor="end"
                  className="fill-muted-foreground text-[11px] tabular-nums"
                >
                  {formatCompact(tick)}
                </text>
              </g>
            ))}

            {points.map((point, index) => {
              const y = yAt(point.conversations);
              const isActive = active === index;
              return (
                <g key={point.hour}>
                  <path
                    d={topRoundedBarPath(
                      barCenter(index) - barWidth / 2,
                      y,
                      barWidth,
                      MARGIN.top + innerHeight - y,
                    )}
                    className="fill-chart-accent transition-opacity"
                    opacity={active === null || isActive ? 1 : 0.45}
                  />
                  {index % labelEvery === 0 ? (
                    <text
                      x={barCenter(index)}
                      y={HEIGHT - 8}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[11px] tabular-nums"
                    >
                      {hourLabel(point.hour)}
                    </text>
                  ) : null}
                  {/* A faixa inteira é a área de captura, não só os pixels da coluna. */}
                  <rect
                    x={bandX(index)}
                    y={MARGIN.top}
                    width={band}
                    height={innerHeight}
                    fill="transparent"
                    onPointerEnter={() => setActive(index)}
                    onPointerDown={() => setActive(index)}
                    onPointerLeave={() => setActive(null)}
                  />
                </g>
              );
            })}
          </svg>
        ) : null}

        {activePoint && active !== null ? (
          <ChartTooltip
            x={barCenter(active)}
            containerWidth={width}
            title={`${hourLabel(activePoint.hour)} às ${hourLabel((activePoint.hour + 1) % 24)}`}
            rows={[
              {
                label: "atendimentos",
                value: formatInteger(activePoint.conversations),
                keyClassName: "bg-chart-accent",
              },
            ]}
          />
        ) : null}

        <p className="sr-only" aria-live="polite">
          {activePoint
            ? `${hourLabel(activePoint.hour)}: ${formatInteger(activePoint.conversations)} atendimentos`
            : ""}
        </p>
      </div>

      <ChartDataTable
        caption="Atendimentos por hora do dia"
        columns={["Hora", "Atendimentos"]}
        rows={points.map((point) => [hourLabel(point.hour), formatInteger(point.conversations)])}
      />
    </div>
  );
}
