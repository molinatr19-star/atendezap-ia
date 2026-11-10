import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/lib/db/prisma";

/**
 * Autenticação (Better Auth): e-mail e senha, sessões no PostgreSQL via Prisma.
 * - Cadastro público desativado: usuários são criados pelo seed (demonstração) ou por um admin.
 * - workspaceId e role são do servidor (input: false): o usuário não consegue alterá-los.
 */
export const auth = betterAuth({
  appName: "AtendeZap IA",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  // Limite de tentativas (proteção contra força bruta) fica no padrão do Better Auth: ligado em
  // produção. Só os testes E2E, que fazem vários logins em segundos, o desligam explicitamente.
  ...(process.env.AUTH_RATE_LIMIT === "disabled" ? { rateLimit: { enabled: false } } : {}),
  user: {
    additionalFields: {
      workspaceId: { type: "string", required: true, input: false },
      role: {
        type: ["owner", "admin", "agent"],
        required: true,
        defaultValue: "agent",
        input: false,
      },
    },
  },
  // Precisa ser o último plugin: grava cookies quando ações de autenticação rodam em Server Actions.
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
