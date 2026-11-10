/**
 * Seed da demonstração: workspace fictício, funil do CRM, caixa de entrada e histórico de métricas.
 *
 * Uso:
 *   npm run db:seed          -> popula só se o banco estiver vazio (não apaga nada)
 *   npm run db:reset-demo    -> APAGA o workspace de demonstração e recria do zero
 */
import "dotenv/config";

import { DEMO_WORKSPACE_ID, DEMO_WORKSPACE_NAME } from "@/config/workspace";
import { prisma } from "@/lib/db/prisma";
import { generateAttendanceHistory } from "@/mocks/analytics";
import { buildDemoInbox } from "@/mocks/inbox";

const PIPELINE = ["Novo lead", "Qualificação", "Proposta enviada", "Negociação", "Fechado"];

/** Valores fictícios de proposta por contato (em centavos). */
const LEAD_VALUES: Record<string, number> = {
  "ct-01": 1_850_000,
  "ct-02": 960_000,
  "ct-03": 720_000,
  "ct-05": 380_000,
  "ct-06": 2_400_000,
  "ct-07": 1_300_000,
  "ct-08": 540_000,
};

async function main() {
  const reset = process.argv.includes("--reset");
  const existing = await prisma.workspace.findUnique({ where: { id: DEMO_WORKSPACE_ID } });

  if (existing && !reset) {
    console.log("Banco já populado. Nada foi alterado.");
    console.log("Para APAGAR os dados de demonstração e recriar: npm run db:reset-demo");
    return;
  }
  if (existing) {
    // onDelete: Cascade remove contatos, conversas, mensagens, leads e atendimentos do workspace.
    await prisma.workspace.delete({ where: { id: DEMO_WORKSPACE_ID } });
    console.log("Workspace de demonstração apagado.");
  }

  const now = Date.now();
  const inbox = buildDemoInbox(now);
  const history = generateAttendanceHistory(now);

  await prisma.$transaction(async (tx) => {
    await tx.workspace.create({ data: { id: DEMO_WORKSPACE_ID, name: DEMO_WORKSPACE_NAME } });

    const stages = await Promise.all(
      PIPELINE.map((name, position) =>
        tx.pipelineStage.create({ data: { workspaceId: DEMO_WORKSPACE_ID, name, position } }),
      ),
    );
    const stageByName = new Map(stages.map((stage) => [stage.name, stage.id]));

    for (const contact of inbox.contacts) {
      await tx.contact.create({
        data: {
          id: contact.id,
          workspaceId: DEMO_WORKSPACE_ID,
          name: contact.name,
          phoneE164: contact.phoneE164,
          city: contact.city,
          optIn: contact.optIn,
          createdAt: new Date(contact.createdAt),
          tags: {
            connectOrCreate: contact.tags.map((name) => ({
              where: { workspaceId_name: { workspaceId: DEMO_WORKSPACE_ID, name } },
              create: { workspaceId: DEMO_WORKSPACE_ID, name },
            })),
          },
        },
      });
    }

    for (const conversation of inbox.conversations) {
      const messages = inbox.messages.filter(
        (message) => message.conversationId === conversation.id,
      );
      await tx.conversation.create({
        data: {
          id: conversation.id,
          workspaceId: DEMO_WORKSPACE_ID,
          contactId: conversation.contactId,
          status: conversation.status,
          assignee: conversation.assignee,
          assignedUserName: conversation.assignedUserName,
          unreadCount: conversation.unreadCount,
          handoffReason: conversation.handoffReason,
          lastMessageAt: new Date(conversation.lastMessageAt),
          lastInboundAt: new Date(conversation.lastInboundAt),
          createdAt: new Date(messages[0]?.createdAt ?? conversation.lastMessageAt),
          messages: {
            create: messages.map((message) => ({
              direction: message.direction,
              author: message.author,
              content: message.content,
              deliveryStatus: message.deliveryStatus,
              createdAt: new Date(message.createdAt),
            })),
          },
        },
      });

      // Lead no CRM para conversas com etapa definida.
      const stageId = conversation.leadStage ? stageByName.get(conversation.leadStage) : undefined;
      if (stageId) {
        await tx.lead.create({
          data: {
            workspaceId: DEMO_WORKSPACE_ID,
            contactId: conversation.contactId,
            stageId,
            valueCents: LEAD_VALUES[conversation.contactId],
          },
        });
      }
    }

    await tx.attendance.createMany({
      data: history.map((record) => ({
        workspaceId: DEMO_WORKSPACE_ID,
        startedAt: new Date(record.startedAt),
        resolvedAt: new Date(record.resolvedAt),
        resolvedBy: record.resolvedBy,
        firstResponseSeconds: record.firstResponseSeconds,
        leadCreated: record.leadCreated,
      })),
    });
  });

  const counts = await Promise.all([
    prisma.contact.count(),
    prisma.conversation.count(),
    prisma.message.count(),
    prisma.lead.count(),
    prisma.attendance.count(),
  ]);
  console.log(
    `Seed concluído: ${counts[0]} contatos, ${counts[1]} conversas, ${counts[2]} mensagens, ` +
      `${counts[3]} leads, ${counts[4]} atendimentos históricos.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("Falha no seed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
