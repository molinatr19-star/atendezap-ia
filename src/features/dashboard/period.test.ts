import { describe, expect, it } from "vitest";

import { DEFAULT_PERIOD, parsePeriod, periodDays } from "./period";

describe("parsePeriod", () => {
  it("aceita os períodos válidos", () => {
    expect(parsePeriod("7d")).toBe("7d");
    expect(parsePeriod("90d")).toBe("90d");
  });

  it("valor inválido, ausente ou repetido na URL cai no padrão ou no primeiro", () => {
    expect(parsePeriod("xyz")).toBe(DEFAULT_PERIOD);
    expect(parsePeriod(undefined)).toBe(DEFAULT_PERIOD);
    expect(parsePeriod(["7d", "90d"])).toBe("7d");
  });
});

describe("periodDays", () => {
  it("converte a chave em dias", () => {
    expect(periodDays("7d")).toBe(7);
    expect(periodDays("30d")).toBe(30);
    expect(periodDays("90d")).toBe(90);
  });
});
