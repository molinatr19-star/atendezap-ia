# 0004 — Persistência com Prisma ORM e SQLite

- Data: 2026-11-10
- Status: aceita
- Substitui: a parte de "estado só na sessão" da ADR 0003

## Contexto

As ações do operador (assumir, enviar, resolver) eram perdidas ao recarregar a página. O projeto precisa de persistência para conversas, mensagens, atendimentos e leads.

## Decisão

- **Prisma ORM 7.10.1** (última estável; a tag `latest` do npm apontava para uma release candidate 8.0, descartada). CLI, client e adaptador fixados na mesma versão.
- **SQLite** via `@prisma/adapter-better-sqlite3`: arquivo local (`prisma/dev.db`), zero instalação, ideal para portfólio e desenvolvimento. Ao publicar, migrar para PostgreSQL trocando o `provider` e o adaptador (os repositórios isolam essa mudança).
- Configuração no `prisma.config.ts` (padrão da v7), com `dotenv` para o CLI ler o `.env`. Client gerado em `src/generated/prisma` (não versionado; `postinstall` gera).
- Modelos: Workspace, Contact, Tag, Conversation, Message, PipelineStage, Lead, **Attendance** (atendimento encerrado, base das métricas). Enums para status/responsável/direção/autor. Valores em centavos (`valueCents`). `Message.externalId` único para idempotência do webhook futuro.
- **Escritas por Server Actions** (`src/server/actions/conversationActions.ts`): validam a entrada com Zod, chamam o serviço, terminam com `refresh()`.
- **Regras compartilhadas** (`src/features/conversas/rules.ts`): o servidor revalida tudo (inclusive a janela de 24 h); o navegador usa as mesmas funções em `useOptimistic` para resposta imediata.
- **Métricas vivas**: resolver uma conversa grava/atualiza um `Attendance` (tempo da 1ª resposta calculado das mensagens); reabrir remove o registro.
- Leituras chamam `connection()` (via `getRequestTime()`) antes de consultar: o driver é síncrono e, sem isso, o Next 16 executaria a consulta no build.
- O relógio fixo de demonstração foi removido. O seed gera os dados relativos ao momento em que roda.
- Seed seguro por padrão: não altera um banco já populado; recriar exige `npm run db:reset-demo`.

## Consequências

- Dados sobrevivem a recarregar a página e a reiniciar o servidor.
- Sem login, todas as operações usam o workspace `ws-demo`; quando houver autenticação, o workspace virá da sessão (as consultas já filtram por `workspaceId`).
- SQLite trava o arquivo durante escritas: adequado para um operador; para vários simultâneos, usar PostgreSQL.
- O banco fica dentro da pasta do OneDrive: a sincronização pode, raramente, travar o arquivo durante uso. Se ocorrer `SQLITE_BUSY`, pausar a sincronização ou mover `DATABASE_URL` para fora do OneDrive.
- Testes automatizados (Vitest) seguem pendentes; a verificação desta etapa foi feita via HTTP contra uma cópia do banco.
