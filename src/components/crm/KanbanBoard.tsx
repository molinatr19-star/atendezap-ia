"use client";

import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { X } from "lucide-react";
import { useId, useLayoutEffect, useOptimistic, useRef, useState, useTransition } from "react";

import { findLead, moveLead, stageTotalCents } from "@/features/crm/board";
import { formatCurrencyCents } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { moveLeadAction } from "@/server/actions/crmActions";
import type { Board, BoardStage } from "@/types/crm";

import { LeadCard } from "./LeadCard";

const STAGE_PREFIX = "stage:";

type Move = { leadId: string; stageId: string; index: number };

type KanbanBoardProps = {
  board: Board;
  now: number;
};

/**
 * Funil de vendas em Kanban. Arrastar (mouse, toque ou teclado) ou usar "Mover para".
 * A tela muda na hora (useOptimistic com a mesma regra pura de features/crm/board.ts) e o
 * servidor confirma; em caso de erro, o quadro volta sozinho e o aviso aparece.
 */
export function KanbanBoard({ board, now }: KanbanBoardProps) {
  const dndId = useId(); // id estável evita diferença de ids entre servidor e navegador
  const [view, applyMove] = useOptimistic<Board, Move>(board, (state, move) =>
    moveLead(state, move.leadId, move.stageId, move.index),
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startTransition] = useTransition();

  // Coluna "sob" o card durante o arraste por teclado (lida só em eventos, nunca no render).
  const viewRef = useRef(view);
  const keyboardStageRef = useRef<string | null>(null);
  useLayoutEffect(() => {
    viewRef.current = view;
  }, [view]);

  /**
   * Teclado em várias colunas: ← e → pulam para a coluna vizinha (inclusive vazia ou fora da
   * área visível); ↑ e ↓ reordenam dentro da coluna. O padrão do dnd-kit só cobre uma lista.
   */
  const keyboardCoordinates: KeyboardCoordinateGetter = (event, args) => {
    if (event.code !== "ArrowRight" && event.code !== "ArrowLeft") {
      return sortableKeyboardCoordinates(event, args);
    }
    const stages = viewRef.current;
    const currentIndex = stages.findIndex((stage) => stage.id === keyboardStageRef.current);
    const next = stages[currentIndex + (event.code === "ArrowRight" ? 1 : -1)];
    if (currentIndex === -1 || !next) return undefined;
    const rect = args.context.droppableRects.get(`${STAGE_PREFIX}${next.id}`);
    if (!rect) return undefined;
    event.preventDefault();
    keyboardStageRef.current = next.id;
    // Topo da coluna: o card entra no início da lista de destino.
    return { x: rect.left + 8, y: rect.top + 8 };
  };

  const sensors = useSensors(
    // Distância mínima: um clique simples não vira arraste.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: keyboardCoordinates }),
  );

  const stageName = (stageId: string) => view.find((stage) => stage.id === stageId)?.name ?? "";
  const leadName = (id: string | number) => findLead(view, String(id))?.contactName ?? "lead";

  const commit = (move: Move) => {
    setError(null);
    startTransition(async () => {
      applyMove(move);
      const result = await moveLeadAction(move.leadId, move.stageId, move.index);
      if (!result.ok) setError(result.error);
    });
  };

  /** Converte o alvo do arraste (coluna ou outro card) em etapa + posição. */
  const resolveTarget = (overId: string): Move | null => {
    if (!activeId) return null;
    if (overId.startsWith(STAGE_PREFIX)) {
      const stageId = overId.slice(STAGE_PREFIX.length);
      const stage = view.find((item) => item.id === stageId);
      if (!stage) return null;
      const length = stage.leads.filter((lead) => lead.id !== activeId).length;
      return { leadId: activeId, stageId, index: length };
    }
    const overLead = findLead(view, overId);
    if (!overLead) return null;
    const stage = view.find((item) => item.id === overLead.stageId);
    const index = stage?.leads.findIndex((lead) => lead.id === overId) ?? 0;
    return { leadId: activeId, stageId: overLead.stageId, index };
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    setActiveId(id);
    keyboardStageRef.current = findLead(view, id)?.stageId ?? null;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const target = event.over ? resolveTarget(String(event.over.id)) : null;
    setActiveId(null);
    if (!target) return;
    const current = findLead(view, target.leadId);
    if (current && current.stageId === target.stageId && current.position === target.index) return;
    commit(target);
  };

  const describeOver = (overId: string | number | undefined) => {
    if (overId === undefined) return "fora de uma coluna";
    const id = String(overId);
    if (id.startsWith(STAGE_PREFIX)) return `coluna ${stageName(id.slice(STAGE_PREFIX.length))}`;
    const lead = findLead(view, id);
    return lead ? `coluna ${stageName(lead.stageId)}, junto de ${lead.contactName}` : "coluna";
  };

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Lead ${leadName(active.id)} selecionado para mover.`,
    onDragOver: ({ active, over }) => `${leadName(active.id)} sobre ${describeOver(over?.id)}.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `${leadName(active.id)} movido para ${describeOver(over.id)}.`
        : "Movimento cancelado.",
    onDragCancel: ({ active }) => `Movimento de ${leadName(active.id)} cancelado.`,
  };

  const activeLead = activeId ? findLead(view, activeId) : undefined;
  const stageOptions = view.map(({ id, name }) => ({ id, name }));

  return (
    <div className="flex flex-col gap-3">
      <p role="status" className="min-h-5 text-xs text-muted-foreground">
        {isSaving ? "Salvando alterações…" : ""}
      </p>
      {error ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm"
        >
          <span className="flex-1">
            <strong className="font-semibold text-danger">Não foi salvo:</strong> {error}
          </span>
          <button type="button" onClick={() => setError(null)} aria-label="Fechar aviso">
            <X className="size-4" />
          </button>
        </div>
      ) : null}

      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable:
              "Para mover o lead, pressione espaço ou Enter. Use as setas para mudar de posição ou de coluna, espaço ou Enter para soltar e Esc para cancelar.",
          },
        }}
      >
        <div className="flex gap-4 overflow-x-auto pb-4" role="list" aria-label="Etapas do funil">
          {view.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              stages={stageOptions}
              now={now}
              onMoveToStage={(leadId, stageId) => {
                const target = view.find((item) => item.id === stageId);
                commit({ leadId, stageId, index: target?.leads.length ?? 0 });
              }}
            />
          ))}
        </div>

        <DragOverlay>
          {activeLead ? (
            <LeadCard
              lead={activeLead}
              stages={stageOptions}
              now={now}
              onMoveToStage={() => {}}
              overlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

type KanbanColumnProps = {
  stage: BoardStage;
  stages: Pick<BoardStage, "id" | "name">[];
  now: number;
  onMoveToStage: (leadId: string, stageId: string) => void;
};

function KanbanColumn({ stage, stages, now, onMoveToStage }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `${STAGE_PREFIX}${stage.id}` });
  const total = stageTotalCents(stage.leads);

  return (
    <section
      role="listitem"
      aria-label={`Etapa ${stage.name}, ${stage.leads.length} leads`}
      className="flex w-72 shrink-0 flex-col rounded-(--radius-card) border bg-muted/40"
    >
      <header className="flex items-baseline justify-between gap-2 border-b px-3 py-2.5">
        <h2 className="text-sm font-semibold">
          {stage.name}{" "}
          <span className="font-normal text-muted-foreground tabular-nums">
            ({stage.leads.length})
          </span>
        </h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatCurrencyCents(total)}
        </span>
      </header>
      <SortableContext
        items={stage.leads.map((lead) => lead.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={cn(
            "flex min-h-32 flex-1 flex-col gap-2 p-2 transition-colors",
            isOver && "bg-primary-soft/40",
          )}
        >
          {stage.leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              stages={stages}
              now={now}
              onMoveToStage={onMoveToStage}
            />
          ))}
          {stage.leads.length === 0 ? (
            <p className="m-auto px-4 py-6 text-center text-xs text-muted-foreground">
              Arraste um lead para cá.
            </p>
          ) : null}
        </div>
      </SortableContext>
    </section>
  );
}
