import { z } from "zod";

/**
 * Configuração da IA lida do ambiente (somente no servidor).
 * Sem ANTHROPIC_API_KEY o app usa o motor simulado: a demonstração funciona sem custo.
 */
const aiEnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().trim().optional(),
  // Padrão: o modelo mais capaz da linha Opus. Para reduzir custo, troque por
  // claude-sonnet-5-5 ou claude-haiku-5-5 no .env (decisão de quem paga a conta).
  AI_MODEL: z.string().trim().min(1).default("claude-opus-5-5"),
  // Chat de atendimento não precisa de raciocínio profundo: "low" responde rápido e barato.
  AI_EFFORT: z.enum(["low", "medium", "high", "xhigh", "max"]).default("low"),
  AI_MAX_TOKENS: z.coerce.number().int().min(1024).max(128_000).default(16_000),
});

export type AiConfig = {
  engine: "claude" | "mock";
  apiKey?: string;
  model: string;
  effort: "low" | "medium" | "high" | "xhigh" | "max";
  maxTokens: number;
};

export function getAiConfig(): AiConfig {
  const env = aiEnvSchema.parse({
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || undefined,
    AI_MODEL: process.env.AI_MODEL || undefined,
    AI_EFFORT: process.env.AI_EFFORT || undefined,
    AI_MAX_TOKENS: process.env.AI_MAX_TOKENS || undefined,
  });
  return {
    engine: env.ANTHROPIC_API_KEY ? "claude" : "mock",
    apiKey: env.ANTHROPIC_API_KEY,
    model: env.AI_MODEL,
    effort: env.AI_EFFORT,
    maxTokens: env.AI_MAX_TOKENS,
  };
}
