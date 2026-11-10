import { describe, expect, it, vi } from "vitest";

import { toMessages } from "./claudeEngine";
import { getAiConfig } from "./config";
import { createMockEngine } from "./mockEngine";
import { parseToolCall, type AgentToolCall, type ChatTurn } from "./types";

const STAGES = ["Novo lead", "Qualificação", "Fechado"];

async function runMock(text: string) {
  const calls: AgentToolCall[] = [];
  const executeTool = vi.fn(async (call: AgentToolCall) => {
    calls.push(call);
    return "ok";
  });
  const result = await createMockEngine().run({
    system: "",
    history: [{ role: "contact", text }],
    pipelineStages: STAGES,
    executeTool,
  });
  return { result, calls };
}

describe("motor simulado", () => {
  it("pedido de atendente: transfere e avisa o contato", async () => {
    const { result, calls } = await runMock("Quero falar com um atendente, por favor");
    expect(calls).toEqual([{ name: "transfer_to_human", input: { reason: expect.any(String) } }]);
    expect(result).toMatchObject({ status: "replied", engine: "mock" });
  });

  it("agendamento de visita: move o lead para Qualificação", async () => {
    const { calls } = await runMock("Dá para agendar uma visita na quinta?");
    expect(calls).toEqual([{ name: "update_lead_stage", input: { stage: "Qualificação" } }]);
  });

  it("orçamento: etiqueta a conversa", async () => {
    const { calls } = await runMock("Quanto custa uma cozinha? Queria um orçamento");
    expect(calls).toEqual([{ name: "add_tag", input: { tag: "orçamento" } }]);
  });

  it("não responde se a última mensagem não é do contato", async () => {
    const result = await createMockEngine().run({
      system: "",
      history: [{ role: "business", text: "Olá!" }],
      pipelineStages: STAGES,
      executeTool: vi.fn(),
    });
    expect(result.status).toBe("silent");
  });
});

describe("toMessages (histórico -> API)", () => {
  it("começa no primeiro contato e mapeia papéis", () => {
    const history: ChatTurn[] = [
      { role: "business", text: "Mensagem antiga da empresa" },
      { role: "contact", text: "Oi" },
      { role: "business", text: "Olá!" },
      { role: "contact", text: "Tudo bem?" },
    ];
    expect(toMessages(history)).toEqual([
      { role: "user", content: "Oi" },
      { role: "assistant", content: "Olá!" },
      { role: "user", content: "Tudo bem?" },
    ]);
  });

  it("sem mensagem do contato não há o que responder", () => {
    expect(toMessages([{ role: "business", text: "Oi" }])).toEqual([]);
  });
});

describe("parseToolCall (entrada vinda do modelo)", () => {
  it("aceita argumentos válidos e recusa inválidos ou ferramenta desconhecida", () => {
    expect(parseToolCall("add_tag", { tag: "cozinha" })).toEqual({
      name: "add_tag",
      input: { tag: "cozinha" },
    });
    expect(parseToolCall("add_tag", { tag: "" })).toBeNull();
    expect(parseToolCall("transfer_to_human", {})).toBeNull();
    expect(parseToolCall("delete_everything", {})).toBeNull();
  });
});

describe("getAiConfig", () => {
  it("sem chave usa o motor simulado com padrões seguros", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("AI_MODEL", "");
    const config = getAiConfig();
    expect(config).toMatchObject({ engine: "mock", model: "claude-opus-5-5", effort: "low" });
    vi.unstubAllEnvs();
  });

  it("com chave usa a Claude API e respeita o modelo configurado", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "chave-de-teste");
    vi.stubEnv("AI_MODEL", "claude-sonnet-5-5");
    expect(getAiConfig()).toMatchObject({ engine: "claude", model: "claude-sonnet-5-5" });
    vi.unstubAllEnvs();
  });
});
