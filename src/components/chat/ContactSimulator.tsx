"use client";

import { FlaskConical, LoaderCircle } from "lucide-react";
import { useId, useState, useTransition, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { simulateContactMessage } from "@/server/actions/conversationActions";

type ContactSimulatorProps = {
  conversationId: string;
  contactName: string;
  aiActive: boolean;
};

/**
 * Modo demonstração: escreve como se fosse o contato no WhatsApp. A mensagem passa pelo mesmo
 * caminho do webhook real e, se a IA conduz a conversa, o agente responde.
 */
export function ContactSimulator({ conversationId, contactName, aiActive }: ContactSimulatorProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputId = useId();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;
    setError(null);
    startTransition(async () => {
      const result = await simulateContactMessage(conversationId, value);
      if (result.ok) setText("");
      else setError(result.error);
    });
  };

  return (
    <details className="group border-t bg-muted/40 text-sm">
      <summary className="flex cursor-pointer items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
        <FlaskConical className="size-3.5" aria-hidden="true" />
        Simular mensagem de {contactName} (modo demonstração)
      </summary>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 px-4 pb-3">
        <div className="flex items-center gap-2">
          <label htmlFor={inputId} className="sr-only">
            Mensagem do contato
          </label>
          <input
            id={inputId}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Ex.: Quero um orçamento para cozinha"
            disabled={isPending}
            maxLength={4096}
            className="h-9 flex-1 rounded-lg border bg-background px-3 text-sm placeholder:text-muted-foreground"
          />
          <Button type="submit" size="sm" variant="secondary" disabled={isPending || !text.trim()}>
            {isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
            Enviar como contato
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground" aria-live="polite">
          {isPending
            ? aiActive
              ? "Mensagem recebida. O agente de IA está respondendo..."
              : "Mensagem recebida."
            : aiActive
              ? "A IA conduz esta conversa e vai responder automaticamente."
              : "A equipe conduz esta conversa: a IA não responde."}
        </p>
        {error ? (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        ) : null}
      </form>
    </details>
  );
}
