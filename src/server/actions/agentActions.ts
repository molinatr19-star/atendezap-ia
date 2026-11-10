"use server";

import { refresh } from "next/cache";

import { agentSettingsSchema } from "@/features/agentes/agentSchema";
import { saveAgentSettings } from "@/server/services/agentService";
import { canManageWorkspace, getActionUser } from "@/server/session";

export type AgentFormState = {
  status: "idle" | "saved" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"name" | "persona" | "instructions" | "handoffRules", string>>;
};

/** Salva a configuração do agente. Usada com useActionState no formulário de /agentes. */
export async function saveAgentAction(
  _previous: AgentFormState,
  formData: FormData,
): Promise<AgentFormState> {
  const user = await getActionUser();
  if (!user) return { status: "error", message: "Sua sessão expirou. Entre novamente." };
  // Controle de acesso: só dono e administradores alteram o comportamento da IA.
  if (!canManageWorkspace(user)) {
    return { status: "error", message: "Apenas administradores podem alterar o agente." };
  }

  const parsed = agentSettingsSchema.safeParse({
    name: formData.get("name"),
    persona: formData.get("persona"),
    instructions: formData.get("instructions"),
    handoffRules: formData.get("handoffRules"),
    active: formData.get("active") === "on",
  });

  if (!parsed.success) {
    const fieldErrors: AgentFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (
        (field === "name" ||
          field === "persona" ||
          field === "instructions" ||
          field === "handoffRules") &&
        !fieldErrors[field]
      ) {
        fieldErrors[field] = issue.message;
      }
    }
    return { status: "error", message: "Revise os campos destacados.", fieldErrors };
  }

  try {
    await saveAgentSettings(parsed.data, user.workspaceId);
  } catch (error) {
    console.error("Falha ao salvar agente:", error instanceof Error ? error.name : error);
    return { status: "error", message: "Não foi possível salvar. Tente novamente." };
  }
  refresh();
  return { status: "saved", message: "Configuração salva." };
}
