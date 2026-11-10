import type { Assignee, ConversationStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

import { assertTestDatabase } from "./guard";

export const TEST_WORKSPACE_ID = "ws-test";
const MINUTE = 60_000;

/** Limpa todas as tabelas de negócio (CASCADE a partir do Workspace). Só no banco de teste. */
export async function resetDatabase(): Promise<void> {
  assertTestDatabase(process.env.DATABASE_URL);
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Workspace" CASCADE');
}

type ConversationFixture = {
  id?: string;
  workspaceId?: string;
  assignee?: Assignee;
  status?: ConversationStatus;
  /** Minutos desde a última mensagem do contato (janela de 24 h = 1440). */
  lastInboundMinutesAgo?: number;
  withLead?: boolean;
};

/**
 * Cria workspace + contato + conversa com duas mensagens:
 * contato escreve há N min e a IA responde 30 s depois.
 */
export async function createConversation(options: ConversationFixture = {}) {
  const workspaceId = options.workspaceId ?? TEST_WORKSPACE_ID;
  const id = options.id ?? "cv-test";
  const inboundAt = new Date(Date.now() - (options.lastInboundMinutesAgo ?? 10) * MINUTE);
  const replyAt = new Date(inboundAt.getTime() + 30_000);

  await prisma.workspace.upsert({
    where: { id: workspaceId },
    create: { id: workspaceId, name: `Workspace ${workspaceId}` },
    update: {},
  });
  const contact = await prisma.contact.create({
    data: {
      workspaceId,
      name: "Contato de Teste",
      phoneE164: `+55119${Math.floor(Math.random() * 1e8)
        .toString()
        .padStart(8, "0")}`,
      optIn: true,
    },
  });

  if (options.withLead) {
    const stage = await prisma.pipelineStage.create({
      data: { workspaceId, name: "Novo lead", position: 0 },
    });
    await prisma.lead.create({ data: { workspaceId, contactId: contact.id, stageId: stage.id } });
  }

  return prisma.conversation.create({
    data: {
      id,
      workspaceId,
      contactId: contact.id,
      assignee: options.assignee ?? "ai",
      status: options.status ?? "open",
      unreadCount: 2,
      lastInboundAt: inboundAt,
      lastMessageAt: replyAt,
      createdAt: inboundAt,
      messages: {
        create: [
          { direction: "inbound", author: "contact", content: "Olá!", createdAt: inboundAt },
          {
            direction: "outbound",
            author: "ai",
            content: "Oi! Como posso ajudar?",
            deliveryStatus: "read",
            createdAt: replyAt,
          },
        ],
      },
    },
  });
}
