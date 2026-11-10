import { prisma } from "@/lib/db/prisma";
import { localHour } from "@/lib/utils/time";
import type { AttendanceRecord } from "@/types/analytics";

export type AttendanceInput = {
  startedAt: Date;
  resolvedAt: Date;
  resolvedBy: "ai" | "human";
  firstResponseSeconds: number;
  leadCreated: boolean;
};

/** Atendimentos encerrados: base das métricas do dashboard. */
export const analyticsRepository = {
  async listAttendances(workspaceId: string, from: Date, to: Date): Promise<AttendanceRecord[]> {
    const rows = await prisma.attendance.findMany({
      where: { workspaceId, startedAt: { gte: from, lt: to } },
      select: { startedAt: true, resolvedBy: true, firstResponseSeconds: true, leadCreated: true },
    });
    return rows.map((row) => {
      const startedAt = row.startedAt.getTime();
      return {
        startedAt,
        hour: localHour(startedAt),
        resolvedBy: row.resolvedBy,
        firstResponseSeconds: row.firstResponseSeconds,
        leadCreated: row.leadCreated,
      };
    });
  },

  /** Um atendimento por conversa: resolver de novo após reabrir atualiza o mesmo registro. */
  async upsertForConversation(
    workspaceId: string,
    conversationId: string,
    data: AttendanceInput,
  ): Promise<void> {
    await prisma.attendance.upsert({
      where: { conversationId },
      create: { workspaceId, conversationId, ...data },
      update: data,
    });
  },

  async deleteForConversation(conversationId: string): Promise<void> {
    await prisma.attendance.deleteMany({ where: { conversationId } });
  },
};
