import type { Board, BoardLead } from "@/types/crm";

/**
 * Regras puras do quadro Kanban, usadas na atualização otimista (navegador) e testadas
 * isoladamente. O servidor aplica a mesma lógica de reordenação dentro de uma transação.
 */

export function findLead(board: Board, leadId: string): BoardLead | undefined {
  for (const stage of board) {
    const lead = stage.leads.find((item) => item.id === leadId);
    if (lead) return lead;
  }
  return undefined;
}

/**
 * Move o lead para a coluna `toStageId`, na posição `toIndex` (limitada ao tamanho da coluna).
 * Devolve um novo quadro com as posições renumeradas (0, 1, 2...) nas colunas afetadas.
 */
export function moveLead(board: Board, leadId: string, toStageId: string, toIndex: number): Board {
  const lead = findLead(board, leadId);
  const target = board.find((stage) => stage.id === toStageId);
  if (!lead || !target) return board;

  const renumber = (leads: BoardLead[], stageId: string) =>
    leads.map((item, position) => ({ ...item, stageId, position }));

  return board.map((stage) => {
    const withoutLead = stage.leads.filter((item) => item.id !== leadId);
    if (stage.id !== toStageId) {
      return withoutLead.length === stage.leads.length
        ? stage
        : { ...stage, leads: renumber(withoutLead, stage.id) };
    }
    const index = Math.max(0, Math.min(toIndex, withoutLead.length));
    const leads = [...withoutLead.slice(0, index), lead, ...withoutLead.slice(index)];
    return { ...stage, leads: renumber(leads, stage.id) };
  });
}

/** Soma dos valores da coluna, em centavos (leads sem valor contam como zero). */
export function stageTotalCents(leads: BoardLead[]): number {
  return leads.reduce((sum, lead) => sum + (lead.valueCents ?? 0), 0);
}
