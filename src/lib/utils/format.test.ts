import { describe, expect, it } from "vitest";

import {
  formatCompact,
  formatDuration,
  formatPercent,
  formatPhone,
  formatRelative,
  formatTime,
  initials,
} from "./format";

describe("formatDuration", () => {
  it.each([
    [38, "38 s"],
    [60, "1 min"],
    [135, "2 min 15 s"],
    [3600, "1 h"],
    [3720, "1 h 2 min"],
  ])("%d s -> %s", (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });
});

describe("números", () => {
  it("percentual com uma casa decimal e vírgula", () => {
    expect(formatPercent(67.84)).toBe("67,8%");
  });

  it("compacta só a partir de 10 mil", () => {
    expect(formatCompact(1200)).toBe("1.200");
    expect(formatCompact(12_000)).toMatch(/^12\s?mil$/);
  });
});

describe("formatRelative", () => {
  const now = Date.parse("2026-11-10T18:00:00-03:00");
  const ago = (minutes: number) => new Date(now - minutes * 60_000).toISOString();

  it.each([
    [0, "agora"],
    [5, "5 min"],
    [180, "3 h"],
    [30 * 60, "ontem"],
  ])("há %d min -> %s", (minutes, expected) => {
    expect(formatRelative(ago(minutes), now)).toBe(expected);
  });

  it("mais de 2 dias mostra a data", () => {
    expect(formatRelative(ago(3 * 24 * 60), now)).toBe("07/11");
  });
});

describe("textos", () => {
  it("formata telefone brasileiro E.164", () => {
    expect(formatPhone("+5511900000001")).toBe("+55 11 90000-0001");
    expect(formatPhone("+14155550100")).toBe("+14155550100");
  });

  it("iniciais de nome simples e composto", () => {
    expect(initials("Mariana Alves")).toBe("MA");
    expect(initials("Pedro Henrique Lima")).toBe("PL");
    expect(initials("Bruna")).toBe("B");
  });

  it("hora sempre no fuso de São Paulo, independente da máquina", () => {
    expect(formatTime("2026-11-10T21:05:00.000Z")).toBe("18:05");
  });
});
