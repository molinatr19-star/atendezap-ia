export type PeriodKey = "7d" | "30d" | "90d";

/** Atendimento encerrado, como lido do banco para o cálculo das métricas. */
export type AttendanceRecord = {
  startedAt: number;
  /** Hora local (São Paulo) em que o atendimento começou. */
  hour: number;
  resolvedBy: "ai" | "human";
  firstResponseSeconds: number;
  leadCreated: boolean;
};

/** Indica se subir o valor é bom (conversas, leads) ou ruim (tempo de resposta). */
export type KpiPolarity = "higher-is-better" | "lower-is-better";

export type KpiUnit = "count" | "seconds" | "percent";

export type Kpi = {
  id: string;
  label: string;
  /** Definição exibida no tooltip do card. */
  definition: string;
  unit: KpiUnit;
  polarity: KpiPolarity;
  value: number;
  previousValue: number;
};

export type DailyPoint = {
  /** Data local (America/Sao_Paulo) no formato AAAA-MM-DD. */
  day: string;
  conversations: number;
};

export type HourlyPoint = {
  hour: number;
  conversations: number;
};

export type AttendanceSplit = {
  ai: number;
  human: number;
};

export type PendingConversationRow = {
  conversationId: string;
  contactName: string;
  reason: string;
  waitingSince: string;
  assignedUserName?: string;
};

export type DashboardMetrics = {
  period: PeriodKey;
  periodDays: number;
  kpis: Kpi[];
  daily: DailyPoint[];
  hourly: HourlyPoint[];
  attendance: AttendanceSplit;
  pending: PendingConversationRow[];
};
