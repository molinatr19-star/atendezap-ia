import "dotenv/config";

import path from "node:path";

import { defineConfig } from "vitest/config";

// Rode pelos scripts do npm (npm test): eles passam por scripts/vitest.mjs, que corrige a
// grafia do drive no Windows antes de iniciar o Vitest.
const alias = { "@": path.join(import.meta.dirname, "src") };

/**
 * Dois projetos:
 * - unit: funções puras, sem banco (rápido, roda em qualquer máquina);
 * - integration: serviços contra o PostgreSQL de TESTE (TEST_DATABASE_URL), um arquivo por vez.
 */
export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        resolve: { alias },
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.int.test.ts"],
          globalSetup: ["tests/integration/globalSetup.ts"],
          // O Prisma Client lê DATABASE_URL: aqui ele aponta para o banco de teste.
          // Testes nunca chamam a Claude API real (custo): chave vazia força o motor simulado.
          env: { DATABASE_URL: process.env.TEST_DATABASE_URL ?? "", ANTHROPIC_API_KEY: "" },
          fileParallelism: false,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
