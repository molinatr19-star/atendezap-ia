/**
 * Formatação em pt-BR com fuso fixo (America/Sao_Paulo), para que servidor e navegador
 * produzam exatamente o mesmo texto e não haja erro de hidratação.
 */
const LOCALE = "pt-BR";
const TIME_ZONE = "America/Sao_Paulo";

const integerFormat = new Intl.NumberFormat(LOCALE);
const compactFormat = new Intl.NumberFormat(LOCALE, {
  notation: "compact",
  maximumFractionDigits: 1,
});
const percentFormat = new Intl.NumberFormat(LOCALE, {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});
const timeFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});
const shortDateFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
});
const longDateFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});
const weekdayDateFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: "UTC",
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
});

export function formatInteger(value: number): string {
  return integerFormat.format(Math.round(value));
}

/** Para eixos: 1.200 -> "1,2 mil". */
export function formatCompact(value: number): string {
  return value < 10_000 ? integerFormat.format(value) : compactFormat.format(value);
}

export function formatPercent(value: number): string {
  return `${percentFormat.format(value)}%`;
}

/** 38 -> "38 s"; 135 -> "2 min 15 s"; 3720 -> "1 h 2 min". */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.round(totalSeconds);
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    const rest = seconds % 60;
    return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} s`;
  }
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return restMinutes === 0 ? `${hours} h` : `${hours} h ${restMinutes} min`;
}

export function formatTime(iso: string): string {
  return timeFormat.format(new Date(iso));
}

export function formatShortDate(iso: string): string {
  return shortDateFormat.format(new Date(iso));
}

export function formatLongDate(iso: string): string {
  return longDateFormat.format(new Date(iso));
}

/** Recebe "AAAA-MM-DD" (data local já calculada) e devolve "seg., 10/11". */
export function formatDayKey(dayKey: string): string {
  return weekdayDateFormat.format(new Date(`${dayKey}T12:00:00Z`));
}

/** Recebe "AAAA-MM-DD" e devolve "10/11". */
export function formatDayKeyShort(dayKey: string): string {
  const [, month, day] = dayKey.split("-");
  return `${day}/${month}`;
}

/** Tempo relativo curto, para listas: "agora", "5 min", "3 h", "ontem", "08/11". */
export function formatRelative(iso: string, now: number): string {
  const diffMinutes = Math.floor((now - Date.parse(iso)) / 60_000);
  if (diffMinutes < 1) return "agora";
  if (diffMinutes < 60) return `${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} h`;
  if (diffHours < 48) return "ontem";
  return formatShortDate(iso);
}

/** "+55 11 90000-0001" a partir de "+5511900000001". */
export function formatPhone(e164: string): string {
  const match = /^\+55(\d{2})(\d{4,5})(\d{4})$/.exec(e164);
  return match ? `+55 ${match[1]} ${match[2]}-${match[3]}` : e164;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
