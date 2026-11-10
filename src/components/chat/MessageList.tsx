"use client";

import { Bot, Check, CheckCheck, UserRound } from "lucide-react";
import { useEffect, useRef } from "react";

import { formatLongDate, formatTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { DAY_MS, localDayKey } from "@/lib/utils/time";
import type { DeliveryStatus, Message } from "@/types/domain";

function dayLabel(iso: string, now: number): string {
  const key = localDayKey(Date.parse(iso));
  if (key === localDayKey(now)) return "Hoje";
  if (key === localDayKey(now - DAY_MS)) return "Ontem";
  return formatLongDate(iso);
}

const DELIVERY_LABEL: Record<DeliveryStatus, string> = {
  sent: "Enviada",
  delivered: "Entregue",
  read: "Lida",
  failed: "Falha no envio",
};

function DeliveryIcon({ status }: { status: DeliveryStatus }) {
  const Icon = status === "sent" ? Check : CheckCheck;
  return (
    <Icon
      className={cn("size-3.5", status === "read" ? "text-chart-1" : "opacity-70")}
      aria-label={DELIVERY_LABEL[status]}
    />
  );
}

type MessageListProps = {
  messages: Message[];
  now: number;
};

export function MessageList({ messages, now }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mantém a mensagem mais recente visível ao abrir a conversa e a cada envio.
  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages.length]);

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-background px-4 py-4 sm:px-6">
      <ol
        role="log"
        aria-label="Mensagens da conversa"
        aria-live="polite"
        className="flex flex-col gap-2"
      >
        {messages.map((message, index) => {
          const previous = messages[index - 1];
          const showDay =
            !previous || dayLabel(previous.createdAt, now) !== dayLabel(message.createdAt, now);
          const outbound = message.direction === "outbound";
          return (
            <li key={message.id} className="flex flex-col">
              {showDay ? (
                <span className="my-3 self-center rounded-full border bg-surface px-3 py-0.5 text-[11px] text-muted-foreground">
                  {dayLabel(message.createdAt, now)}
                </span>
              ) : null}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-xs sm:max-w-[70%]",
                  outbound
                    ? "self-end rounded-br-md bg-primary-soft text-foreground"
                    : "self-start rounded-bl-md border bg-surface text-surface-foreground",
                )}
              >
                {message.author !== "contact" ? (
                  <span className="mb-0.5 flex items-center gap-1 text-[11px] font-semibold text-primary-soft-foreground">
                    {message.author === "ai" ? (
                      <>
                        <Bot className="size-3" aria-hidden="true" /> Agente IA
                      </>
                    ) : (
                      <>
                        <UserRound className="size-3" aria-hidden="true" /> Equipe
                      </>
                    )}
                  </span>
                ) : null}
                <p className="break-words whitespace-pre-wrap">{message.content}</p>
                <span className="mt-1 flex items-center justify-end gap-1 text-[11px] text-muted-foreground tabular-nums">
                  {formatTime(message.createdAt)}
                  {message.deliveryStatus ? <DeliveryIcon status={message.deliveryStatus} /> : null}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
