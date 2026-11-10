/**
 * Trava de segurança: os testes de integração apagam dados entre um teste e outro.
 * Só aceitam rodar num banco cujo nome termina em "_test", nunca no banco de desenvolvimento.
 */
export function assertTestDatabase(url: string | undefined): string {
  if (!url) {
    throw new Error("TEST_DATABASE_URL não definida (ver .env.example).");
  }
  const databaseName = new URL(url).pathname.replace(/^\//, "");
  if (!databaseName.endsWith("_test")) {
    throw new Error(`Recusado: os testes só rodam em banco "*_test" (recebido "${databaseName}").`);
  }
  return url;
}
