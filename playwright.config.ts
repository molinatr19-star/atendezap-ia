import "dotenv/config";

import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const isCI = Boolean(process.env.CI);

/**
 * Testes ponta a ponta no navegador, contra o build de produção e o banco de TESTE.
 * Localmente usa o Microsoft Edge já instalado (sem baixar navegadores); na CI, o Chromium.
 */
export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/globalSetup.ts",
  fullyParallel: false,
  workers: 1,
  retries: isCI ? 1 : 0,
  forbidOnly: isCI,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    colorScheme: "dark",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    // Entra uma vez pela tela de login e salva a sessão (tests/e2e/auth.setup.ts).
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "desktop",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        channel: isCI ? undefined : "msedge",
        storageState: "playwright/.auth/owner.json",
      },
    },
  ],
  webServer: {
    // Na CI o build já foi feito no passo anterior.
    command: isCI ? `npm run start -- -p ${PORT}` : `npm run build && npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    timeout: 240_000,
    reuseExistingServer: false,
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "",
      // Sem chave: o agente usa o motor simulado (testes não geram custo de API).
      ANTHROPIC_API_KEY: "",
      BETTER_AUTH_URL: `http://localhost:${PORT}`,
      // Vários logins em segundos dispararia o bloqueio de força bruta (que é o comportamento
      // certo em produção). Desligado SÓ neste servidor de testes.
      AUTH_RATE_LIMIT: "disabled",
    },
  },
});
