import { Bot, CheckCircle2, Clock, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import type { Assignee, ConversationStatus } from "@/types/domain";

export function AssigneeBadge({ assignee, userName }: { assignee: Assignee; userName?: string }) {
  return assignee === "ai" ? (
    <Badge variant="primary">
      <Bot aria-hidden="true" />
      IA
    </Badge>
  ) : (
    <Badge>
      <UserRound aria-hidden="true" />
      {userName ?? "Equipe"}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: ConversationStatus }) {
  if (status === "pending") {
    return (
      <Badge variant="warning">
        <Clock aria-hidden="true" />
        Aguardando equipe
      </Badge>
    );
  }
  if (status === "resolved") {
    return (
      <Badge variant="success">
        <CheckCircle2 aria-hidden="true" />
        Resolvida
      </Badge>
    );
  }
  return null;
}
