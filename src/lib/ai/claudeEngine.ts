import Anthropic from "@anthropic-ai/sdk";

import type { AiConfig } from "./config";
import {
  parseToolCall,
  type AgentEngine,
  type AgentRunInput,
  type AgentRunResult,
  type ChatTurn,
} from "./types";

/** Limite de idas e voltas modelo <-> ferramentas por mensagem do contato (evita laço infinito). */
const MAX_TOOL_ROUNDS = 4;
/** Só as últimas mensagens vão para o modelo: suficiente para contexto, controla custo. */
const MAX_HISTORY_TURNS = 30;

function buildTools(pipelineStages: string[]): Anthropic.Beta.BetaTool[] {
  // strict: true garante argumentos válidos pelo schema (forçar a ferramenta não é permitido
  // neste modelo; o prompt orienta quando usar cada uma).
  return [
    {
      name: "transfer_to_human",
      description:
        "Transfere a conversa para a equipe humana. Use quando o contato pedir um atendente, " +
        "em assuntos sensíveis (reclamação, cancelamento, pagamento) ou quando você não souber responder.",
      strict: true,
      input_schema: {
        type: "object",
        properties: {
          reason: { type: "string", description: "Motivo curto, ex.: 'Contato pediu atendente'." },
        },
        required: ["reason"],
        additionalProperties: false,
      },
    },
    {
      name: "update_lead_stage",
      description: "Move o lead deste contato para outra etapa do funil de vendas.",
      strict: true,
      input_schema: {
        type: "object",
        properties: { stage: { type: "string", enum: pipelineStages } },
        required: ["stage"],
        additionalProperties: false,
      },
    },
    {
      name: "add_tag",
      description: "Adiciona uma etiqueta curta (minúsculas) ao contato, ex.: 'cozinha'.",
      strict: true,
      input_schema: {
        type: "object",
        properties: { tag: { type: "string" } },
        required: ["tag"],
        additionalProperties: false,
      },
    },
  ];
}

/**
 * Converte o histórico do WhatsApp em mensagens da API.
 * Contato -> "user"; IA e equipe -> "assistant". A lista precisa começar com o contato e terminar
 * com ele (o modelo não aceita "prefill" de resposta).
 */
export function toMessages(history: ChatTurn[]): Anthropic.Beta.BetaMessageParam[] {
  const recent = history.slice(-MAX_HISTORY_TURNS);
  const firstContact = recent.findIndex((turn) => turn.role === "contact");
  if (firstContact === -1) return [];
  return recent.slice(firstContact).map((turn) => ({
    role: turn.role === "contact" ? "user" : "assistant",
    content: turn.text,
  }));
}

function collectText(content: Anthropic.Beta.BetaContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

export function createClaudeEngine(config: AiConfig): AgentEngine {
  const client = new Anthropic({ apiKey: config.apiKey });

  return {
    async run({
      system,
      history,
      pipelineStages,
      executeTool,
    }: AgentRunInput): Promise<AgentRunResult> {
      const messages = toMessages(history);
      if (messages.length === 0 || messages.at(-1)?.role !== "user") {
        return { status: "silent", engine: "claude" };
      }
      const tools = buildTools(pipelineStages);
      let lastText = "";

      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const response = await client.beta.messages.create({
          model: config.model,
          max_tokens: config.maxTokens,
          system,
          messages,
          tools,
          output_config: { effort: config.effort },
          // Recusa por política: o servidor tenta outro modelo automaticamente na mesma chamada.
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
        });

        // Sempre checar stop_reason antes de ler o conteúdo.
        if (response.stop_reason === "refusal") return { status: "refused", engine: "claude" };

        lastText = collectText(response.content) || lastText;

        if (response.stop_reason === "pause_turn") {
          messages.push({ role: "assistant", content: response.content });
          continue;
        }
        if (response.stop_reason !== "tool_use") break;

        // Devolve o conteúdo completo (inclui blocos de raciocínio) e todos os resultados juntos.
        messages.push({ role: "assistant", content: response.content });
        const toolResults: Anthropic.Beta.BetaToolResultBlockParam[] = [];
        for (const block of response.content) {
          if (block.type !== "tool_use") continue;
          const call = parseToolCall(block.name, block.input);
          if (!call) {
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: "Argumentos inválidos para esta ferramenta.",
              is_error: true,
            });
            continue;
          }
          try {
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: await executeTool(call),
            });
          } catch (error) {
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: error instanceof Error ? error.message : "Falha ao executar a ferramenta.",
              is_error: true,
            });
          }
        }
        messages.push({ role: "user", content: toolResults });
      }

      return lastText
        ? { status: "replied", text: lastText, engine: "claude" }
        : { status: "silent", engine: "claude" };
    },
  };
}
