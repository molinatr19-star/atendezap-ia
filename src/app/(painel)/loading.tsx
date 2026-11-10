import { Skeleton } from "@/components/ui/Skeleton";

export default function PainelLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Carregando conteúdo">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-72 w-full rounded-(--radius-card)" />
    </div>
  );
}
