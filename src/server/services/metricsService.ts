import { periodDays } from "@/features/dashboard/period";
import { DAY_MS, localDayKey, startOfLocalDay } from "@/lib/utils/time";
import { analyticsRepository } from "@/server/repositories/analyticsRepository";
import { listConversationSummaries } from "@/server/services/conversationService";
import type {
  AttendanceRecord,
  AttendanceSplit,
  DailyPoint,
  DashboardMetrics,
  HourlyPoint,
  Kpi,
  PendingConversationRow,
  PeriodKey,
} from "@/types/analytics";

type PeriodTotals = {
  conversations: number;
  avgFirstResponseSeconds: number;
  aiResolutionPercent: number;
  leads: number;
};

function summarize(records: readonly AttendanceRecord[]): PeriodTotals {
  const total = records.length;
  if (total === 0) {
    return { conversations: 0, avgFirstResponseSeconds: 0, aiResolutionPercent: 0, leads: 0 };
  }
  const responseSum = records.reduce((sum, record) => sum + record.firstResponseSeconds, 0);
  const aiCount = records.filter((record) => record.resolvedBy === "ai").length;
  return {
    conversations: total,
    avgFirstResponseSeconds: responseSum / total,
    aiResolutionPercent: (aiCount / total) * 100,
    leads: records.filter((record) => record.leadCreated).length,
  };
}

function buildKpis(current: PeriodTotals, previous: PeriodTotals): Kpi[] {
  return [
    {
      id: "conversations",
      label: "Atendimentos",
      definition: "Atendimentos encerrados (pela IA ou pela equipe) que começaram no período.",
      unit: "count",
      polarity: "higher-is-better",
      value: current.conversations,
      previousValue: previous.conversations,
    },
    {
      id: "first-response",
      label: "Tempo médio da 1ª resposta",
      definition:
        "Média do tempo entre a primeira mensagem do contato e a primeira resposta (IA ou equipe).",
      unit: "seconds",
      polarity: "lower-is-better",
      value: current.avgFirstResponseSeconds,
      previousValue: previous.avgFirstResponseSeconds,
    },
    {
      id: "ai-resolution",
      label: "Resolvidas pela IA",
      definition: "Percentual de conversas encerradas pela IA, sem transferência para a equipe.",
      unit: "percent",
      polarity: "higher-is-better",
      value: current.aiResolutionPercent,
      previousValue: previous.aiResolutionPercent,
    },
    {
      id: "leads",
      label: "Novos leads",
      definition: "Contatos que entraram no funil do CRM a partir de uma conversa.",
      unit: "count",
      polarity: "higher-is-better",
      value: current.leads,
      previousValue: previous.leads,
    },
  ];
}

function buildDaily(
  records: readonly AttendanceRecord[],
  fromMs: number,
  days: number,
): DailyPoint[] {
  const counts = new Map<string, number>();
  for (const record of records) {
    const key = localDayKey(record.startedAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  // Dias sem conversas aparecem com zero, para o eixo do tempo não "pular" datas.
  return Array.from({ length: days }, (_, index) => {
    const day = localDayKey(fromMs + index * DAY_MS);
    return { day, conversations: counts.get(day) ?? 0 };
  });
}

function buildHourly(records: readonly AttendanceRecord[]): HourlyPoint[] {
  const counts = Array.from({ length: 24 }, () => 0);
  for (const record of records) counts[record.hour] += 1;
  return counts.map((conversations, hour) => ({ hour, conversations }));
}

function buildAttendance(records: readonly AttendanceRecord[]): AttendanceSplit {
  const ai = records.filter((record) => record.resolvedBy === "ai").length;
  return { ai, human: records.length - ai };
}

async function buildPending(workspaceId: string): Promise<PendingConversationRow[]> {
  const summaries = await listConversationSummaries(workspaceId);
  return summaries
    .filter((summary) => summary.assignee === "human" && summary.status === "pending")
    .map((summary) => ({
      conversationId: summary.id,
      contactName: summary.contact.name,
      reason: summary.handoffReason ?? "Aguardando resposta da equipe.",
      waitingSince: summary.lastInboundAt,
      assignedUserName: summary.assignedUserName,
    }))
    .toSorted((a, b) => a.waitingSince.localeCompare(b.waitingSince));
}

/**
 * Métricas do dashboard para os últimos N dias (incluindo hoje) comparadas aos N dias anteriores.
 * Todo o cálculo fica no servidor: o cliente recebe apenas os agregados.
 * `now` vem da requisição (o chamador usa connection() antes de ler o relógio).
 */
export async function getDashboardMetrics(
  period: PeriodKey,
  now: number,
  workspaceId: string,
): Promise<DashboardMetrics> {
  const days = periodDays(period);
  const tomorrowStart = startOfLocalDay(now) + DAY_MS;
  const currentFrom = tomorrowStart - days * DAY_MS;
  const previousFrom = currentFrom - days * DAY_MS;

  const [current, previous, pending] = await Promise.all([
    analyticsRepository.listAttendances(
      workspaceId,
      new Date(currentFrom),
      new Date(tomorrowStart),
    ),
    analyticsRepository.listAttendances(workspaceId, new Date(previousFrom), new Date(currentFrom)),
    buildPending(workspaceId),
  ]);

  return {
    period,
    periodDays: days,
    kpis: buildKpis(summarize(current), summarize(previous)),
    daily: buildDaily(current, currentFrom, days),
    hourly: buildHourly(current),
    attendance: buildAttendance(current),
    pending,
  };
}
