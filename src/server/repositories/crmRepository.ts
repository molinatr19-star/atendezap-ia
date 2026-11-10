import { prisma } from "@/lib/db/prisma";
import type { Board } from "@/types/crm";

/** Quadro Kanban: etapas do funil com seus leads ordenados. */
export const crmRepository = {
  async getBoard(workspaceId: string): Promise<Board> {
    const stages = await prisma.pipelineStage.findMany({
      where: { workspaceId },
      orderBy: { position: "asc" },
      include: {
        leads: {
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
          include: {
            contact: {
              select: {
                id: true,
                name: true,
                tags: { select: { name: true }, orderBy: { name: "asc" } },
                conversations: {
                  select: { id: true, lastMessageAt: true },
                  orderBy: { lastMessageAt: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    return stages.map((stage) => ({
      id: stage.id,
      name: stage.name,
      position: stage.position,
      leads: stage.leads.map((lead, index) => {
        const conversation = lead.contact.conversations[0];
        return {
          id: lead.id,
          stageId: stage.id,
          // Posição normalizada pela ordem lida (corrige empates de dados antigos).
          position: index,
          contactId: lead.contact.id,
          contactName: lead.contact.name,
          valueCents: lead.valueCents,
          tags: lead.contact.tags.map((tag) => tag.name),
          conversationId: conversation?.id,
          lastInteractionAt: conversation?.lastMessageAt.toISOString(),
        };
      }),
    }));
  },

  /**
   * Move o lead e renumera as colunas de origem e destino numa transação.
   * Devolve false se o lead ou a etapa não pertencem ao workspace.
   */
  async moveLead(
    workspaceId: string,
    leadId: string,
    toStageId: string,
    toIndex: number,
  ): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
      // Consultas em sequência: uma transação usa uma única conexão (paralelo é inválido).
      const lead = await tx.lead.findFirst({
        where: { id: leadId, workspaceId },
        select: { id: true, stageId: true },
      });
      const stage = await tx.pipelineStage.findFirst({
        where: { id: toStageId, workspaceId },
        select: { id: true },
      });
      if (!lead || !stage) return false;

      const targetIds = (
        await tx.lead.findMany({
          where: { workspaceId, stageId: toStageId, id: { not: leadId } },
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
          select: { id: true },
        })
      ).map((item) => item.id);
      const index = Math.max(0, Math.min(toIndex, targetIds.length));
      targetIds.splice(index, 0, leadId);

      // Sequencial: uma transação usa uma única conexão.
      for (const [position, id] of targetIds.entries()) {
        await tx.lead.update({ where: { id }, data: { stageId: toStageId, position } });
      }

      if (lead.stageId !== toStageId) {
        const sourceIds = await tx.lead.findMany({
          where: { workspaceId, stageId: lead.stageId },
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
          select: { id: true },
        });
        for (const [position, item] of sourceIds.entries()) {
          await tx.lead.update({ where: { id: item.id }, data: { position } });
        }
      }
      return true;
    });
  },
};
