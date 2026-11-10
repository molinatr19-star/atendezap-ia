import { execSync } from "node:child_process";

import { assertTestDatabase } from "../integration/guard";

/**
 * Prepara o banco de TESTE para os testes no navegador: aplica migrações e recria os dados de
 * demonstração (seed --reset). Nunca toca no banco de desenvolvimento (trava *_test).
 */
export default function globalSetup() {
  const url = assertTestDatabase(process.env.TEST_DATABASE_URL);
  const env = { ...process.env, DATABASE_URL: url };
  execSync("npx prisma migrate deploy", { stdio: "inherit", env });
  execSync("npx tsx prisma/seed.ts --reset", { stdio: "inherit", env });
}
