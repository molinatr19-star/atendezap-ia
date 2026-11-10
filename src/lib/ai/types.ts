import { z } from "zod";

/**
 * Contrato entre o serviço do agente (que conhece o banco) e os motores de IA (que não conhecem).
 * O motor decide O QUE fazer; quem executa os efeitos é o callback `executeTool` do serviço.
 */

export type ChatTurn = {
  role: "contact" | "business";
  text: string;
};

export const transferToHumanInput = z.object({ reason: z.string().trim().min(1).max(300) });
export const updateLeadStageInput = z.object({ stage: z.string().trim().min(1).max(60) });
export const addTagInput = z.object({ tag: z.string().trim().min(1).max(30) });

export type AgentToolCall =
  | { name: "transfer_to_human"; input: z.infer<typeof transferToHumanInput> }
  | { name: "update_lead_stage"; input: z.infer<typeof updateLeadStageInput> }
  | { name: "add_tag"; input: z.infer<typeof addTagInput> };

/** Resultado textual devolvido ao modelo após executar a ferramenta. */
export type ToolExecutor = (call: AgentToolCall) => Promise<string>;

export type AgentRunInput = {
  system: string;
  history: ChatTurn[];
  /** Etapas válidas do funil: viram o enum da ferramenta update_lead_stage. */
  pipelineStages: string[];
  executeTool: ToolExecutor;
};

export type AgentRunResult =
  | { status: "replied"; text: string; engine: "claude" | "mock" }
  /** O modelo recusou (política de segurança) mesmo após os fallbacks: vai para a equipe. */
  | { status: "refused"; engine: "claude" | "mock" }
  /** Terminou sem texto (ex.: só transferiu). */
  | { status: "silent"; engine: "claude" | "mock" };

export interface AgentEngine {
  run(input: AgentRunInput): Promise<AgentRunResult>;
}

/** Valida a chamada de ferramenta vinda do modelo (dado externo) antes de executar. */
export function parseToolCall(name: string, input: unknown): AgentToolCall | null {
  if (name === "transfer_to_human") {
    const parsed = transferToHumanInput.safeParse(input);
    return parsed.success ? { name, input: parsed.data } : null;
  }
  if (name === "update_lead_stage") {
    const parsed = updateLeadStageInput.safeParse(input);
    return parsed.success ? { name, input: parsed.data } : null;
  }
  if (name === "add_tag") {
    const parsed = addTagInput.safeParse(input);
    return parsed.success ? { name, input: parsed.data } : null;
  }
  return null;
}
