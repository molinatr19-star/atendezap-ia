import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ConversationView } from "@/components/chat/ConversationView";
import { ConversationViewSkeleton } from "@/components/chat/ConversationViewSkeleton";
import { getConversationDetail } from "@/server/services/conversationService";
import { getRequestTime } from "@/server/requestTime";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Conversa" };

/**
 * params e banco ficam dentro do Suspense: a navegação mostra o esqueleto na hora e a conversa
 * chega por streaming, sempre lida do banco no momento da requisição.
 */
export default function ConversaPage({ params }: PageProps<"/conversas/[id]">) {
  return (
    <Suspense fallback={<ConversationViewSkeleton />}>
      <ConversationContent params={params} />
    </Suspense>
  );
}

async function ConversationContent({ params }: Pick<PageProps<"/conversas/[id]">, "params">) {
  const { id } = await params;
  const user = await requireUser();
  const now = await getRequestTime();
  const detail = await getConversationDetail(id, user.workspaceId);
  if (!detail) notFound();

  // key: ao trocar de conversa, o rascunho e a rolagem não "vazam" de uma para outra.
  return (
    <ConversationView
      key={detail.conversation.id}
      detail={detail}
      now={now}
      operatorName={user.name}
    />
  );
}
