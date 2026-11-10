import { CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";

import { formatRelative } from "@/lib/utils/format";
import type { PendingConversationRow } from "@/types/analytics";

type PendingConversationsListProps = {
  rows: PendingConversationRow[];
  now: number;
};

/** Conversas transferidas para a equipe e ainda sem resposta, da mais antiga para a mais recente. */
export function PendingConversationsList({ rows, now }: PendingConversationsListProps) {
  if (rows.length === 0) {
    return (
      <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
        Nenhuma conversa aguardando a equipe.
      </p>
    );
  }

  return (
    <ul className="-mx-2 flex flex-col">
      {rows.map((row) => (
        <li key={row.conversationId}>
          <Link
            href={`/conversas/${row.conversationId}`}
            className="flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-muted"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{row.contactName}</span>
              <span className="block truncate text-xs text-muted-foreground">{row.reason}</span>
            </span>
            <span className="shrink-0 text-xs font-medium text-warning tabular-nums">
              há {formatRelative(row.waitingSince, now)}
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
