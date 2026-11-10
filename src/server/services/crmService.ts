import { DEMO_WORKSPACE_ID } from "@/config/workspace";
import { crmRepository } from "@/server/repositories/crmRepository";
import type { Board } from "@/types/crm";

export class CrmRuleError extends Error {}

export async function getBoard(workspaceId: string = DEMO_WORKSPACE_ID): Promise<Board> {
  return crmRepository.getBoard(workspaceId);
}

export async function moveLeadToStage(
  leadId: string,
  stageId: string,
  index: number,
  workspaceId: string = DEMO_WORKSPACE_ID,
): Promise<void> {
  const moved = await crmRepository.moveLead(workspaceId, leadId, stageId, index);
  if (!moved) throw new CrmRuleError("Lead ou etapa não encontrados.");
}
