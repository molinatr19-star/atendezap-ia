import { Bot, FlaskConical, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { AgentSettingsForm, type AgentFormValues } from "@/components/agentes/AgentSettingsForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { getNavItem } from "@/config/navigation";
import { canManageWorkspace, requireUser } from "@/server/session";
import { getAgentSettings } from "@/server/services/agentService";

export const metadata: Metadata = { title: "Agentes de IA" };

const DEFAULTS: AgentFormValues = {
  name: "Aurora",
  persona: "",
  instructions: "",
  handoffRules: "",
  active: true,
};

export default function AgentesPage() {
  const nav = getNavItem("/agentes");
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={nav.title} description={nav.description} />
      <Suspense fallback={<Skeleton className="h-[36rem] w-full rounded-(--radius-card)" />}>
        <AgentSettingsContent />
      </Suspense>
    </div>
  );
}

async function AgentSettingsContent() {
  const user = await requireUser();
  const { settings, engine } = await getAgentSettings(user.workspaceId);
  const canEdit = canManageWorkspace(user);
  const initial: AgentFormValues = settings ?? DEFAULTS;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="min-w-0 lg:col-span-2">
        <CardHeader>
          <CardTitle>Configuração do agente</CardTitle>
          <p className="text-sm text-muted-foreground">
            Estes textos formam as instruções que o agente segue em todas as conversas.
          </p>
        </CardHeader>
        <CardContent>
          <AgentSettingsForm initial={initial} readOnly={!canEdit} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Motor de IA</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {engine.kind === "claude" ? (
              <p className="flex items-start gap-2">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  <strong className="font-semibold">Claude API conectada.</strong> Modelo{" "}
                  <code className="rounded bg-muted px-1 text-xs">{engine.model}</code>, esforço{" "}
                  <code className="rounded bg-muted px-1 text-xs">{engine.effort}</code>.
                </span>
              </p>
            ) : (
              <p className="flex items-start gap-2">
                <FlaskConical className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
                <span>
                  <strong className="font-semibold">Modo simulado.</strong> Sem{" "}
                  <code className="rounded bg-muted px-1 text-xs">ANTHROPIC_API_KEY</code> no .env,
                  o agente usa respostas prontas, mas transfere, etiqueta e move leads de verdade.
                </span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Como testar</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <Bot className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Abra uma conversa conduzida pela IA em Conversas e use “Simular mensagem do contato”.
            </p>
            <p>Peça um atendente para ver a transferência automática para a equipe.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
