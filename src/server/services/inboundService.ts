import { outgoingMessageSchema } from "@/features/conversas/messageSchema";
import { conversationRepository } from "@/server/repositories/conversationRepository";
import { runAgentReply, type AgentReplyOutcome } from "@/server/services/agentService";
import { ConversationRuleError } from "@/server/services/conversationService";
import { publishEvent } from "@/server/realtime/events";

/**
 * Entrada única de mensagens do contato. Hoje é chamada pelo simulador do painel; o webhook da
 * WhatsApp Cloud API vai usar este mesmo caminho (passando o id externo para idempotência).
 */
export async function receiveContactMessage(
  conversationId: string,
  text: string,
  workspaceId: string,
  externalId?: string,
): Promise<AgentReplyOutcome> {
  // Mesmo limite de tamanho do WhatsApp para o texto recebido.
  const parsed = outgoingMessageSchema.safeParse(text);
  if (!parsed.success) {
    throw new ConversationRuleError(parsed.error.issues[0]?.message ?? "Mensagem inválida.");
  }

  const conversation = await conversationRepository.findState(workspaceId, conversationId);
  if (!conversation) throw new ConversationRuleError("Conversa não encontrada.");

  await conversationRepository.appendInboundMessage(
    workspaceId,
    conversationId,
    parsed.data,
    new Date(),
    externalId,
  );

  // Se a IA conduz a conversa, ela responde; se a equipe assumiu, a mensagem só aparece no painel.
  const outcome = await runAgentReply(conversationId, workspaceId);
  await publishEvent({ workspaceId, type: "message.created", conversationId });
  return outcome;
}
