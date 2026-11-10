import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { saveAgentSettings } from "@/server/services/agentService";
import { receiveContactMessage } from "@/server/services/inboundService";

import { createConversation, resetDatabase, TEST_WORKSPACE_ID } from "./fixtures";

const WS = TEST_WORKSPACE_ID;

async function setupAgent(active = true) {
  await saveAgentSettings(
    {
      name: "Aurora",
      persona: "Assistente cordial e objetiva da loja de testes.",
      instructions: "Loja fictícia de móveis planejados usada nos testes automatizados.",
      handoffRules: "Transfira quando pedirem um atendente.",
      active,
    },
    WS,
  );
  await prisma.pipelineStage.createMany({
    data: [
      { workspaceId: WS, name: "Novo lead", position: 0 },
      { workspaceId: WS, name: "Qualificação", position: 1 },
    ],
  });
}

async function messagesOf(id = "cv-test") {
  return prisma.message.findMany({ where: { conversationId: id }, orderBy: { createdAt: "asc" } });
}

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("mensagem do contato + agente de IA (motor simulado)", () => {
  it("a IA responde quando conduz a conversa", async () => {
    await createConversation({ assignee: "ai" });
    await setupAgent();

    const outcome = await receiveContactMessage("cv-test", "Bom dia!", WS);

    expect(outcome).toEqual({ kind: "replied", engine: "mock" });
    const messages = await messagesOf();
    expect(messages.at(-2)).toMatchObject({ author: "contact", content: "Bom dia!" });
    expect(messages.at(-1)).toMatchObject({ author: "ai", direction: "outbound" });
    const conversation = await prisma.conversation.findUniqueOrThrow({ where: { id: "cv-test" } });
    expect(conversation.unreadCount).toBe(3); // 2 do fixture + 1 nova
  });

  it("pedido de atendente transfere para a equipe com motivo", async () => {
    await createConversation({ assignee: "ai" });
    await setupAgent();

    await receiveContactMessage("cv-test", "Quero falar com um atendente", WS);

    const conversation = await prisma.conversation.findUniqueOrThrow({ where: { id: "cv-test" } });
    expect(conversation).toMatchObject({ assignee: "human", status: "pending" });
    expect(conversation.handoffReason).toBeTruthy();
  });

  it("agendamento move o lead do contato no funil", async () => {
    const conversation = await createConversation({ assignee: "ai" });
    await setupAgent();

    await receiveContactMessage("cv-test", "Quero agendar uma visita", WS);

    const lead = await prisma.lead.findFirstOrThrow({
      where: { contactId: conversation.contactId },
      include: { stage: true },
    });
    expect(lead.stage.name).toBe("Qualificação");
  });

  it("com a equipe no comando, a IA não responde", async () => {
    await createConversation({ assignee: "human" });
    await setupAgent();

    const outcome = await receiveContactMessage("cv-test", "Oi?", WS);

    expect(outcome).toEqual({ kind: "skipped", reason: "human-assigned" });
    expect((await messagesOf()).at(-1)).toMatchObject({ author: "contact" });
  });

  it("agente desativado não responde", async () => {
    await createConversation({ assignee: "ai" });
    await setupAgent(false);

    const outcome = await receiveContactMessage("cv-test", "Oi?", WS);

    expect(outcome).toEqual({ kind: "skipped", reason: "agent-inactive" });
  });

  it("mensagem nova reabre conversa resolvida e renova a janela de 24 h", async () => {
    await createConversation({ assignee: "ai", status: "resolved", lastInboundMinutesAgo: 2000 });
    await setupAgent();

    await receiveContactMessage("cv-test", "Voltei, tenho outra dúvida", WS);

    const conversation = await prisma.conversation.findUniqueOrThrow({ where: { id: "cv-test" } });
    expect(conversation.status).toBe("open");
    expect(Date.now() - conversation.lastInboundAt.getTime()).toBeLessThan(60_000);
  });
});
