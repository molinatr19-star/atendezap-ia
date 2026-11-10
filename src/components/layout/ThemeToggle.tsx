"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { THEME_STORAGE_KEY, type Theme } from "@/config/theme";

/**
 * Alterna claro/escuro. O ícone é escolhido por CSS (variante dark:), não por estado React,
 * para não divergir entre servidor e cliente na hidratação.
 */
export function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const next: Theme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Armazenamento indisponível (aba anônima, bloqueio): o tema vale só para esta sessão.
    }
  };

  return (
    <Button variant="ghost" size="icon" aria-label="Alternar tema claro/escuro" onClick={toggle}>
      <Sun className="hidden dark:block" />
      <Moon className="dark:hidden" />
    </Button>
  );
}
