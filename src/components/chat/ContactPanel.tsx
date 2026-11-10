import type { ReactNode } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { formatLongDate, formatPhone, formatTime } from "@/lib/utils/format";
import type { Contact, Conversation } from "@/types/domain";

type ContactPanelProps = {
  contact: Contact;
  conversation: Conversation;
  windowOpen: boolean;
  windowExpiresAt: string;
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

/** Painel lateral com dados do contato e do atendimento (visível em telas largas). */
export function ContactPanel({
  contact,
  conversation,
  windowOpen,
  windowExpiresAt,
}: ContactPanelProps) {
  return (
    <aside
      aria-label="Dados do contato"
      className="hidden w-64 shrink-0 flex-col gap-6 overflow-y-auto border-l bg-surface p-5 xl:flex"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <Avatar name={contact.name} size="lg" />
        <p className="font-semibold">{contact.name}</p>
        <p className="text-sm text-muted-foreground tabular-nums">
          {formatPhone(contact.phoneE164)}
        </p>
      </div>

      <dl className="flex flex-col gap-4">
        <Field label="Cidade">{contact.city}</Field>
        <Field label="Etapa no CRM">{conversation.leadStage ?? "Sem lead vinculado"}</Field>
        <Field label="Janela de 24 h">
          {windowOpen ? (
            <>Aberta até {formatTime(windowExpiresAt)}</>
          ) : (
            <span className="text-warning">Encerrada — apenas templates</span>
          )}
        </Field>
        <Field label="Consentimento (opt-in)">{contact.optIn ? "Sim" : "Não"}</Field>
        <Field label="Contato desde">{formatLongDate(contact.createdAt)}</Field>
        <Field label="Etiquetas">
          <span className="mt-1 flex flex-wrap gap-1">
            {contact.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </span>
        </Field>
      </dl>
    </aside>
  );
}
