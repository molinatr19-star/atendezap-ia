import type { Metadata } from "next";
import { Suspense } from "react";

import { AttendanceSplitCard } from "@/components/dashboard/AttendanceSplitCard";
import { ConversationVolumeChart } from "@/components/dashboard/ConversationVolumeChart";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { HourlyActivityChart } from "@/components/dashboard/HourlyActivityChart";
import { PendingConversationsList } from "@/components/dashboard/PendingConversationsList";
import { PeriodFilter } from "@/components/dashboard/PeriodFilter";
import { StatTile } from "@/components/dashboard/StatTile";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getNavItem } from "@/config/navigation";
import { parsePeriod } from "@/features/dashboard/period";
import { getDashboardMetrics } from "@/server/services/metricsService";
import { getRequestTime } from "@/server/requestTime";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const nav = getNavItem("/dashboard");
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={nav.title}
        description={`${nav.description} Histórico fictício do seed + atendimentos resolvidos no painel.`}
      />
      {/* searchParams só existe na requisição: o conteúdo transmite dentro do Suspense. */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function DashboardContent({ searchParams }: Pick<PageProps<"/dashboard">, "searchParams">) {
  const period = parsePeriod((await searchParams).periodo);
  const user = await requireUser();
  const now = await getRequestTime();
  const metrics = await getDashboardMetrics(period, now, user.workspaceId);
  const comparisonLabel = `vs. ${metrics.periodDays} dias anteriores`;

  return (
    <div className="flex flex-col gap-6">
      <PeriodFilter value={period} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.kpis.map((kpi) => (
          <StatTile key={kpi.id} kpi={kpi} comparisonLabel={comparisonLabel} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader>
            <CardTitle>Atendimentos por dia</CardTitle>
            <p className="text-sm text-muted-foreground">
              Últimos {metrics.periodDays} dias, incluindo hoje.
            </p>
          </CardHeader>
          <CardContent>
            <ConversationVolumeChart points={metrics.daily} />
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>IA x equipe</CardTitle>
            <p className="text-sm text-muted-foreground">Quem encerrou as conversas do período.</p>
          </CardHeader>
          <CardContent>
            <AttendanceSplitCard split={metrics.attendance} />
          </CardContent>
        </Card>

        <Card className="min-w-0 lg:col-span-2">
          <CardHeader>
            <CardTitle>Horários de maior movimento</CardTitle>
            <p className="text-sm text-muted-foreground">
              Atendimentos iniciados por hora do dia, no período.
            </p>
          </CardHeader>
          <CardContent>
            <HourlyActivityChart points={metrics.hourly} />
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Aguardando a equipe</CardTitle>
            <p className="text-sm text-muted-foreground">
              Transferidas pela IA e ainda sem resposta.
            </p>
          </CardHeader>
          <CardContent>
            <PendingConversationsList rows={metrics.pending} now={now} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
