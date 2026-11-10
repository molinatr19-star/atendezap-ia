# CLAUDE.md — projeto_atendezap_ia

Diretrizes do projeto para o Claude Code. Complementa o `CLAUDE.md` global da Molina (idioma, estilo, autonomia).

## 1. Escopo

Projeto de **portfólio** inspirado em plataformas SaaS de atendimento automatizado via WhatsApp com IA. Não é produto comercial e não atende clientes reais.

| Módulo        | Rota                     | Status                                                                   |
| ------------- | ------------------------ | ------------------------------------------------------------------------ |
| Login         | `/login`                 | Pronto (Better Auth, e-mail e senha, cadastro público desativado)        |
| Dashboard     | `/dashboard`             | Pronto (métricas do banco, gráficos SVG acessíveis)                      |
| Conversas     | `/conversas`             | Pronto (handoff IA/equipe, janela de 24 h, simulador de contato)         |
| CRM (Kanban)  | `/crm`                   | Pronto (arrastar e soltar, teclado, "Mover para")                        |
| Agentes de IA | `/agentes`               | Pronto (persona e regras; edição só para dono/admin)                     |
| Configurações | `/configuracoes`         | Provisório                                                               |
| Tempo real    | `/api/events`            | Pronto (SSE + PostgreSQL LISTEN/NOTIFY)                                  |
| Webhook       | `/api/webhooks/whatsapp` | Não implementado (o ponto de entrada já existe: `receiveContactMessage`) |

Não implementar lógica, telas ou integrações sem pedido explícito da Molina. Publicação (deploy) está fora do escopo atual.

## 2. Stack

| Camada    | Tecnologia                                                                                                       |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| Framework | Next.js 16.4 (App Router, `cacheComponents`) + React 19.3, TypeScript `strict`                                   |
| Estilo    | Tailwind CSS 4, componentes no padrão shadcn/ui, lucide-react, tema por `data-theme`                             |
| Banco     | PostgreSQL 17 (Docker Compose) + Prisma ORM 7.10.1 com `@prisma/adapter-pg` (ADR 0005)                           |
| Auth      | Better Auth 1.7 (ADR 0007)                                                                                       |
| IA        | Claude API via `@anthropic-ai/sdk`, padrão `claude-opus-5-5`, esforço `low`; motor simulado sem chave (ADR 0006) |
| Kanban    | dnd-kit (core + sortable)                                                                                        |
| Gráficos  | SVG próprio (ADR 0003), cores validadas pela skill `dataviz`                                                     |
| Validação | Zod em toda borda (actions, formulários, env, saídas do modelo)                                                  |
| Testes    | Vitest (unidade + integração no Postgres de teste) e Playwright (E2E); GitHub Actions                            |

Versões do Prisma (CLI, client, adapter) ficam fixadas juntas. Mudança de stack só com ADR em [docs/decisoes/](docs/decisoes/).

## 3. Estrutura de pastas

```
src/
  app/              Rotas. (auth) = login; (painel) = área logada; api/ = auth e eventos SSE
  components/       ui/, layout/, dashboard/, chat/, crm/, agentes/, auth/
  features/         Regras puras por domínio (conversas/rules.ts, crm/board.ts...) + hooks
  lib/              ai/ (motores, prompts), db/ (Prisma), auth.ts, utils/
  server/
    actions/        Server Actions (validam sessão + Zod, chamam serviços, refresh())
    services/       Regras de negócio; recebem workspaceId explícito (sem valor padrão)
    repositories/   Prisma -> tipos de domínio; toda consulta filtra por workspaceId
    realtime/       pg_notify (events.ts) e LISTEN compartilhado (listener.ts)
    session.ts      requireUser() / getActionUser()
  proxy.ts          Barreira rápida por cookie (NÃO é verificação de segurança)
  mocks/            Dados fictícios usados só pelo seed
prisma/             schema, migrations, seed.ts
tests/              integration/ (Vitest + Postgres de teste), e2e/ (Playwright)
docs/               arquitetura, modelo de dados, ADRs, screenshots
```

Dependências: `app` -> `components`/`features` -> `server/actions` -> `server/services` -> `server/repositories` e `lib/*`.

## 4. Regras de segurança (obrigatórias)

