import { Bell, Search } from "lucide-react";
import { Suspense } from "react";

import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

import { MobileNav } from "./MobileNav";
import { RealtimeSync } from "./RealtimeSync";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b bg-surface/90 px-4 backdrop-blur sm:px-6">
      <MobileNav />

      {/* Busca global: apenas visual nesta fase. */}
      <div className="relative hidden max-w-sm flex-1 sm:block">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Buscar contatos, conversas..."
          aria-label="Buscar"
          disabled
          className="h-9 w-full rounded-lg border bg-background pr-3 pl-9 text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <RealtimeSync />
        <ThemeToggle />
        <Button variant="ghost" size="icon" aria-label="Notificações" disabled>
          <Bell />
        </Button>
        {/* Sessão é lida por requisição: o restante do cabeçalho continua estático. */}
        <Suspense fallback={<Skeleton className="ml-2 size-8 rounded-full" />}>
          <UserMenu />
        </Suspense>
      </div>
    </header>
  );
}
