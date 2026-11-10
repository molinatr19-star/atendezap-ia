import { z } from "zod";

import { prisma } from "@/lib/db/prisma";

/** Canal do PostgreSQL usado para avisar os painéis abertos que algo mudou. */
export const REALTIME_CHANNEL = "atendezap_events";

export const realtimeEventSchema = z.object({
  workspaceId: z.string(),
  type: z.enum(["conversation.updated", "message.created", "lead.moved"]),
  conversationId: z.string().optional(),
});

export type RealtimeEvent = z.infer<typeof realtimeEventSchema>;

/**
 * Publica um evento via pg_notify. Só ids e tipo: nada de conteúdo de mensagens (privacidade e
 * limite de 8 KB do NOTIFY). Falha ao publicar não pode desfazer a operação principal.
 */
export async function publishEvent(event: RealtimeEvent): Promise<void> {
  try {
    await prisma.$executeRaw`SELECT pg_notify(${REALTIME_CHANNEL}, ${JSON.stringify(event)})`;
  } catch (error) {
    console.error(
      "Falha ao publicar evento em tempo real:",
      error instanceof Error ? error.name : error,
    );
  }
}
