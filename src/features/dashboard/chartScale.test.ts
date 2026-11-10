import { describe, expect, it } from "vitest";

import { clamp, evenlySpacedIndices, niceTicks, topRoundedBarPath } from "./chartScale";

describe("niceTicks", () => {
  it.each([
    [57, [0, 20, 40, 60]],
    [287, [0, 100, 200, 300]],
    [8, [0, 2, 4, 6, 8]],
    [1, [0, 0.5, 1]],
  ])("máximo %d -> %j", (max, expected) => {
    expect(niceTicks(max)).toEqual(expected);
  });

  it("sem dados ainda devolve um eixo válido", () => {
    expect(niceTicks(0)).toEqual([0, 1]);
  });
});

describe("evenlySpacedIndices", () => {
  it("devolve todos quando cabem", () => {
    expect(evenlySpacedIndices(5, 7)).toEqual([0, 1, 2, 3, 4]);
  });

  it("limita a quantidade e sempre inclui o último ponto", () => {
    const indices = evenlySpacedIndices(90, 7);
    expect(indices.length).toBeLessThanOrEqual(7);
    expect(indices.at(-1)).toBe(89);
  });
});

describe("topRoundedBarPath", () => {
  it("não desenha coluna de altura zero", () => {
    expect(topRoundedBarPath(0, 0, 10, 0)).toBe("");
  });

  it("começa na base reta e termina fechado", () => {
    const path = topRoundedBarPath(10, 20, 12, 30);
    expect(path.startsWith("M10,50")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
  });
});

describe("clamp", () => {
  it("mantém o valor dentro dos limites", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(5, 0, 10)).toBe(5);
  });
});
