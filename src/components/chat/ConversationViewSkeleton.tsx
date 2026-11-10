import { Skeleton } from "@/components/ui/Skeleton";

/** Placeholder do chat. Também marca data-conversation-open para o mobile não exibir a lista. */
export function ConversationViewSkeleton() {
  return (
    <div
      data-conversation-open
      role="status"
      aria-label="Carregando conversa"
      className="flex min-h-0 min-w-0 flex-1 flex-col"
    >
      <div className="flex items-center gap-3 border-b p-4">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <Skeleton className="h-14 w-2/3 rounded-2xl" />
        <Skeleton className="h-20 w-1/2 self-end rounded-2xl" />
        <Skeleton className="h-12 w-1/2 rounded-2xl" />
      </div>
      <div className="border-t p-4">
        <Skeleton className="h-11 w-full" />
      </div>
    </div>
  );
}
