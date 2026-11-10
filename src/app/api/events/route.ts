import { subscribe } from "@/server/realtime/listener";
import { getActionUser } from "@/server/session";

const HEARTBEAT_MS = 25_000;

/**
 * Server-Sent Events: o painel aberto recebe avisos de mudança do SEU workspace.
 * Exige sessão válida; a inscrição usa o workspaceId da sessão, nunca um valor do navegador.
 */
export async function GET(request: Request) {
  const user = await getActionUser();
  if (!user) return new Response("Não autenticado", { status: 401 });

  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup();
        }
      };

      // O navegador reconecta sozinho após 5 s se a conexão cair.
      send("retry: 5000\n\n");
      const unsubscribe = await subscribe(user.workspaceId, (event) => {
        send(`event: change\ndata: ${JSON.stringify(event)}\n\n`);
      });
      // Comentário periódico mantém a conexão viva em proxies que cortam conexões ociosas.
      const heartbeat = setInterval(() => send(": ping\n\n"), HEARTBEAT_MS);

      cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // já fechado
        }
      };
      request.signal.addEventListener("abort", cleanup, { once: true });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
