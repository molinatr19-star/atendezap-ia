"use client";

import { useOptimistic, useState, useTransition } from "react";

import { DEMO_OPERATOR_NAME } from "@/config/workspace";
import {
  reopenConversation,
  resolveConversation,
  returnConversationToAi,
  sendConversationMessage,
  takeOverConversation,
  type ActionResult,
} from "@/server/actions/conversationActions";
import type { Conversation, ConversationDetail, Message } from "@/types/domain";

import { outgoingMessageSchema } from "./messageSchema";
import { applyCommand, getSendBlockReason, type ConversationCommand } from "./rules";
import { isWindowOpen } from "./window";

type OptimisticView = { conversation: Conversation; messages: Message[] };

type OptimisticUpdate =
  { kind: "command"; command: ConversationCommand } | { kind: "message"; message: Message };

function reduceOptimistic(view: OptimisticView, update: OptimisticUpdate): OptimisticView {
  if (update.kind === "command") {
    return {
      ...view,
      conversation: applyCommand(view.conversation, update.command, DEMO_OPERATOR_NAME),
    };
  }
  return {
    conversation: { ...view.conversation, lastMessageAt: update.message.createdAt, status: "open" },
    messages: [...view.messages, update.message],
  };
}

/**
 * Conversa aberta: estado otimista + ações persistidas no banco via Server Actions.
 * A tela muda na hora (mesmas regras do servidor, em features/conversas/rules.ts); quando a
 * ação termina, refresh() traz os dados reais. Se o servidor recusar, o otimismo é desfeito
 * automaticamente e o erro é exibido.
 *
 * `now` vem do servidor (hora da requisição) para servidor e navegador renderizarem igual.
 */
export function useConversation(detail: ConversationDetail, now: number) {
  const id = detail.conversation.id;
  const [view, addOptimistic] = useOptimistic<OptimisticView, OptimisticUpdate>(
    { conversation: detail.conversation, messages: detail.messages },
    reduceOptimistic,
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const conversation = view.conversation;
  const sendBlockReason = getSendBlockReason(conversation, now);

  const runCommand = (
    command: ConversationCommand,
    action: (conversationId: string) => Promise<ActionResult>,
  ) => {
    setError(null);
    startTransition(async () => {
      addOptimistic({ kind: "command", command });
      const result = await action(id);
      if (!result.ok) setError(result.error);
    });
  };

  /** Valida localmente (feedback imediato) e envia. Retorna erro de validação ou null. */
  const send = (text: string): string | null => {
    const parsed = outgoingMessageSchema.safeParse(text);
    if (!parsed.success) return parsed.error.issues[0]?.message ?? "Mensagem inválida.";
    setError(null);
    startTransition(async () => {
      addOptimistic({
        kind: "message",
        message: {
          id: `optimistic-${Date.now()}`,
          conversationId: id,
          direction: "outbound",
          author: "user",
          content: parsed.data,
          deliveryStatus: "sent",
          createdAt: new Date().toISOString(),
        },
      });
      const result = await sendConversationMessage(id, parsed.data);
      if (!result.ok) setError(result.error);
    });
    return null;
  };

  return {
    conversation,
    contact: detail.contact,
    messages: view.messages,
    windowOpen: isWindowOpen(conversation.lastInboundAt, now),
    sendBlockReason,
    isPending,
    error,
    dismissError: () => setError(null),
    send,
    takeOver: () => runCommand({ type: "takeOver" }, takeOverConversation),
    returnToAi: () => runCommand({ type: "returnToAi" }, returnConversationToAi),
    resolve: () => runCommand({ type: "resolve" }, resolveConversation),
    reopen: () => runCommand({ type: "reopen" }, reopenConversation),
  };
}
