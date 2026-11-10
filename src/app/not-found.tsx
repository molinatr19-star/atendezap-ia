import { SearchX } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <EmptyState
        icon={SearchX}
        title="Página não encontrada"
        description="O endereço acessado não existe ou foi movido."
        action={
          <Link href="/dashboard" className={buttonVariants()}>
            Voltar ao dashboard
          </Link>
        }
        className="w-full max-w-lg"
      />
    </main>
  );
}
