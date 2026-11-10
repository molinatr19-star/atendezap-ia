"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useTransition } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { formatRelative } from "@/lib/utils/format";
import { markConversationRead } from "@/server/actions/conversationActions";
import { cn } from "@/lib/utils/cn";
import type { ConversationSummary, MessageAuthor } from "@/types/domain";

import { AssigneeBadge } from "./ConversationBadges";

type FilterKey = "open" | "ai" | "human" | "resolved";

const FILTERS: {
  key: FilterKey;
  label: string;
  matches: (summary: ConversationSummary) => boolean;
}[] = [
  { key: "open", label: "Abertas", matches: (s) => s.status !== "resolved" },
  { key: "ai", label: "Com a IA", matches: (s) => s.status !== "resolved" && s.assignee === "ai" },
  {
    key: "human",
    label: "Com a equipe",
    matches: (s) => s.status !== "resolved" && s.assignee === "human",
  },
  { key: "resolved", label: "Resolvidas", matches: (s) => s.status === "resolved" },
];

const AUTHOR_PREFIX: Record<MessageAuthor, string> = { contact: "", ai: "IA: ", user: "Equipe: " };

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

type ConversationListProps = {
  summaries: ConversationSummary[];
  /** Hora da requisição, calculada no servidor (tempos relativos iguais no SSR e no navegador). */
  now: number;
};

export function ConversationList({ summaries, now }: ConversationListProps) {
  const params = useParams<{ id?: string }>();
  const [filter, setFilter] = useState<FilterKey>("open");
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();

  // Lista vem do banco já ordenada; as ações do chat chamam refresh() e ela é recarregada.
  const merged = summaries;

  const openConversation = (summary: ConversationSummary) => {
    if (summary.unreadCount === 0) return;
    startTransition(async () => {
      await markConversationRead(summary.id);
    });
  };

  const search = normalize(query.trim());
  const searchDigits = query.replace(/\D/g, "");
  const activeFilter = FILTERS.find((entry) => entry.key === filter) ?? FILTERS[0];
  const visible = merged.filter(
    (summary) =>
      activeFilter.matches(summary) &&
      (search === "" ||
        normalize(summary.contact.name).includes(search) ||
        (searchDigits !== "" && summary.contact.phoneE164.includes(searchDigits))),
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-3 border-b p-4">
        <h1 className="text-lg font-semibold">Conversas</h1>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome ou telefone"
            aria-label="Buscar conversas por nome ou telefone"
            className="h-9 w-full rounded-lg border bg-background pr-3 pl-9 text-sm placeholder:text-muted-foreground"
          />
        </div>
        <div role="group" aria-label="Filtrar conversas" className="flex gap-1 overflow-x-auto">
          {FILTERS.map((entry) => {
            const count = merged.filter(entry.matches).length;
            const selected = entry.key === filter;
            return (
              <button
                key={entry.key}
                type="button"
                aria-pressed={selected}
                onClick={() => setFilter(entry.key)}
                className={cn(
                  "shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  selected
                    ? "bg-primary-soft text-primary-soft-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {entry.label} <span className="tabular-nums">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">
          Nenhuma conversa encontrada com esse filtro.
        </p>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto" aria-label="Lista de conversas">
          {visible.map((summary) => {
            const selected = params.id === summary.id;
            const unread = summary.unreadCount > 0;
            return (
              <li key={summary.id} className="border-b last:border-b-0">
                <Link
                  href={`/conversas/${summary.id}`}
                  aria-current={selected ? "page" : undefined}
                  onClick={() => openConversation(summary)}
                  className={cn(
                    "flex gap-3 px-4 py-3 transition-colors",
                    selected ? "bg-primary-soft/60" : "hover:bg-muted",
                  )}
                >
                  <Avatar name={summary.contact.name} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span
                        className={cn("truncate text-sm", unread ? "font-semibold" : "font-medium")}
                      >
                        {summary.contact.name}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {formatRelative(summary.lastMessageAt, now)}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 block truncate text-xs",
                        unread ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {AUTHOR_PREFIX[summary.lastMessage.author]}
                      {summary.lastMessage.content}
                    </span>
                    <span className="mt-1.5 flex items-center gap-1.5">
                      <AssigneeBadge
                        assignee={summary.assignee}
                        userName={summary.assignedUserName}
                      />
                      {summary.status === "pending" ? (
                        <span className="text-[11px] font-medium text-warning">Aguardando</span>
                      ) : null}
                      {unread ? (
                        <span className="ml-auto rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular-nums">
                          {summary.unreadCount}
                          <span className="sr-only"> mensagens não lidas</span>
                        </span>
                      ) : null}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
