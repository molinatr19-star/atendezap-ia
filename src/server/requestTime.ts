import { connection } from "next/server";

/**
 * Hora da requisição atual.
 * connection() marca o componente como "por requisição": dados do banco nunca são congelados
 * no HTML estático do build, e o relógio lido aqui é o do momento em que o usuário abriu a página.
 * Chamar isto antes de ler o banco em componentes que exibem dados vivos.
 */
export async function getRequestTime(): Promise<number> {
  await connection();
  return Date.now();
}
