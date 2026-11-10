import { describe, expect, it } from "vitest";

import { localDayKey, localHour, localWeekday, startOfLocalDay } from "./time";

// 10/11/2026 01:30 em São Paulo = 04:30 UTC (perto da virada do dia: onde erros de fuso aparecem).
const EARLY_MORNING = Date.parse("2026-11-10T04:30:00.000Z");

describe("tempo em São Paulo", () => {
  it("início do dia local", () => {
    expect(new Date(startOfLocalDay(EARLY_MORNING)).toISOString()).toBe("2026-11-10T03:00:00.000Z");
  });

  it("hora e data locais, não UTC", () => {
    expect(localHour(EARLY_MORNING)).toBe(1);
    expect(localDayKey(EARLY_MORNING)).toBe("2026-11-10");
    // 02:00 UTC ainda é dia 09 em São Paulo.
    expect(localDayKey(Date.parse("2026-11-10T02:00:00.000Z"))).toBe("2026-11-09");
  });

  it("dia da semana local (10/11/2026 é terça)", () => {
    expect(localWeekday(EARLY_MORNING)).toBe(2);
  });
});
