export type BoardLead = {
  id: string;
  stageId: string;
  position: number;
  contactId: string;
  contactName: string;
  /** Valor estimado em centavos. */
  valueCents: number | null;
  tags: string[];
  /** Conversa mais recente do contato (para abrir direto do card). */
  conversationId?: string;
  lastInteractionAt?: string;
};

export type BoardStage = {
  id: string;
  name: string;
  position: number;
  leads: BoardLead[];
};

export type Board = BoardStage[];
