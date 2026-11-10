import { describe, expect, it } from "vitest";

import type { Board, BoardLead } from "@/types/crm";

import { moveLead, stageTotalCents } from "./board";

function lead(
  id: string,
  stageId: string,
  position: number,
  valueCents: number | null = 100,
): BoardLead {
  return { id, stageId, position, contactId: `c-${id}`, contactName: id, valueCents, tags: [] };
}

const board: Board = [
  { id: "s1", name: "Novo", position: 0, leads: [lead("a", "s1", 0), lead("b", "s1", 1)] },
  { id: "s2", name: "Proposta", position: 1, leads: [lead("c", "s2", 0)] },
  { id: "s3", name: "Fechado", position: 2, leads: [] },
];

const ids = (result: Board, stageId: string) =>
  result.find((stage) => stage.id === stageId)?.leads.map((item) => `${item.id}@${item.position}`);

describe("moveLead", () => {
  it("move entre colunas na posição pedida e renumera as duas colunas", () => {
    const result = moveLead(board, "a", "s2", 0);
    expect(ids(result, "s1")).toEqual(["b@0"]);
    expect(ids(result, "s2")).toEqual(["a@0", "c@1"]);
    expect(result[1].leads[0].stageId).toBe("s2");
  });

  it("reordena dentro da mesma coluna", () => {
    expect(ids(moveLead(board, "a", "s1", 1), "s1")).toEqual(["b@0", "a@1"]);
  });

  it("aceita coluna vazia e limita índice fora do intervalo", () => {
    expect(ids(moveLead(board, "c", "s3", 99), "s3")).toEqual(["c@0"]);
    expect(ids(moveLead(board, "b", "s2", -5), "s2")).toEqual(["b@0", "c@1"]);
  });

  it("lead ou coluna inexistente não altera o quadro", () => {
    expect(moveLead(board, "zzz", "s2", 0)).toBe(board);
    expect(moveLead(board, "a", "zzz", 0)).toBe(board);
  });

  it("não modifica o quadro original (função pura)", () => {
    const snapshot = JSON.stringify(board);
    moveLead(board, "a", "s3", 0);
    expect(JSON.stringify(board)).toBe(snapshot);
  });
});

describe("stageTotalCents", () => {
  it("soma valores e trata ausência como zero", () => {
    expect(stageTotalCents([lead("x", "s", 0, 1500), lead("y", "s", 1, null)])).toBe(1500);
  });
});
