import { z } from "zod";

import type { PeriodKey } from "@/types/analytics";

export const PERIOD_OPTIONS: readonly { key: PeriodKey; days: number; label: string }[] = [
  { key: "7d", days: 7, label: "7 dias" },
  { key: "30d", days: 30, label: "30 dias" },
  { key: "90d", days: 90, label: "90 dias" },
];

export const DEFAULT_PERIOD: PeriodKey = "30d";

/** Valor inválido ou ausente na URL cai no período padrão, sem erro para o usuário. */
const periodSchema = z.enum(["7d", "30d", "90d"]).catch(DEFAULT_PERIOD);

export function parsePeriod(raw: string | string[] | undefined): PeriodKey {
  return periodSchema.parse(Array.isArray(raw) ? raw[0] : raw);
}

export function periodDays(period: PeriodKey): number {
  const option = PERIOD_OPTIONS.find((entry) => entry.key === period);
  return option ? option.days : 30;
}
