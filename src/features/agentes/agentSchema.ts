import { z } from "zod";

/** Validação do formulário de configuração do agente (navegador e servidor usam o mesmo schema). */
export const agentSettingsSchema = z.object({
  name: z.string().trim().min(2, "Dê um nome ao agente.").max(40, "Nome muito longo (máx. 40)."),
  persona: z
    .string()
    .trim()
    .min(20, "Descreva a persona com pelo menos 20 caracteres.")
    .max(1500, "Persona muito longa (máx. 1.500)."),
  instructions: z
    .string()
    .trim()
    .min(20, "Escreva as instruções do negócio (mín. 20 caracteres).")
    .max(6000, "Instruções muito longas (máx. 6.000)."),
  handoffRules: z
    .string()
    .trim()
    .min(10, "Diga quando transferir para a equipe (mín. 10 caracteres).")
    .max(1500, "Regras muito longas (máx. 1.500)."),
  active: z.boolean(),
});

export type AgentSettingsInput = z.infer<typeof agentSettingsSchema>;
