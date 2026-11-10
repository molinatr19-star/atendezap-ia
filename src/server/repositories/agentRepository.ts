import { prisma } from "@/lib/db/prisma";

export type AgentSettings = {
  name: string;
  persona: string;
  instructions: string;
  handoffRules: string;
  active: boolean;
};

/** Configuração do agente de IA e efeitos das ferramentas que ele pode acionar. */
export const agentRepository = {
  async getSettings(workspaceId: string): Promise<(AgentSettings & { updatedAt: string }) | null> {
    const row = await prisma.aiAgent.findUnique({ where: { workspaceId } });
    if (!row) return null;
    return {
      name: row.name,
      persona: row.persona,
      instructions: row.instructions,
      handoffRules: row.handoffRules,
      active: row.active,
      updatedAt: row.updatedAt.toISOString(),
    };
  },

  async saveSettings(workspaceId: string, data: AgentSettings): Promise<void> {
    await prisma.aiAgent.upsert({
      where: { workspaceId },
      create: { workspaceId, ...data },
      update: data,
    });
  },

  async getWorkspaceName(workspaceId: string): Promise<string> {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true },
    });
    return workspace?.name ?? "nossa empresa";
  },

  async listStageNames(workspaceId: string): Promise<string[]> {
    const stages = await prisma.pipelineStage.findMany({
      where: { workspaceId },
      orderBy: { position: "asc" },
      select: { name: true },
    });
    return stages.map((stage) => stage.name);
  },

  /** Move o lead mais recente do contato para a etapa; cria o lead se ainda não existir. */
  async setLeadStage(workspaceId: string, contactId: string, stageName: string): Promise<boolean> {
    const stage = await prisma.pipelineStage.findFirst({ where: { workspaceId, name: stageName } });
    if (!stage) return false;
    const lead = await prisma.lead.findFirst({
      where: { workspaceId, contactId },
      orderBy: { updatedAt: "desc" },
    });
    if (lead) {
      await prisma.lead.update({ where: { id: lead.id }, data: { stageId: stage.id } });
    } else {
      await prisma.lead.create({ data: { workspaceId, contactId, stageId: stage.id } });
    }
    return true;
  },

  async addContactTag(workspaceId: string, contactId: string, tagName: string): Promise<void> {
    // Isolamento: só etiqueta contato que pertence ao workspace.
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, workspaceId },
      select: { id: true },
    });
    if (!contact) throw new Error("Contato não encontrado no workspace.");
    await prisma.contact.update({
      where: { id: contactId },
      data: {
        tags: {
          connectOrCreate: {
            where: { workspaceId_name: { workspaceId, name: tagName } },
            create: { workspaceId, name: tagName },
          },
        },
      },
    });
  },
};
