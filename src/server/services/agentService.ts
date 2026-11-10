import { getAgentEngine, getAiConfig, type AgentToolCall, type ChatTurn } from "@/lib/ai";
import { buildSystemPrompt } from "@/lib/ai/prompts/systemPrompt";
import { agentRepository, type AgentSettings } from "@/server/repositories/agentRepository";
import { conversationRepository } from "@/server/repositories/conversationRepository";

export type AgentReplyOutcome =
  | { kind: "skipped"; reason: "agent-inactive" | "human-assigned" | "resolved" | "not-found" }
  | { kind: "replied"; engine: "claude" | "mock" }
  /** O motor terminou sem texto (ex.: só executou ferramentas). */
  | { kind: "no-reply"; engine: "claude" | "mock" }
  | { kind: "handed-off"; reason: string };

/**
 * Gera a resposta do agente de IA para a última mensagem do contato.
 * Qualquer falha (API fora do ar, limite de uso, recusa) vira transferência para a equipe:
 * o contato nunca fica sem atendimento por causa da IA.
 */
export async function runAgentReply(
  conversationId: string,
  workspaceId: string,
): Promise<AgentReplyOutcome> {
  const [settings, detail, stages, businessName] = await Promise.all([
    agentRepository.getSettings(workspaceId),
    conversationRepository.findDetail(workspaceId, conversationId),
    agentRepository.listStageNames(workspaceId),
    agentRepository.getWorkspaceName(workspaceId),
  ]);

  if (!detail) return { kind: "skipped", reason: "not-found" };
  if (!settings?.active) return { kind: "skipped", reason: "agent-inactive" };
  if (detail.conversation.assignee !== "ai") return { kind: "skipped", reason: "human-assigned" };
  if (detail.conversation.status === "resolved") return { kind: "skipped", reason: "resolved" };

  const { conversation, contact } = detail;
  const history: ChatTurn[] = detail.messages.map((message) => ({
    role: message.author === "contact" ? "contact" : "business",
    // Mensagens da equipe entram marcadas, para o modelo saber que não foram dele.
    text:
      message.author === "user"
        ? `[Mensagem da equipe humana] ${message.content}`
        : message.content,
  }));

  const executeTool = async (call: AgentToolCall): Promise<string> => {
    switch (call.name) {
      case "transfer_to_human":
        await conversationRepository.handoffToHuman(workspaceId, conversationId, call.input.reason);
        return "Conversa transferida para a equipe humana.";
      case "update_lead_stage": {
        const moved = await agentRepository.setLeadStage(workspaceId, contact.id, call.input.stage);
        return moved ? `Lead movido para "${call.input.stage}".` : "Etapa não encontrada.";
      }
      case "add_tag":
        await agentRepository.addContactTag(workspaceId, contact.id, call.input.tag.toLowerCase());
        return `Etiqueta "${call.input.tag}" adicionada.`;
    }
  };

  const handOff = async (reason: string): Promise<AgentReplyOutcome> => {
    await conversationRepository.handoffToHuman(workspaceId, conversationId, reason);
    return { kind: "handed-off", reason };
  };

  try {
    const result = await getAgentEngine().run({
      system: buildSystemPrompt(settings, {
        businessName,
        contactName: contact.name,
        leadStage: conversation.leadStage,
      }),
      history,
      pipelineStages: stages,
      executeTool,
    });

    if (result.status === "refused") {
      return handOff("A IA não pôde responder a esta mensagem (política de segurança).");
    }
    if (result.status === "replied") {
      await conversationRepository.appendAiMessage(
        workspaceId,
        conversationId,
        result.text,
        new Date(),
      );
      return { kind: "replied", engine: result.engine };
    }
    return { kind: "no-reply", engine: result.engine };
  } catch (error) {
    // Não registrar conteúdo das mensagens nem a chave: só o tipo do erro.
    console.error(
      "Agente de IA falhou:",
      error instanceof Error ? error.name : "erro desconhecido",
    );
    return handOff("A IA ficou indisponível; a conversa foi transferida automaticamente.");
  }
}

// ---------- Configuração do agente (tela /agentes) ----------

export async function getAgentSettings(workspaceId: string) {
  const [settings, ai] = await Promise.all([
    agentRepository.getSettings(workspaceId),
    Promise.resolve(getAiConfig()),
  ]);
  return {
    settings,
    // Só o necessário para a tela: nunca expor a chave.
    engine: { kind: ai.engine, model: ai.model, effort: ai.effort },
  };
}

export async function saveAgentSettings(data: AgentSettings, workspaceId: string): Promise<void> {
  await agentRepository.saveSettings(workspaceId, data);
}
