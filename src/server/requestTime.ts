import { connection } from "next/server";

/**
 * Hora da requisição atual.
 * connection() adia a execução para o momento da requisição: sem isso, o Next pré-renderiza no
 * build e as consultas ao SQLite (driver síncrono) ficariam "congeladas" no HTML estático.
 * Chamar isto antes de ler o banco é obrigatório em componentes que exibem dados vivos.
 */
export async function getRequestTime(): Promise<number> {
  await connection();
  return Date.now();
}
