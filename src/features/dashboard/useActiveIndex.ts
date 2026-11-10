"use client";

import { useState, type KeyboardEvent } from "react";

/**
 * Ponto destacado de um gráfico, controlado por ponteiro E teclado:
 * setas esquerda/direita, Home e End percorrem os dados (o tooltip nunca depende só do mouse).
 */
export function useActiveIndex(length: number) {
  const [active, setActive] = useState<number | null>(null);

  const onKeyDown = (event: KeyboardEvent) => {
    if (length === 0) return;
    const current = active ?? length - 1;
    const next =
      event.key === "ArrowRight"
        ? Math.min(current + 1, length - 1)
        : event.key === "ArrowLeft"
          ? Math.max(current - 1, 0)
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? length - 1
              : null;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
  };

  return {
    active,
    setActive,
    focusProps: {
      tabIndex: 0,
      onKeyDown,
      onFocus: () => setActive((value) => value ?? length - 1),
      onBlur: () => setActive(null),
    },
  };
}
