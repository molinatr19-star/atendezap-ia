import { Skeleton } from "@/components/ui/Skeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Carregando métricas">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-36 rounded-(--radius-card)" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-(--radius-card) lg:col-span-2" />
        <Skeleton className="h-80 rounded-(--radius-card)" />
      </div>
    </div>
  );
}
