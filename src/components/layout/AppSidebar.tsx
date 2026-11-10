import { Suspense } from "react";

import { Brand } from "./Brand";
import { NavList } from "./NavList";
import { SidebarNav } from "./SidebarNav";

/** Sidebar fixa do desktop (lg+). No mobile, a navegação fica no MobileNav. */
export function AppSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar lg:flex">
      <div className="flex h-16 items-center border-b px-5">
        <Brand />
      </div>
      <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto p-3">
        <Suspense fallback={<NavList />}>
          <SidebarNav />
        </Suspense>
      </nav>
      <p className="border-t px-5 py-4 text-xs text-muted-foreground">
        Projeto de portfólio — dados fictícios
      </p>
    </aside>
  );
}
