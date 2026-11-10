import type { Conversation } from "@/types/domain";

import { isWindowOpen } from "./window";

/**
 * Regras de atendimento, puras e compartilhadas:
 * - o servidor (server/services) as usa para validar e decidir o que gravar;
 * - o navegador as usa para a atualização otimista, sem esperar a resposta.
 */

export type ConversationCommand =
  | { type: "markRead" }
  | { type: "takeOver" }
  | { type: "returnToAi" }
  | { type: "resolve" }
  | { type: "reopen" };

export type ConversationState = Pick<
  Conversation,
  "status" | "assignee" | "assignedUserName" | "unreadCount" | "lastInboundAt"
>;

/** Próximo estado da conversa após um comando do operador. */
export function applyCommand<T extends ConversationState>(
  conversation: T,
  command: ConversationCommand,
  operatorName: string,
): T {
  switch (command.type) {
    case "markRead":
      return { ...conversation, unreadCount: 0 };
    case "takeOver":
      // Handoff IA -> humano: a equipe passa a responder e a IA para de enviar mensagens.
      return {
        ...conversation,
        assignee: "human",
        assignedUserName: operatorName,
        status: "open",
        unreadCount: 0,
      };
    case "returnToAi":
      return { ...conversation, assignee: "ai", assignedUserName: undefined, status: "open" };
    case "resolve":
      return { ...conversation, status: "resolved", unreadCount: 0 };
    case "reopen":
      return { ...conversation, status: "open" };
  }
}

export type SendBlockReason = "resolved" | "ai-assigned" | "window-closed" | null;

/** Motivo pelo qual o operador não pode enviar mensagem agora (null = pode enviar). */
export function getSendBlockReason(conversation: ConversationState, now: number): SendBlockReason {
  if (conversation.status === "resolved") return "resolved";
  if (conversation.assignee === "ai") return "ai-assigned";
  if (!isWindowOpen(conversation.lastInboundAt, now)) return "window-closed";
  return null;
}

export const SEND_BLOCK_MESSAGES: Record<Exclude<SendBlockReason, null>, string> = {
  resolved: "A conversa está resolvida. Reabra para responder.",
  "ai-assigned": "A IA está conduzindo esta conversa. Assuma para responder.",
  "window-closed": "A janela de 24 h terminou: só é possível enviar templates aprovados.",
};
