"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useId } from "react";

import { Badge } from "@/components/ui/Badge";
import { formatCurrencyCents, formatRelative } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { BoardLead, BoardStage } from "@/types/crm";

type LeadCardProps = {
  lead: BoardLead;
  stages: Pick<BoardStage, "id" | "name">[];
  now: number;
  onMoveToStage: (leadId: string, stageId: string) => void;
  /** Versão estática usada na sobreposição durante o arraste. */
  overlay?: boolean;
};

export function LeadCard({ lead, stages, now, onMoveToStage, overlay = false }: LeadCardProps) {
  const selectId = useId();
  const sortable = useSortable({ id: lead.id, data: { stageId: lead.stageId }, disabled: overlay });

  const style = overlay
    ? undefined
    : { transform: CSS.Translate.toString(sortable.transform), transition: sortable.transition };

  return (
    <article
      ref={overlay ? undefined : sortable.setNodeRef}
      style={style}
      aria-label={`Lead ${lead.contactName}`}
      className={cn(
        "flex flex-col gap-2 rounded-lg border bg-surface p-3 text-sm shadow-xs",
        sortable.isDragging && !overlay && "opacity-40",
        overlay && "rotate-1 shadow-lg ring-2 ring-ring",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          ref={overlay ? undefined : sortable.setActivatorNodeRef}
          {...(overlay ? {} : sortable.attributes)}
          {...(overlay ? {} : sortable.listeners)}
          aria-label={`Arrastar lead ${lead.contactName}`}
          className="mt-0.5 -ml-1 cursor-grab touch-none rounded text-muted-foreground hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{lead.contactName}</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {lead.valueCents !== null ? formatCurrencyCents(lead.valueCents) : "Sem valor estimado"}
          </p>
        </div>
      </div>

      {lead.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {lead.tags.slice(0, 3).map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2 border-t pt-2 text-xs text-muted-foreground">
        {lead.conversationId ? (
          <Link
            href={`/conversas/${lead.conversationId}`}
            className="inline-flex items-center gap-1 rounded hover:text-foreground"
          >
            <MessageSquare className="size-3.5" aria-hidden="true" />
            {lead.lastInteractionAt ? formatRelative(lead.lastInteractionAt, now) : "Conversa"}
          </Link>
        ) : (
          <span>Sem conversa</span>
        )}
        {overlay ? null : (
          <>
            <label htmlFor={selectId} className="sr-only">
              Mover {lead.contactName} para
            </label>
            <select
              id={selectId}
              value={lead.stageId}
              onChange={(event) => onMoveToStage(lead.id, event.target.value)}
              className="max-w-28 rounded border bg-background px-1 py-0.5 text-xs"
            >
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          </>
        )}
      </div>
    </article>
  );
}
