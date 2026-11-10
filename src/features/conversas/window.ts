import { HOUR_MS } from "@/lib/utils/time";

/** Janela de atendimento do WhatsApp: 24 h após a última mensagem do contato. */
export const WHATSAPP_WINDOW_MS = 24 * HOUR_MS;

/** Fora da janela, a Cloud API só aceita mensagens de template aprovadas. */
export function isWindowOpen(lastInboundAt: string, now: number): boolean {
  return now - Date.parse(lastInboundAt) < WHATSAPP_WINDOW_MS;
}

export function windowExpiresAt(lastInboundAt: string): string {
  return new Date(Date.parse(lastInboundAt) + WHATSAPP_WINDOW_MS).toISOString();
}
