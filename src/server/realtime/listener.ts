import { EventEmitter } from "node:events";

import { Client } from "pg";

import { REALTIME_CHANNEL, realtimeEventSchema, type RealtimeEvent } from "./events";

/**
 * Uma única conexão LISTEN por processo do servidor, compartilhada por todos os navegadores
 * conectados (em vez de uma conexão de banco por aba aberta). Reconecta sozinha se cair.
 */
type ListenerState = {
  emitter: EventEmitter;
  client: Client | null;
  connecting: Promise<void> | null;
};

const globalForRealtime = globalThis as unknown as { realtime?: ListenerState };

function state(): ListenerState {
  if (!globalForRealtime.realtime) {
    const emitter = new EventEmitter();
    emitter.setMaxListeners(0); // um ouvinte por aba aberta; sem limite artificial
    globalForRealtime.realtime = { emitter, client: null, connecting: null };
  }
  return globalForRealtime.realtime;
}

async function connect(current: ListenerState): Promise<void> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  client.on("notification", (message) => {
    if (message.channel !== REALTIME_CHANNEL || !message.payload) return;
    try {
      const parsed = realtimeEventSchema.safeParse(JSON.parse(message.payload));
      if (parsed.success) current.emitter.emit(parsed.data.workspaceId, parsed.data);
    } catch {
      // Payload inválido: ignora (não derruba a conexão).
    }
  });
  client.on("error", () => {
    current.client = null;
    void client.end().catch(() => {});
    // Tenta de novo em 3 s se ainda houver alguém ouvindo.
    setTimeout(() => {
      if (current.emitter.eventNames().length > 0) void ensureConnected();
    }, 3000);
  });
  await client.connect();
  await client.query(`LISTEN ${REALTIME_CHANNEL}`);
  current.client = client;
}

async function ensureConnected(): Promise<void> {
  const current = state();
  if (current.client) return;
  current.connecting ??= connect(current).finally(() => {
    current.connecting = null;
  });
  return current.connecting;
}

/** Recebe eventos SOMENTE do workspace informado. Devolve a função para cancelar. */
export async function subscribe(
  workspaceId: string,
  handler: (event: RealtimeEvent) => void,
): Promise<() => void> {
  await ensureConnected();
  const { emitter } = state();
  emitter.on(workspaceId, handler);
  return () => emitter.off(workspaceId, handler);
}
