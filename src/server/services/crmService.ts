import { crmRepository } from "@/server/repositories/crmRepository";
import type { Board } from "@/types/crm";
import { publishEvent } from "@/server/realtime/events";

export class CrmRuleError extends Error {}

export async function getBoard(workspaceId: string): Promise<Board> {
  return crmRepository.getBoard(workspaceId);
}

export async function moveLeadToStage(
  leadId: string,
  stageId: string,
  index: number,
  workspaceId: string,
): Promise<void> {
  const moved = await crmRepository.moveLead(workspaceId, leadId, stageId, index);
  if (!moved) throw new CrmRuleError("Lead ou etapa não encontrados.");
  await publishEvent({ workspaceId, type: "lead.moved" });
}
