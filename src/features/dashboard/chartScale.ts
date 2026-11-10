/**
 * Escala "redonda" para o eixo Y: o topo e os intervalos caem em múltiplos de 1, 2 ou 5
 * (ex.: 0 / 20 / 40 / 60), em vez de valores quebrados como 0 / 17 / 34 / 51.
 */
export function niceTicks(maxValue: number, targetCount = 4): number[] {
  if (maxValue <= 0) return [0, 1];
  const rawStep = maxValue / targetCount;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = niceNormalized * magnitude;
  const top = Math.ceil(maxValue / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, index) => index * step);
}

/** Índices de rótulos do eixo X espaçados de forma uniforme, sempre incluindo o último ponto. */
export function evenlySpacedIndices(length: number, maxLabels: number): number[] {
  if (length <= maxLabels) return Array.from({ length }, (_, index) => index);
  const step = Math.ceil((length - 1) / (maxLabels - 1));
  const indices: number[] = [];
  for (let index = length - 1; index >= 0; index -= step) indices.unshift(index);
  return indices;
}

/** Retângulo com cantos de 4 px arredondados só no topo (ponta do dado) e base reta. */
export function topRoundedBarPath(x: number, y: number, width: number, height: number): string {
  if (height <= 0) return "";
  const radius = Math.min(4, width / 2, height);
  const bottom = y + height;
  return [
    `M${x},${bottom}`,
    `V${y + radius}`,
    `Q${x},${y} ${x + radius},${y}`,
    `H${x + width - radius}`,
    `Q${x + width},${y} ${x + width},${y + radius}`,
    `V${bottom}`,
    "Z",
  ].join(" ");
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
