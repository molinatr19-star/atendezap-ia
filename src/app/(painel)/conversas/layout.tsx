import { Suspense } from "react";

import { ConversationList } from "@/components/chat/ConversationList";
import { ConversationListSkeleton } from "@/components/chat/ConversationListSkeleton";
import { listConversationSummaries } from "@/server/services/conversationService";
import { getRequestTime } from "@/server/requestTime";
import { requireUser } from "@/server/session";

/**
 * Caixa de entrada em duas colunas: lista (persistente entre conversas) + conversa aberta.
 * No mobile mostra uma coluna por vez: a lista some via CSS quando a página filha marca
 * [data-conversation-open], sem precisar ler a URL no layout.
 */
export default function ConversasLayout({ children }: LayoutProps<"/conversas">) {
  return (
    <div className="group/inbox flex h-0 min-h-[32rem] flex-1 overflow-hidden rounded-(--radius-card) border bg-surface">
      <aside
        aria-label="Caixa de entrada"
        className="flex w-full min-w-0 flex-col border-r group-has-[[data-conversation-open]]/inbox:hidden md:w-80 md:shrink-0 md:group-has-[[data-conversation-open]]/inbox:flex"
      >
        <Suspense fallback={<ConversationListSkeleton />}>
          <InboxList />
        </Suspense>
      </aside>
      <section className="hidden min-w-0 flex-1 group-has-[[data-conversation-open]]/inbox:flex md:flex">
        {children}
      </section>
    </div>
  );
}

async function InboxList() {
  const user = await requireUser();
  const now = await getRequestTime();
  const summaries = await listConversationSummaries(user.workspaceId);
  return <ConversationList summaries={summaries} now={now} />;
}