- **Toda** Server Action, página com dados e rota de API valida a sessão no servidor (`src/server/session.ts`). O `proxy.ts` só checa se o cookie existe.
- O `workspaceId` vem **sempre** da sessão, nunca do navegador. Serviços não têm workspace padrão: o compilador obriga a passar.
- Alterar o agente de IA exige papel `owner` ou `admin` (verificado no servidor; a tela só reflete).
- Redirecionamento pós-login só para caminhos internos (`features/auth/safeRedirect.ts`).
- Saídas do modelo (argumentos de ferramentas) são validadas com Zod antes de executar; texto do contato é dado, não instrução.
- Eventos em tempo real levam só ids e tipo, nunca conteúdo de mensagens. Logs não registram mensagens, chaves ou tokens.
- `.env` nunca é versionado (`.env.example` documenta as variáveis). Ao receber uma chave de API, validar com uma chamada gratuita antes de salvar e nunca imprimi-la.
- Limite de tentativas de login (Better Auth) fica ligado; só o servidor dos testes E2E usa `AUTH_RATE_LIMIT=disabled`.

## 5. Dados e testes

- Somente dados fictícios (seed). Domínio de e-mail `.example` (reservado). Contas: `ana@atendezap.example` (dona) e `bruno@atendezap.example` (atendente), senha `demo12345`.
- Nunca rodar `prisma migrate reset`, `db push --force-reset`/`--accept-data-loss` ou `npm run db:reset-demo` sem pedido explícito da Molina.
- Testes usam o banco `atendezap_test` (trava em `tests/integration/guard.ts`: recusa qualquer banco que não termine em `_test`).
- Testes **nunca** chamam a Claude API real: Vitest e Playwright forçam `ANTHROPIC_API_KEY=""` (motor simulado, sem custo).
- Uma chamada real à API custa dinheiro da Molina: perguntar antes de testar com o motor real.

## 6. Diretrizes de código e UI

- Código, nomes de arquivos e commits em inglês; interface e documentação em português do Brasil.
- Server Components por padrão; `"use client"` só com estado, eventos ou APIs do navegador. Sem `any`.
- Regras de negócio em funções puras compartilhadas entre servidor e atualização otimista (`useOptimistic`).
- Estados obrigatórios: carregando, vazio, erro, sucesso e "Salvando…" enquanto o servidor confirma.
- Acessibilidade: contraste AA, foco visível, teclado em tudo (inclusive Kanban), anúncios para leitor de tela.
- Skills do projeto: `saas-ui`, `dashboard-analitico`, `fluxo-conversacional`. Agente: `atendezap-architect`.

## 7. Next.js 16 e bibliotecas: armadilhas já confirmadas

Consultar a doc local em `node_modules/next/dist/docs/` antes de escrever código de Next (ver `AGENTS.md`).

- Leitura de banco/sessão em componente: dentro de `<Suspense>`; `getRequestTime()` chama `connection()`. `now` vai como prop aos componentes cliente (sem `Date.now()` no render).
- `params`, `searchParams`, `usePathname`, `useSearchParams`, `useParams`: dentro de `<Suspense>`.
- `error.tsx` recebe `{ error, retry }`. `notFound()` em conteúdo transmitido responde 200 + `noindex`.
- Rotas ficam ocultas em `<Activity>` ao navegar: estados transitórios precisam ser fechados.
- Após login, navegação completa (`window.location.assign`): o prefetch pode ter guardado respostas de antes do login.
- Transação do Prisma usa uma conexão só: nada de `Promise.all` dentro de `$transaction`.
- dnd-kit: setas entre colunas exigem o `coordinateGetter` próprio de `KanbanBoard.tsx`.
- Cache do dev: ao mudar `@theme` no `globals.css`, parar o servidor e apagar `.next/dev`.
- Vitest no Windows: rodar pelos scripts do npm (`scripts/vitest.mjs` corrige `c:` vs `C:`).

## 8. Comandos

| Comando                 | Uso                                                         |
| ----------------------- | ----------------------------------------------------------- |
| `docker compose up -d`  | Sobe o PostgreSQL (dev + banco de testes)                   |
| `npm run dev`           | Servidor de desenvolvimento (http://localhost:3000)         |
| `npm run check`         | typecheck + lint                                            |
| `npm test`              | Vitest: unidade + integração                                |
| `npm run test:e2e`      | Playwright (build + servidor na porta 3100, banco de teste) |
| `npm run format`        | Prettier                                                    |
| `npm run db:migrate`    | Cria/aplica migração após mudar o schema (dev)              |
| `npm run db:seed`       | Popula o banco só se estiver vazio (seguro)                 |
| `npm run db:reset-demo` | **Apaga** e recria a demonstração (só com pedido explícito) |
| `npm run db:studio`     | Interface visual do banco                                   |

Antes de considerar uma etapa concluída: `npm run check`, `npm test`, `npm run build` e, se tocar em telas, `npm run test:e2e`.
