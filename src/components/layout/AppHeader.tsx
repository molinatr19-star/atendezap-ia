import { Bell, Search } from "lucide-react";

import { Button } from "@/components/ui/Button";

import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "./ThemeToggle";

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
        <ThemeToggle />
        <Button variant="ghost" size="icon" aria-label="Notificações" disabled>
          <Bell />
        </Button>
        <span
          className="ml-2 flex size-8 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary-soft-foreground"
          title="Usuário de demonstração"
          aria-label="Usuário de demonstração"
        >
          DM
        </span>
      </div>
    </header>
  );
}
