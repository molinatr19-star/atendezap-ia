"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils/cn";

type Status = "connecting" | "live" | "offline";

const LABEL: Record<Status, string> = {
  connecting: "Conectando ao tempo real",
  live: "Ao vivo",
  offline: "Tempo real indisponível, tentando reconectar",
};

/**
 * Mantém o painel atualizado: ao receber um aviso do servidor (SSE), recarrega os dados da tela.
 * Vários avisos seguidos viram uma única atualização (300 ms).
 */
export function RealtimeSync() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("connecting");

  useEffect(() => {
    const source = new EventSource("/api/events");
    let timer: ReturnType<typeof setTimeout> | undefined;

    source.onopen = () => setStatus("live");
    source.onerror = () => setStatus("offline"); // o EventSource reconecta sozinho
    source.addEventListener("change", () => {
      clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 300);
    });

    return () => {
      clearTimeout(timer);
      source.close();
    };
  }, [router]);

  return (
    <span
      role="status"
      aria-label={LABEL[status]}
      title={LABEL[status]}
      className="flex items-center gap-1.5 px-2 text-xs text-muted-foreground"
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-2 rounded-full",
          status === "live"
            ? "bg-success"
            : status === "offline"
              ? "bg-warning"
              : "bg-muted-foreground",
        )}
      />
      <span className="hidden md:inline">{status === "live" ? "Ao vivo" : ""}</span>
    </span>
  );
}
