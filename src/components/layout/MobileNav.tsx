"use client";

import { Menu, X } from "lucide-react";
import { Suspense, useRef } from "react";

import { Button } from "@/components/ui/Button";

import { Brand } from "./Brand";
import { NavList } from "./NavList";
import { SidebarNav } from "./SidebarNav";

/**
 * Menu lateral do mobile. Usa <dialog> nativo com showModal(): foco preso no menu,
 * Esc fecha e o fundo fica inerte, sem biblioteca extra.
 */
export function MobileNav() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const open = () => dialogRef.current?.showModal();
  const close = () => dialogRef.current?.close();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Abrir menu de navegação"
        onClick={open}
      >
        <Menu />
      </Button>

      <dialog
        ref={dialogRef}
        aria-label="Menu de navegação"
        className="m-0 h-dvh max-h-none w-72 max-w-[85vw] border-r bg-sidebar p-0 text-foreground backdrop:bg-black/40"
        onClick={(event) => {
          // Clique no backdrop (fora do conteúdo) fecha o menu.
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="flex h-16 items-center justify-between border-b px-5">
          <Brand />
          <Button variant="ghost" size="icon" aria-label="Fechar menu" onClick={close}>
            <X />
          </Button>
        </div>
        <nav aria-label="Navegação principal" className="p-3">
          <Suspense fallback={<NavList onNavigate={close} />}>
            <SidebarNav onNavigate={close} />
          </Suspense>
        </nav>
      </dialog>
    </>
  );
}
