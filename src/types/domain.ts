/**
 * Tipos de domínio compartilhados (ver docs/modelo-de-dados.md).
 * Datas trafegam como string ISO 8601 para serem serializáveis entre servidor e cliente.
 */

export type ConversationStatus = "open" | "pending" | "resolved";
export type Assignee = "ai" | "human";
export type MessageDirection = "inbound" | "outbound";
export type MessageAuthor = "contact" | "ai" | "user";
export type DeliveryStatus = "sent" | "delivered" | "read" | "failed";

export type Contact = {
  id: string;
  workspaceId: string;
  name: string;
  /** Telefone em E.164 (ex.: +5511900000001). */
  phoneE164: string;
  city: string;
  tags: string[];
  optIn: boolean;
  createdAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  author: MessageAuthor;
  content: string;
  deliveryStatus?: DeliveryStatus;
  createdAt: string;
};

export type Conversation = {
  id: string;
  workspaceId: string;
  contactId: string;
  status: ConversationStatus;
  assignee: Assignee;
  assignedUserName?: string;
  unreadCount: number;
  /** Etapa do lead no CRM, quando houver. */
  leadStage?: string;
  /** Motivo registrado quando a IA transfere para a equipe. */
  handoffReason?: string;
  lastMessageAt: string;
  lastInboundAt: string;
};

/** Item da caixa de entrada: conversa + contato + prévia da última mensagem. */
export type ConversationSummary = Conversation & {
  contact: Contact;
  lastMessage: Pick<Message, "author" | "content">;
};

export type ConversationDetail = {
  conversation: Conversation;
  contact: Contact;
  messages: Message[];
};
