import Link from "next/link";

import { isActivePath, mainNav } from "@/config/navigation";
import { cn } from "@/lib/utils/cn";

type NavListProps = {
  /** Rota atual. Ausente no fallback de Suspense: nenhum item fica destacado. */
  pathname?: string;
  onNavigate?: () => void;
};

/** Lista de navegação sem hooks: serve tanto ao componente cliente quanto ao fallback no servidor. */
export function NavList({ pathname, onNavigate }: NavListProps) {
  return (
    <ul className="flex flex-col gap-1">
      {mainNav.map(({ href, title, icon: Icon }) => {
        const active = pathname ? isActivePath(pathname, href) : false;
        return (
          <li key={href}>
            <Link
              href={href}
              onNavigate={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary-soft text-primary-soft-foreground"
                  : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {title}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
