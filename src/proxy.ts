import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Barreira rápida: sem cookie de sessão, o painel redireciona para o login antes de renderizar.
 * ATENÇÃO: só verifica se o cookie EXISTE. A validação real da sessão acontece em cada página,
 * Server Action e rota de API (src/server/session.ts) — nunca confiar só neste arquivo.
 */
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  // Rotas do painel. Server Actions são POSTs para estas mesmas rotas, então também passam aqui.
  matcher: [
    "/dashboard/:path*",
    "/conversas/:path*",
    "/crm/:path*",
    "/agentes/:path*",
    "/configuracoes/:path*",
  ],
};
