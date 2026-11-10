"use client";

import { usePathname } from "next/navigation";

import { NavList } from "./NavList";

type SidebarNavProps = {
  onNavigate?: () => void;
};

/** Destaca o item ativo. Com cacheComponents, usePathname pode suspender: usar dentro de <Suspense>. */
export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  return <NavList pathname={pathname} onNavigate={onNavigate} />;
}
