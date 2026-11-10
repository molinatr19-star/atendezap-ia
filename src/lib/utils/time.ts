/** Utilitários de tempo no fuso de São Paulo (usados por métricas, seed e interface). */
export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

/** America/Sao_Paulo não tem horário de verão desde 2019: deslocamento fixo de -3 h. */
const SAO_PAULO_OFFSET_MS = -3 * HOUR_MS;

function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

/** Início do dia (00:00 em São Paulo) que contém o instante informado. */
export function startOfLocalDay(ms: number): number {
  const local = ms + SAO_PAULO_OFFSET_MS;
  return local - mod(local, DAY_MS) - SAO_PAULO_OFFSET_MS;
}

/** Hora local (0–23) em São Paulo. */
export function localHour(ms: number): number {
  return Math.floor(mod(ms + SAO_PAULO_OFFSET_MS, DAY_MS) / HOUR_MS);
}

/** Data local AAAA-MM-DD em São Paulo. */
export function localDayKey(ms: number): string {
  return new Date(ms + SAO_PAULO_OFFSET_MS).toISOString().slice(0, 10);
}

/** Dia da semana local (0 = domingo). */
export function localWeekday(ms: number): number {
  return new Date(ms + SAO_PAULO_OFFSET_MS).getUTCDay();
}
