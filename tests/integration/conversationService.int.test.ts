import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";
import {
  ConversationRuleError,
  getConversationDetail,
  runConversationCommand,
  sendOperatorMessage,
} from "@/server/services/conversationService";

import { createConversation, resetDatabase, TEST_WORKSPACE_ID } from "./fixtures";

const WS = TEST_WORKSPACE_ID;

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("comandos do operador", () => {
  it("assumir transfere para a equipe e zera não lidas", async () => {
    await createConversation({ assignee: "ai" });

    await runConversationCommand("cv-test", { type: "takeOver" }, WS);

    const saved = await prisma.conversation.findUniqueOrThrow({ where: { id: "cv-test" } });
    expect(saved).toMatchObject({
      assignee: "human",
      assignedUserName: "Você",
      status: "open",
      unreadCount: 0,
    });
  });

  it("devolver para a IA remove o responsável humano", async () => {
    await createConversation({ assignee: "human" });

    await runConversationCommand("cv-test", { type: "returnToAi" }, WS);

    const saved = await prisma.conversation.findUniqueOrThrow({ where: { id: "cv-test" } });
    expect(saved.assignee).toBe("ai");
    expect(saved.assignedUserName).toBeNull();
  });

  it("não altera conversa de outro workspace (isolamento)", async () => {
    await createConversation({ workspaceId: "ws-outro" });

    await expect(runConversationCommand("cv-test", { type: "takeOver" }, WS)).rejects.toThrow(
      ConversationRuleError,
    );
    const saved = await prisma.conversation.findUniqueOrThrow({ where: { id: "cv-test" } });
    expect(saved.assignee).toBe("ai");
  });
});

describe("envio de mensagem", () => {
  it("é recusado enquanto a IA conduz a conversa", async () => {
    await createConversation({ assignee: "ai" });

    await expect(sendOperatorMessage("cv-test", "Oi", WS)).rejects.toThrow(/IA está conduzindo/);
  });

  it("é recusado fora da janela de 24 h", async () => {
    await createConversation({ assignee: "human", lastInboundMinutesAgo: 25 * 60 });

    await expect(sendOperatorMessage("cv-test", "Oi", WS)).rejects.toThrow(/janela de 24 h/);
  });

  it("é recusado com texto vazio", async () => {
    await createConversation({ assignee: "human" });

    await expect(sendOperatorMessage("cv-test", "   ", WS)).rejects.toThrow(/Digite uma mensagem/);
  });

  it("grava a mensagem e atualiza a conversa", async () => {
    await createConversation({ assignee: "human" });

    await sendOperatorMessage("cv-test", "  Segue o orçamento.  ", WS);

    const detail = await getConversationDetail("cv-test", WS);
    const last = detail?.messages.at(-1);
    expect(last).toMatchObject({
      author: "user",
      direction: "outbound",
      content: "Segue o orçamento.",
      deliveryStatus: "sent",
    });
    expect(detail?.conversation.lastMessageAt).toBe(last?.createdAt);
  });
});

describe("atendimentos (métricas)", () => {
  it("resolver registra o atendimento com o tempo da 1ª resposta", async () => {
    await createConversation({ assignee: "ai", withLead: true });

    await runConversationCommand("cv-test", { type: "resolve" }, WS);

    const attendance = await prisma.attendance.findUniqueOrThrow({
      where: { conversationId: "cv-test" },
    });
    expect(attendance).toMatchObject({
      resolvedBy: "ai",
      firstResponseSeconds: 30,
      leadCreated: true,
    });
  });

  it("resolver duas vezes não duplica; reabrir remove o registro", async () => {
    await createConversation();

    await runConversationCommand("cv-test", { type: "resolve" }, WS);
    await runConversationCommand("cv-test", { type: "resolve" }, WS);
    expect(await prisma.attendance.count({ where: { conversationId: "cv-test" } })).toBe(1);

    await runConversationCommand("cv-test", { type: "reopen" }, WS);
    expect(await prisma.attendance.count({ where: { conversationId: "cv-test" } })).toBe(0);
  });
});
