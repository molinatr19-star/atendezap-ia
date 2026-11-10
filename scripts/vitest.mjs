/**
 * Inicia o Vitest na pasta do projeto com a grafia real do disco ("C:\..." e não "c:\...").
 *
 * Por quê: no Windows, terminais (ex.: o do VS Code) podem abrir em "c:\...". O Vite então
 * carrega o mesmo módulo duas vezes, uma por grafia, e todo teste quebra com
 * "Cannot read properties of undefined (reading 'config')". Em Linux/macOS não muda nada.
 */
import { spawnSync } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import path from "node:path";

const cwd = realpathSync.native(process.cwd());
const vitestBin = path.join(cwd, "node_modules", "vitest", "vitest.mjs");
if (!existsSync(vitestBin)) {
  console.error("Vitest não encontrado. Rode npm install.");
  process.exit(1);
}

const result = spawnSync(process.execPath, [vitestBin, ...process.argv.slice(2)], {
  cwd,
  stdio: "inherit",
});
process.exit(result.status ?? 1);
