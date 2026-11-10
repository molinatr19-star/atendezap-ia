import type { AgentEngine, AgentRunInput, AgentRunResult } from "./types";

/**
 * Motor simulado: usado quando não há ANTHROPIC_API_KEY (demonstração, testes e CI).
 * Segue o mesmo contrato do motor real e chama as MESMAS ferramentas, então transferências,
 * mudanças de etapa e etiquetas acontecem de verdade no banco.
 */

const HANDOFF = /\b(atendente|humano|pessoa|gerente|reclama\w*|cancel\w*|reembolso|procon)\b/i;
const QUOTE = /\b(or[cç]amento|pre[cç]o|valor|quanto custa)\b/i;
const VISIT = /\b(visita|agendar|medi[cç][aã]o|medir)\b/i;

function normalize(text: string): string {
  return text.normalize("NFC").toLowerCase();
}

export function createMockEngine(): AgentEngine {
  return {
    async run({ history, pipelineStages, executeTool }: AgentRunInput): Promise<AgentRunResult> {
      const last = history.at(-1);
      if (!last || last.role !== "contact") return { status: "silent", engine: "mock" };
      const text = normalize(last.text);

      if (HANDOFF.test(text)) {
        await executeTool({
          name: "transfer_to_human",
          input: { reason: "Contato pediu atendimento humano ou assunto sensível." },
        });
        return {
          status: "replied",
          engine: "mock",
          text: "Entendi! Vou chamar alguém da nossa equipe para continuar com você, só um instante.",
        };
      }

      if (VISIT.test(text) && pipelineStages.includes("Qualificação")) {
        await executeTool({ name: "update_lead_stage", input: { stage: "Qualificação" } });
        return {
          status: "replied",
          engine: "mock",
          text: "Posso agendar uma visita técnica gratuita para medição. Qual dia e período ficam melhores para você?",
        };
      }

      if (QUOTE.test(text)) {
        await executeTool({ name: "add_tag", input: { tag: "orçamento" } });
        return {
          status: "replied",
          engine: "mock",
          text: "Claro! Para preparar seu orçamento, me conta qual ambiente você quer planejar e as medidas aproximadas.",
        };
      }

      return {
        status: "replied",
        engine: "mock",
        text: "Obrigado pela mensagem! Me conta um pouco mais do que você precisa para eu te ajudar.",
      };
    },
  };
}
