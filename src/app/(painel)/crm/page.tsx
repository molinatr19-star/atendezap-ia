import type { Metadata } from "next";
import { Suspense } from "react";

import { KanbanBoard } from "@/components/crm/KanbanBoard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { getNavItem } from "@/config/navigation";
import { getRequestTime } from "@/server/requestTime";
import { requireUser } from "@/server/session";
import { getBoard } from "@/server/services/crmService";

export const metadata: Metadata = { title: "CRM" };

export default function CrmPage() {
  const nav = getNavItem("/crm");
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={nav.title} description={nav.description} />
      <Suspense fallback={<BoardSkeleton />}>
        <BoardContent />
      </Suspense>
    </div>
  );
}

async function BoardContent() {
  const user = await requireUser();
  const now = await getRequestTime();
  const board = await getBoard(user.workspaceId);
  return <KanbanBoard board={board} now={now} />;
}

function BoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden" role="status" aria-label="Carregando funil">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-96 w-72 shrink-0 rounded-(--radius-card)" />
      ))}
    </div>
  );
}
