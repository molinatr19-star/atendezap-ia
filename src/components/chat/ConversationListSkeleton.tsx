import { Skeleton } from "@/components/ui/Skeleton";

export function ConversationListSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4" role="status" aria-label="Carregando conversas">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-9 w-full" />
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
