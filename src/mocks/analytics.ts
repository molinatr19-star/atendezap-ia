import { DAY_MS, localWeekday, MINUTE_MS, startOfLocalDay } from "@/lib/utils/time";

import { createRandom, pickWeighted } from "./random";

/**
 * Histórico fictício de atendimentos encerrados, usado pelo seed.
 * Gera 180 dias para permitir comparar até 90 dias com os 90 anteriores.
 */
export type SeedAttendance = {
  startedAt: number;
  resolvedAt: number;
  resolvedBy: "ai" | "human";
  firstResponseSeconds: number;
  leadCreated: boolean;
};

const HISTORY_DAYS = 180;

/** Peso relativo de conversas iniciadas em cada hora do dia (pico comercial e pós-almoço). */
const HOURLY_WEIGHTS = [
  1, 0.5, 0.3, 0.2, 0.2, 0.4, 1, 2.5, 5, 8, 9, 8.5, 6, 6.5, 8, 8.5, 8, 7, 6, 5.5, 5, 4, 3, 1.8,
] as const;

/** Fator por dia da semana (domingo a sábado). */
const WEEKDAY_FACTOR = [0.45, 1, 1.05, 1, 1.05, 0.95, 0.6] as const;

function isBusinessHour(hour: number): boolean {
  return hour >= 8 && hour < 19;
}

/** Determinístico (semente fixa); só o ponto de referência `now` muda. */
export function generateAttendanceHistory(now: number): SeedAttendance[] {
  const random = createRandom(20261110);
  const today = startOfLocalDay(now);
  const records: SeedAttendance[] = [];

  for (let daysAgo = HISTORY_DAYS - 1; daysAgo >= 0; daysAgo--) {
    const dayStart = today - daysAgo * DAY_MS;
    // 0 no dia mais antigo, 1 hoje: simula crescimento e IA melhorando ao longo do tempo.
    const progress = 1 - daysAgo / (HISTORY_DAYS - 1);
    const expected = (30 + progress * 14) * WEEKDAY_FACTOR[localWeekday(dayStart)];
    const count = Math.round(expected * (0.85 + random() * 0.3));

    for (let index = 0; index < count; index++) {
      const hour = pickWeighted(HOURLY_WEIGHTS, random);
      const startedAt = dayStart + hour * 60 * MINUTE_MS + Math.floor(random() * 60) * MINUTE_MS;

      const aiChance = isBusinessHour(hour) ? 0.48 + progress * 0.14 : 0.86;
      const resolvedBy = random() < aiChance ? "ai" : "human";
      const firstResponseSeconds =
        resolvedBy === "ai"
          ? 4 + random() * 14
          : isBusinessHour(hour)
            ? 70 + random() * 420
            : 900 + random() * 2700;
      const durationMinutes = resolvedBy === "ai" ? 3 + random() * 15 : 10 + random() * 80;
      const leadCreated = random() < 0.22 + progress * 0.06;

      // Só entram atendimentos já encerrados até o momento do seed.
      const resolvedAt = startedAt + durationMinutes * MINUTE_MS;
      if (resolvedAt >= now) continue;

      records.push({
        startedAt,
        resolvedAt,
        resolvedBy,
        firstResponseSeconds: Math.round(firstResponseSeconds),
        leadCreated,
      });
    }
  }

  return records;
}
