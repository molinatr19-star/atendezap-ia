"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { CrmRuleError, moveLeadToStage } from "@/server/services/crmService";
import { getActionUser } from "@/server/session";

import type { ActionResult } from "./conversationActions";

const moveSchema = z.object({
  leadId: z.string().trim().min(1).max(64),
  stageId: z.string().trim().min(1).max(64),
  index: z.number().int().min(0).max(10_000),
});

/** Move um lead no Kanban. Argumentos do navegador validados antes de tocar no banco. */
export async function moveLeadAction(
  leadId: unknown,
  stageId: unknown,
  index: unknown,
): Promise<ActionResult> {
  const user = await getActionUser();
  if (!user) return { ok: false, error: "Sua sessão expirou. Entre novamente para continuar." };
  const parsed = moveSchema.safeParse({ leadId, stageId, index });
  if (!parsed.success) return { ok: false, error: "Movimento inválido." };
  try {
    await moveLeadToStage(
      parsed.data.leadId,
      parsed.data.stageId,
      parsed.data.index,
      user.workspaceId,
    );
    refresh();
    return { ok: true };
  } catch (error) {
    if (error instanceof CrmRuleError) return { ok: false, error: error.message };
    console.error("Falha ao mover lead:", error instanceof Error ? error.name : error);
    return { ok: false, error: "Não foi possível mover o lead. Tente novamente." };
  }
}
