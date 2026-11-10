import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import type {
  Contact,
  Conversation,
  ConversationDetail,
  ConversationSummary,
  Message,
} from "@/types/domain";

/**
 * Acesso a conversas, contatos e mensagens no banco.
 * Converte as linhas do Prisma para os tipos de domínio (datas em ISO), para que serviços e
 * interface não dependam do ORM. Toda consulta filtra por workspaceId (isolamento por cliente).
 */

const contactInclude = {
  tags: { select: { name: true }, orderBy: { name: "asc" } },
  leads: {
    select: { stage: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
    take: 1,
  },
} satisfies Prisma.ContactInclude;

type ContactRow = Prisma.ContactGetPayload<{ include: typeof contactInclude }>;
type ConversationRow = Prisma.ConversationGetPayload<object>;
type MessageRow = Prisma.MessageGetPayload<object>;

function toContact(row: ContactRow): Contact {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    phoneE164: row.phoneE164,
    city: row.city ?? "",
    tags: row.tags.map((tag) => tag.name),
    optIn: row.optIn,
    createdAt: row.createdAt.toISOString(),
  };
}

function toConversation(row: ConversationRow, contact?: ContactRow): Conversation {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    contactId: row.contactId,
    status: row.status,
    assignee: row.assignee,
    assignedUserName: row.assignedUserName ?? undefined,
    unreadCount: row.unreadCount,
    leadStage: contact?.leads[0]?.stage.name,
    handoffReason: row.handoffReason ?? undefined,
    lastMessageAt: row.lastMessageAt.toISOString(),
    lastInboundAt: row.lastInboundAt.toISOString(),
  };
}

function toMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversationId,
    direction: row.direction,
    author: row.author,
    content: row.content,
    deliveryStatus: row.deliveryStatus ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export type ConversationStateUpdate = {
  status?: Conversation["status"];
  assignee?: Conversation["assignee"];
  assignedUserName?: string | null;
  unreadCount?: number;
};

export const conversationRepository = {
  async listSummaries(workspaceId: string): Promise<ConversationSummary[]> {
    const rows = await prisma.conversation.findMany({
      where: { workspaceId },
      orderBy: { lastMessageAt: "desc" },
      include: {
        contact: { include: contactInclude },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    return rows.map((row) => {
      const last = row.messages[0];
      return {
        ...toConversation(row, row.contact),
        contact: toContact(row.contact),
        lastMessage: last
          ? { author: last.author, content: last.content }
          : { author: "contact", content: "" },
      };
    });
  },

  async findDetail(workspaceId: string, id: string): Promise<ConversationDetail | undefined> {
    const row = await prisma.conversation.findFirst({
      where: { id, workspaceId },
      include: {
        contact: { include: contactInclude },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!row) return undefined;
    return {
      conversation: toConversation(row, row.contact),
      contact: toContact(row.contact),
      messages: row.messages.map(toMessage),
    };
  },

  async findState(workspaceId: string, id: string): Promise<Conversation | undefined> {
    const row = await prisma.conversation.findFirst({ where: { id, workspaceId } });
    return row ? toConversation(row) : undefined;
  },

  /** updateMany com workspaceId no filtro: impede alterar conversa de outro workspace. */
  async updateState(workspaceId: string, id: string, data: ConversationStateUpdate): Promise<void> {
    const result = await prisma.conversation.updateMany({ where: { id, workspaceId }, data });
    if (result.count === 0) throw new Error(`Conversa ${id} não encontrada no workspace.`);
  },

  /** Grava a mensagem do operador e atualiza a conversa na mesma transação. */
  async appendOperatorMessage(
    workspaceId: string,
    conversationId: string,
    content: string,
    sentAt: Date,
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.conversation.updateMany({
        where: { id: conversationId, workspaceId },
        data: { lastMessageAt: sentAt, status: "open", unreadCount: 0 },
      });
      if (updated.count === 0) throw new Error(`Conversa ${conversationId} não encontrada.`);
      await tx.message.create({
        data: {
          conversationId,
          direction: "outbound",
          author: "user",
          content,
          // Modo simulado: sem WhatsApp real, a mensagem fica como "enviada".
          deliveryStatus: "sent",
          createdAt: sentAt,
        },
      });
    });
  },

  /**
   * Mensagem recebida do contato: renova a janela de 24 h e soma não lidas. Uma conversa
   * resolvida volta a ficar aberta (e o atendimento anterior deixa de contar como encerrado).
   */
  async appendInboundMessage(
    workspaceId: string,
    conversationId: string,
    content: string,
    receivedAt: Date,
    externalId?: string,
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const current = await tx.conversation.findFirst({
        where: { id: conversationId, workspaceId },
        select: { status: true },
      });
      if (!current) throw new Error(`Conversa ${conversationId} não encontrada.`);
      await tx.message.create({
        data: {
          conversationId,
          externalId,
          direction: "inbound",
          author: "contact",
          content,
          createdAt: receivedAt,
        },
      });
      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          lastInboundAt: receivedAt,
          lastMessageAt: receivedAt,
          unreadCount: { increment: 1 },
          ...(current.status === "resolved" ? { status: "open" as const } : {}),
        },
      });
      if (current.status === "resolved") {
        await tx.attendance.deleteMany({ where: { conversationId } });
      }
    });
  },

  /** Resposta gerada pelo agente de IA. Não altera o responsável (a IA pode ter transferido). */
  async appendAiMessage(
    workspaceId: string,
    conversationId: string,
    content: string,
    sentAt: Date,
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.conversation.updateMany({
        where: { id: conversationId, workspaceId },
        data: { lastMessageAt: sentAt },
      });
      if (updated.count === 0) throw new Error(`Conversa ${conversationId} não encontrada.`);
      await tx.message.create({
        data: {
          conversationId,
          direction: "outbound",
          author: "ai",
          content,
          deliveryStatus: "sent",
          createdAt: sentAt,
        },
      });
    });
  },

  /** Handoff IA -> equipe: aguardando atendimento humano, com o motivo registrado. */
  async handoffToHuman(workspaceId: string, conversationId: string, reason: string): Promise<void> {
    const result = await prisma.conversation.updateMany({
      where: { id: conversationId, workspaceId },
      data: { assignee: "human", assignedUserName: null, status: "pending", handoffReason: reason },
    });
    if (result.count === 0) throw new Error(`Conversa ${conversationId} não encontrada.`);
  },

  async listMessages(conversationId: string): Promise<Message[]> {
    const rows = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toMessage);
  },

  async contactHasLeadSince(contactId: string, since: Date): Promise<boolean> {
    const count = await prisma.lead.count({ where: { contactId, createdAt: { gte: since } } });
    return count > 0;
  },
};
