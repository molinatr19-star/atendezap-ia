"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import type { ConversationCommand } from "@/features/conversas/rules";
import {
  ConversationRuleError,
  runConversationCommand,
  sendOperatorMessage,
} from "@/server/services/conversationService";

/**
 * Server Actions das conversas. Argumentos vêm do navegador: tratados como não confiáveis
 * e validados aqui. Ainda sem login, todas agem no workspace de demonstração.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

const conversationIdSchema = z.string().trim().min(1).max(64);

async function execute(task: () => Promise<void>): Promise<ActionResult> {
  try {
    await task();
    // Atualiza a rota atual (lista no layout + conversa aberta) com os dados do banco.
    refresh();
    return { ok: true };
  } catch (error) {
    if (error instanceof ConversationRuleError) return { ok: false, error: error.message };
    console.error("Falha em ação de conversa:", error);
    return { ok: false, error: "Não foi possível concluir a ação. Tente novamente." };
  }
}

function command(type: ConversationCommand["type"]) {
  return async (conversationId: unknown): Promise<ActionResult> => {
    const id = conversationIdSchema.safeParse(conversationId);
    if (!id.success) return { ok: false, error: "Conversa inválida." };
    return execute(() => runConversationCommand(id.data, { type } as ConversationCommand));
  };
}

export async function markConversationRead(conversationId: unknown): Promise<ActionResult> {
  return command("markRead")(conversationId);
}

export async function takeOverConversation(conversationId: unknown): Promise<ActionResult> {
  return command("takeOver")(conversationId);
}

export async function returnConversationToAi(conversationId: unknown): Promise<ActionResult> {
  return command("returnToAi")(conversationId);
}

export async function resolveConversation(conversationId: unknown): Promise<ActionResult> {
  return command("resolve")(conversationId);
}

export async function reopenConversation(conversationId: unknown): Promise<ActionResult> {
  return command("reopen")(conversationId);
}

export async function sendConversationMessage(
  conversationId: unknown,
  text: unknown,
): Promise<ActionResult> {
  const id = conversationIdSchema.safeParse(conversationId);
  if (!id.success || typeof text !== "string") return { ok: false, error: "Dados inválidos." };
  return execute(() => sendOperatorMessage(id.data, text));
}
