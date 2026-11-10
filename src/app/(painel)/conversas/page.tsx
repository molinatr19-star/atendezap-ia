import { MessagesSquare } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Conversas" };

export default function ConversasPage() {
  return (
    <EmptyState
      icon={MessagesSquare}
      title="Selecione uma conversa"
      description="Escolha uma conversa na lista para ver o histórico, assumir o atendimento ou responder."
      className="m-6 flex-1 border-none"
    />
  );
}
