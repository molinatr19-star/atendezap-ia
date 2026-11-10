import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/LoginForm";
import { Brand } from "@/components/layout/Brand";
import { Skeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-(--radius-card) border bg-surface p-6 shadow-xs sm:p-8">
        <div className="flex flex-col gap-2">
          <Brand />
          <h1 className="mt-4 text-xl font-semibold">Entrar no painel</h1>
          <p className="text-sm text-muted-foreground">
            Atendimento via WhatsApp com agentes de IA.
          </p>
        </div>
        {/* useSearchParams (destino após o login) precisa de Suspense com cacheComponents. */}
        <Suspense fallback={<Skeleton className="h-72 w-full" />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
