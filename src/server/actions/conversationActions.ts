"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import type { ConversationCommand } from "@/features/conversas/rules";
import {
  ConversationRuleError,
  runConversationCommand,
  sendOperatorMessage,
} from "@/server/services/conversationService";
import { receiveContactMessage } from "@/server/services/inboundService";
import { getActionUser, type CurrentUser } from "@/server/session";

/**
 * Server Actions das conversas. São endpoints públicos (POST): cada uma valida a sessão no
 * servidor e age SOMENTE no workspace do usuário logado. Argumentos do navegador são validados.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

const SESSION_EXPIRED: ActionResult = {
  ok: false,
  error: "Sua sessão expirou. Entre novamente para continuar.",
};

const conversationIdSchema = z.string().trim().min(1).max(64);

/** Exige usuário logado, executa a tarefa e atualiza a tela com os dados do banco. */
async function execute(task: (user: CurrentUser) => Promise<void>): Promise<ActionResult> {
  const user = await getActionUser();
  if (!user) return SESSION_EXPIRED;
  try {
    await task(user);
    refresh();
    return { ok: true };
  } catch (error) {
    if (error instanceof ConversationRuleError) return { ok: false, error: error.message };
    console.error("Falha em ação de conversa:", error instanceof Error ? error.name : error);
    return { ok: false, error: "Não foi possível concluir a ação. Tente novamente." };
  }
}

function command(type: ConversationCommand["type"]) {
  return async (conversationId: unknown): Promise<ActionResult> => {
    const id = conversationIdSchema.safeParse(conversationId);
    if (!id.success) return { ok: false, error: "Conversa inválida." };
    return execute((user) =>
      runConversationCommand(id.data, { type } as ConversationCommand, user.workspaceId, user.name),
    );
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
  return execute((user) => sendOperatorMessage(id.data, text, user.workspaceId));
}

/**
 * Simulador (modo demonstração): registra uma mensagem como se o CONTATO tivesse escrito no
 * WhatsApp e dispara o agente de IA, exatamente como o webhook real fará.
 */
export async function simulateContactMessage(
  conversationId: unknown,
  text: unknown,
): Promise<ActionResult> {
  if (process.env.WHATSAPP_MODE && process.env.WHATSAPP_MODE !== "mock") {
    return { ok: false, error: "Simulador disponível apenas no modo de demonstração." };
  }
  const id = conversationIdSchema.safeParse(conversationId);
  if (!id.success || typeof text !== "string") return { ok: false, error: "Dados inválidos." };
  return execute(async (user) => {
    await receiveContactMessage(id.data, text, user.workspaceId);
  });
}
