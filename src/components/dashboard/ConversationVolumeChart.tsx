"use client";

import type { PointerEvent } from "react";

import { evenlySpacedIndices, niceTicks } from "@/features/dashboard/chartScale";
import { useActiveIndex } from "@/features/dashboard/useActiveIndex";
import { useElementWidth } from "@/hooks/useElementWidth";
import { formatCompact, formatDayKey, formatDayKeyShort, formatInteger } from "@/lib/utils/format";
import type { DailyPoint } from "@/types/analytics";

import { ChartDataTable } from "./ChartDataTable";
import { ChartTooltip } from "./ChartTooltip";

const HEIGHT = 240;
const MARGIN = { top: 56, right: 16, bottom: 28, left: 40 };

type ConversationVolumeChartProps = {
  points: DailyPoint[];
};

/** Série única ao longo do tempo: área com linha de 2 px, crosshair e tooltip. */
export function ConversationVolumeChart({ points }: ConversationVolumeChartProps) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const { active, setActive, focusProps } = useActiveIndex(points.length);

  const total = points.reduce((sum, point) => sum + point.conversations, 0);
  const last = points.at(-1);
  const ariaLabel = `Atendimentos por dia: ${formatInteger(total)} no período${
    last ? `, ${formatInteger(last.conversations)} hoje` : ""
  }. Use as setas para percorrer os dias.`;

  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const ticks = niceTicks(Math.max(...points.map((point) => point.conversations), 1));
  const top = ticks[ticks.length - 1];
  const stepX = points.length > 1 ? innerWidth / (points.length - 1) : 0;
  const xAt = (index: number) => MARGIN.left + index * stepX;
  const yAt = (value: number) => MARGIN.top + innerHeight * (1 - value / top);
  const baseline = MARGIN.top + innerHeight;

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${xAt(index)},${yAt(point.conversations)}`)
    .join(" ");
  const areaPath = `${linePath} L${xAt(points.length - 1)},${baseline} L${xAt(0)},${baseline} Z`;
  const labelIndices = evenlySpacedIndices(points.length, width < 480 ? 4 : 7);

  const handlePointer = (event: PointerEvent<SVGRectElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const index = Math.round((event.clientX - bounds.left) / (stepX || 1));
    setActive(Math.min(Math.max(index, 0), points.length - 1));
  };

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
          <svg width={width} height={HEIGHT} aria-hidden="true" className="overflow-visible">
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

            {labelIndices.map((index) => (
              <text
                key={points[index].day}
                x={xAt(index)}
                y={HEIGHT - 8}
                textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}
                className="fill-muted-foreground text-[11px] tabular-nums"
              >
                {formatDayKeyShort(points[index].day)}
              </text>
            ))}

            <path d={areaPath} className="fill-chart-accent" fillOpacity={0.1} />
            <path
              d={linePath}
              fill="none"
              className="stroke-chart-accent"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {activePoint && active !== null ? (
              <g>
                <line
                  x1={xAt(active)}
                  x2={xAt(active)}
                  y1={MARGIN.top}
                  y2={baseline}
                  className="stroke-chart-baseline"
                  strokeWidth={1}
                />
                <circle
                  cx={xAt(active)}
                  cy={yAt(activePoint.conversations)}
                  r={4}
                  className="fill-chart-accent stroke-surface"
                  strokeWidth={2}
                />
              </g>
            ) : last ? (
              <circle
                cx={xAt(points.length - 1)}
                cy={yAt(last.conversations)}
                r={4}
                className="fill-chart-accent stroke-surface"
                strokeWidth={2}
              />
            ) : null}

            {/* Área de captura maior que a linha: o leitor mira a data, não o traço de 2 px. */}
            <rect
              x={MARGIN.left}
              y={0}
              width={innerWidth}
              height={HEIGHT}
              fill="transparent"
              onPointerMove={handlePointer}
              onPointerDown={handlePointer}
              onPointerLeave={() => setActive(null)}
            />
          </svg>
        ) : null}

        {activePoint && active !== null ? (
          <ChartTooltip
            x={xAt(active)}
            containerWidth={width}
            title={formatDayKey(activePoint.day)}
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
            ? `${formatDayKey(activePoint.day)}: ${formatInteger(activePoint.conversations)} atendimentos`
            : ""}
        </p>
      </div>

      <ChartDataTable
        caption="Atendimentos por dia"
        columns={["Dia", "Atendimentos"]}
        rows={points.map((point) => [formatDayKey(point.day), formatInteger(point.conversations)])}
      />
    </div>
  );
}
