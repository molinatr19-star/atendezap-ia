import { execSync } from "node:child_process";

import { assertTestDatabase } from "./guard";

/** Aplica as migrações no banco de TESTE antes da suíte (não destrutivo: só cria o que falta). */
export default function setup() {
  const url = assertTestDatabase(process.env.TEST_DATABASE_URL);
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  });
}
