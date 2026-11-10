import { outgoingMessageSchema } from "@/features/conversas/messageSchema";
import {
  applyCommand,
  getSendBlockReason,
  SEND_BLOCK_MESSAGES,
  type ConversationCommand,
} from "@/features/conversas/rules";
import { publishEvent } from "@/server/realtime/events";
import { analyticsRepository } from "@/server/repositories/analyticsRepository";
import { conversationRepository } from "@/server/repositories/conversationRepository";
import type { Conversation, ConversationDetail, ConversationSummary } from "@/types/domain";

/** Erro de regra de negócio: a mensagem pode ser exibida ao operador. */
export class ConversationRuleError extends Error {}

// ---------- Leitura ----------

/** Caixa de entrada ordenada pela mensagem mais recente. */
export async function listConversationSummaries(
  workspaceId: string,
): Promise<ConversationSummary[]> {
  return conversationRepository.listSummaries(workspaceId);
}

export async function getConversationDetail(
  id: string,
  workspaceId: string,
): Promise<ConversationDetail | undefined> {
  return conversationRepository.findDetail(workspaceId, id);
}

// ---------- Comandos do operador ----------

async function loadConversation(workspaceId: string, id: string): Promise<Conversation> {
  const conversation = await conversationRepository.findState(workspaceId, id);
  if (!conversation) throw new ConversationRuleError("Conversa não encontrada.");
  return conversation;
}

/**
 * Registra o atendimento ao resolver: é o que alimenta o dashboard.
 * Tempo da 1ª resposta = primeira mensagem enviada após a primeira mensagem do contato.
 */
async function recordAttendance(conversation: Conversation, resolvedAt: Date): Promise<void> {
  const messages = await conversationRepository.listMessages(conversation.id);
  const firstInbound = messages.find((message) => message.direction === "inbound");
  if (!firstInbound) return;

  const firstInboundAt = Date.parse(firstInbound.createdAt);
  const firstReply = messages.find(
    (message) =>
      message.direction === "outbound" && Date.parse(message.createdAt) >= firstInboundAt,
  );
  const firstResponseSeconds = firstReply
    ? Math.round((Date.parse(firstReply.createdAt) - firstInboundAt) / 1000)
    : 0;
  const startedAt = new Date(messages[0].createdAt);

  await analyticsRepository.upsertForConversation(conversation.workspaceId, conversation.id, {
    startedAt,
    resolvedAt,
    resolvedBy: conversation.assignee,
    firstResponseSeconds,
    leadCreated: await conversationRepository.contactHasLeadSince(
      conversation.contactId,
      startedAt,
    ),
  });
}

export async function runConversationCommand(
  id: string,
  command: ConversationCommand,
  workspaceId: string,
  /** Nome do usuário logado: vira o responsável ao assumir a conversa. */
  operatorName: string,
): Promise<void> {
  const current = await loadConversation(workspaceId, id);

  if (command.type === "resolve" && current.status === "resolved") return;
  if (command.type === "reopen" && current.status !== "resolved") return;

  const next = applyCommand(current, command, operatorName);
  await conversationRepository.updateState(workspaceId, id, {
    status: next.status,
    assignee: next.assignee,
    assignedUserName: next.assignedUserName ?? null,
    unreadCount: next.unreadCount,
  });

  if (command.type === "resolve") await recordAttendance(next, new Date());
  // Reaberta: o atendimento deixa de contar como encerrado até ser resolvido de novo.
  if (command.type === "reopen") await analyticsRepository.deleteForConversation(id);
  await publishEvent({ workspaceId, type: "conversation.updated", conversationId: id });
}

export async function sendOperatorMessage(
  id: string,
  text: string,
  workspaceId: string,
): Promise<void> {
  const parsed = outgoingMessageSchema.safeParse(text);
  if (!parsed.success) {
    throw new ConversationRuleError(parsed.error.issues[0]?.message ?? "Mensagem inválida.");
  }

  const now = new Date();
  const conversation = await loadConversation(workspaceId, id);
  // A regra é revalidada no servidor: a interface pode estar desatualizada ou ser contornada.
  const blockReason = getSendBlockReason(conversation, now.getTime());
  if (blockReason) throw new ConversationRuleError(SEND_BLOCK_MESSAGES[blockReason]);

  await conversationRepository.appendOperatorMessage(workspaceId, id, parsed.data, now);
  await publishEvent({ workspaceId, type: "message.created", conversationId: id });
}
