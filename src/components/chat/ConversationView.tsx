"use client";

import { ArrowLeft, Bot, CheckCircle2, Info, RotateCcw, UserRoundCheck, X } from "lucide-react";
import Link from "next/link";

import { Avatar } from "@/components/ui/Avatar";
import { Button, buttonVariants } from "@/components/ui/Button";
import { useConversation } from "@/features/conversas/useConversation";
import { windowExpiresAt } from "@/features/conversas/window";
import { formatPhone } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { ConversationDetail } from "@/types/domain";

import { Composer } from "./Composer";
import { ContactSimulator } from "./ContactSimulator";
import { ContactPanel } from "./ContactPanel";
import { AssigneeBadge, StatusBadge } from "./ConversationBadges";
import { MessageList } from "./MessageList";

type ConversationViewProps = {
  detail: ConversationDetail;
  /** Hora da requisição, calculada no servidor. */
  now: number;
};

export function ConversationView({ detail, now }: ConversationViewProps) {
  const {
    conversation,
    contact,
    messages,
    windowOpen,
    sendBlockReason,
    isPending,
    error,
    dismissError,
    send,
    takeOver,
    returnToAi,
    resolve,
    reopen,
  } = useConversation(detail, now);
  const resolved = conversation.status === "resolved";

  return (
    // data-conversation-open: no mobile, o layout esconde a lista via CSS quando há conversa aberta.
    <div data-conversation-open className="flex min-h-0 min-w-0 flex-1">
      {/* @container: o cabeçalho se adapta à largura da coluna do chat, não à da janela. */}
      <div className="@container flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b bg-surface px-3 py-3 sm:px-4">
          <Link
            href="/conversas"
            aria-label="Voltar para a lista de conversas"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "md:hidden")}
          >
            <ArrowLeft />
          </Link>
          <Avatar name={contact.name} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-semibold">{contact.name}</h2>
            <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span className="whitespace-nowrap tabular-nums">
                {formatPhone(contact.phoneE164)}
              </span>
              <AssigneeBadge
                assignee={conversation.assignee}
                userName={conversation.assignedUserName}
              />
              <StatusBadge status={conversation.status} />
            </p>
          </div>
          <div
            className="flex w-full items-center gap-2 @2xl:w-auto"
            aria-busy={isPending || undefined}
          >
            {!resolved && conversation.assignee === "ai" ? (
              <Button size="sm" onClick={takeOver}>
                <UserRoundCheck aria-hidden="true" />
                Assumir
              </Button>
            ) : null}
            {!resolved && conversation.assignee === "human" ? (
              <Button size="sm" variant="secondary" onClick={returnToAi}>
                <Bot aria-hidden="true" />
                Devolver para IA
              </Button>
            ) : null}
            {resolved ? (
              <Button size="sm" variant="secondary" onClick={reopen}>
                <RotateCcw aria-hidden="true" />
                Reabrir
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={resolve}>
                <CheckCircle2 aria-hidden="true" />
                Resolver
              </Button>
            )}
          </div>
        </header>

        {conversation.handoffReason && conversation.assignee === "human" && !resolved ? (
          <p className="flex items-start gap-2 border-b bg-warning/10 px-4 py-2 text-xs text-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden="true" />
            <span>
              <strong className="font-semibold">Transferida pela IA:</strong>{" "}
              {conversation.handoffReason}
            </span>
          </p>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2 border-b bg-danger/10 px-4 py-2 text-xs text-foreground"
          >
            <span className="flex-1">
              <strong className="font-semibold text-danger">Não foi salvo:</strong> {error}
            </span>
            <button
              type="button"
              onClick={dismissError}
              aria-label="Fechar aviso"
              className="rounded text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : null}

        <MessageList messages={messages} now={now} />

        <ContactSimulator
          conversationId={conversation.id}
          contactName={contact.name.split(" ")[0]}
          aiActive={conversation.assignee === "ai" && !resolved}
        />

        <Composer
          blockReason={sendBlockReason}
          onSend={send}
          onTakeOver={takeOver}
          onReopen={reopen}
        />
      </div>

      <ContactPanel
        contact={contact}
        conversation={conversation}
        windowOpen={windowOpen}
        windowExpiresAt={windowExpiresAt(conversation.lastInboundAt)}
      />
    </div>
  );
}
