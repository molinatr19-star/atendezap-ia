"use client";

import { Bot, CheckCircle2, Clock, SendHorizontal } from "lucide-react";
import { useId, useState, type FormEvent, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/Button";
import type { SendBlockReason } from "@/features/conversas/rules";
import { MAX_MESSAGE_LENGTH } from "@/features/conversas/messageSchema";

type ComposerProps = {
  blockReason: SendBlockReason;
  onSend: (text: string) => string | null;
  onTakeOver: () => void;
  onReopen: () => void;
};

/** Campo de resposta. Quando o envio não é permitido, explica o motivo e oferece a ação certa. */
export function Composer({ blockReason, onSend, onTakeOver, onReopen }: ComposerProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const hintId = useId();
  const errorId = useId();

  if (blockReason) {
    return (
      <div className="flex flex-col items-start gap-3 border-t bg-surface p-4 text-sm sm:flex-row sm:items-center">
        {blockReason === "ai-assigned" ? (
          <>
            <p className="flex flex-1 items-center gap-2 text-muted-foreground">
              <Bot className="size-4 shrink-0" aria-hidden="true" />A IA está conduzindo esta
              conversa. Assuma para responder.
            </p>
            <Button onClick={onTakeOver}>Assumir conversa</Button>
          </>
        ) : blockReason === "resolved" ? (
          <>
            <p className="flex flex-1 items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
              Conversa resolvida.
            </p>
            <Button variant="secondary" onClick={onReopen}>
              Reabrir conversa
            </Button>
          </>
        ) : (
          <p className="flex flex-1 items-start gap-2 text-muted-foreground">
            <Clock className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />A janela de
            24 h do WhatsApp terminou. Fora dela, só é possível enviar modelos de mensagem
            (templates) aprovados — recurso previsto para uma próxima etapa.
          </p>
        )}
      </div>
    );
  }

  const submit = () => {
    const result = onSend(text);
    setError(result);
    if (result === null) setText("");
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit();
  };

  // Enter envia; Shift+Enter quebra linha (padrão de apps de mensagem).
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t bg-surface p-3 sm:p-4">
      <div className="flex items-end gap-2">
        <label htmlFor={`${hintId}-input`} className="sr-only">
          Mensagem
        </label>
        <textarea
          id={`${hintId}-input`}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          rows={2}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder="Escreva uma resposta..."
          aria-describedby={error ? `${errorId} ${hintId}` : hintId}
          aria-invalid={error ? true : undefined}
          className="max-h-40 min-h-11 flex-1 resize-y rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
        />
        <Button type="submit" size="icon" aria-label="Enviar mensagem" className="size-11">
          <SendHorizontal />
        </Button>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      ) : null}
      <p id={hintId} className="mt-2 text-[11px] text-muted-foreground">
        Modo simulado: a mensagem aparece aqui, mas não é enviada ao WhatsApp. Enter envia,
        Shift+Enter quebra a linha.
      </p>
    </form>
  );
}
