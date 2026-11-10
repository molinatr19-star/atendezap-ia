import { describe, expect, it } from "vitest";

import { applyCommand, getSendBlockReason, type ConversationState } from "./rules";

const NOW = Date.parse("2026-11-10T18:00:00-03:00");
const minutesAgo = (minutes: number) => new Date(NOW - minutes * 60_000).toISOString();

const base: ConversationState = {
  status: "pending",
  assignee: "ai",
  assignedUserName: undefined,
  unreadCount: 3,
  lastInboundAt: minutesAgo(10),
};

describe("applyCommand", () => {
  it("assumir: equipe passa a responder, conversa aberta e lida", () => {
    expect(applyCommand(base, { type: "takeOver" }, "Ana")).toEqual({
      ...base,
      assignee: "human",
      assignedUserName: "Ana",
      status: "open",
      unreadCount: 0,
    });
  });

  it("devolver para IA: remove o responsável humano", () => {
    const human = { ...base, assignee: "human" as const, assignedUserName: "Ana" };
    const next = applyCommand(human, { type: "returnToAi" }, "Ana");
    expect(next.assignee).toBe("ai");
    expect(next.assignedUserName).toBeUndefined();
  });

  it("resolver e reabrir alternam o status", () => {
    const resolved = applyCommand(base, { type: "resolve" }, "Ana");
    expect(resolved.status).toBe("resolved");
    expect(resolved.unreadCount).toBe(0);
    expect(applyCommand(resolved, { type: "reopen" }, "Ana").status).toBe("open");
  });

  it("não modifica o objeto original (função pura)", () => {
    const snapshot = { ...base };
    applyCommand(base, { type: "takeOver" }, "Ana");
    expect(base).toEqual(snapshot);
  });
});

describe("getSendBlockReason", () => {
  const human = { ...base, status: "open" as const, assignee: "human" as const };

  it("permite enviar com a equipe responsável e janela aberta", () => {
    expect(getSendBlockReason(human, NOW)).toBeNull();
  });

  it("bloqueia conversa resolvida antes de qualquer outra regra", () => {
    expect(getSendBlockReason({ ...base, status: "resolved" }, NOW)).toBe("resolved");
  });

  it("bloqueia quando a IA conduz", () => {
    expect(getSendBlockReason({ ...base, status: "open" }, NOW)).toBe("ai-assigned");
  });

  it("bloqueia fora da janela de 24 h", () => {
    expect(getSendBlockReason({ ...human, lastInboundAt: minutesAgo(24 * 60) }, NOW)).toBe(
      "window-closed",
    );
    expect(
      getSendBlockReason({ ...human, lastInboundAt: minutesAgo(24 * 60 - 1) }, NOW),
    ).toBeNull();
  });
});
