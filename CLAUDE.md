# CLAUDE.md — projeto_atendezap_ia

Diretrizes do projeto para o Claude Code. Complementa o `CLAUDE.md` global da Molina (idioma, estilo, autonomia).

## 1. Escopo

Projeto de **portfólio** inspirado em plataformas SaaS de atendimento automatizado via WhatsApp com IA. Não é produto comercial e não atende clientes reais.

Módulos previstos:

| Módulo        | Rota                     | Descrição                                                                         |
| ------------- | ------------------------ | --------------------------------------------------------------------------------- |
| Autenticação  | `/(auth)`                | Login e cadastro do operador/empresa                                              |
| Dashboard     | `/dashboard`             | Métricas de atendimento (volume, tempo de resposta, conversão, resolução pela IA) |
| Conversas     | `/conversas`             | Caixa de entrada estilo WhatsApp, com handoff IA para humano                      |
| CRM (Kanban)  | `/crm`                   | Funil de leads em colunas, atualizado em tempo real                               |
| Agentes de IA | `/agentes`               | Configuração de agentes: persona, instruções, base de conhecimento, horários      |
| Configurações | `/configuracoes`         | Conexão WhatsApp, equipe, etiquetas, integrações                                  |
| Webhook       | `/api/webhooks/whatsapp` | Recebimento de mensagens e status                                                 |

**Fase atual: Dashboard e Conversas persistidos em SQLite via Prisma** (ADR 0004; sem IA real, sem login, WhatsApp em modo simulado). CRM, Agentes e Configurações ainda são páginas provisórias. Não implementar lógica, telas ou integrações sem pedido explícito da Molina.

## 2. Stack

| Camada         | Tecnologia                                                                                                                       | Status      |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| Framework      | Next.js 16.4 (App Router, `cacheComponents`) + React 19.3                                                                        | instalado   |
| Linguagem      | TypeScript em modo `strict`                                                                                                      | instalado   |
| Estilo         | Tailwind CSS 4 + componentes no padrão shadcn/ui (cva, clsx, tailwind-merge)                                                     | instalado   |
| Ícones         | lucide-react                                                                                                                     | instalado   |
| Tema           | `data-theme` no `<html>` + script inline (sem biblioteca)                                                                        | instalado   |
| Gráficos       | SVG próprio em `src/components/dashboard/` (ADR 0003); cores validadas pela skill `dataviz`                                      | definido    |
| Kanban         | dnd-kit                                                                                                                          | a confirmar |
| Validação      | Zod (entrada de API, formulários, variáveis de ambiente)                                                                         | definido    |
| IA             | Claude API (Anthropic SDK), modelo via variável de ambiente                                                                      | definido    |
| WhatsApp       | WhatsApp Cloud API oficial (Meta), com modo simulado                                                                             | definido    |
| Banco de dados | SQLite (`prisma/dev.db`) + Prisma ORM 7.10.1 com `@prisma/adapter-better-sqlite3` (ADR 0004). Migrar para PostgreSQL ao publicar | instalado   |
| Tempo real     | SSE, WebSocket ou Realtime do provedor do banco                                                                                  | a decidir   |
| Testes         | Vitest (unidade) + Playwright (e2e)                                                                                              | a confirmar |

Itens "a decidir" ou "a confirmar" só mudam de status com uma ADR em [docs/decisoes/](docs/decisoes/).

## 3. Estrutura de pastas

```
src/
  app/              Rotas (App Router). (auth) e (painel) são route groups.
    api/            Route handlers (webhooks, endpoints internos)
  components/
    ui/             Componentes base reutilizáveis (botão, card, input, badge)
    layout/         Sidebar, header, shells de página
    dashboard/      KPIs, gráficos, filtros de período
    crm/            Quadro Kanban, colunas, cards de lead
    chat/           Lista de conversas, balões, composer
    agentes/        Formulários de configuração de agente
  features/         Lógica por domínio (hooks + estado + chamadas) quando crescer além de um componente
  lib/
    ai/             Cliente da Claude API, prompts, ferramentas do agente
    whatsapp/       Cliente da Cloud API, parser de webhook, modo simulado
    db/             Conexão e schema do banco
    utils/          Funções puras genéricas
  server/
    services/       Regras de negócio (orquestram repositórios, IA e WhatsApp)
    repositories/   Acesso a dados
  hooks/            Hooks React compartilhados
  types/            Tipos de domínio compartilhados
  config/           Constantes, validação de env, navegação
  mocks/            Dados fictícios para desenvolvimento e demonstração
docs/               Arquitetura, modelo de dados, ADRs
tests/              unit/ e e2e/
.claude/            Agente e skills do projeto
```

Regras de dependência (de cima para baixo, nunca o inverso):
`app` -> `components`/`features` -> `server/services` -> `server/repositories` e `lib/*`.
Componentes de UI não acessam banco nem SDKs externos diretamente.

## 4. Modelo de dados (referência)

Entidades centrais, detalhadas em [docs/modelo-de-dados.md](docs/modelo-de-dados.md):

- `Workspace` — empresa/conta (base para multi-tenant).
- `User` — operador humano, com papel (`owner`, `admin`, `agent`).
- `WhatsAppChannel` — número conectado.
- `Contact` — pessoa do outro lado (telefone em E.164).
- `Conversation` — sessão de atendimento; status `open`, `pending`, `resolved`; responsável `ai` ou `human`.
- `Message` — direção `inbound`/`outbound`, autor `contact`/`ai`/`user`, status de entrega.
- `Lead` — oportunidade no CRM, ligada a um `Contact`.
- `PipelineStage` — coluna do Kanban, com ordem.
- `AiAgent` — persona, instruções, modelo, temperatura, regras de handoff.
- `Tag` — etiquetas para contatos e conversas.

Todas as entidades de negócio carregam `workspaceId`.

## 5. Diretrizes de código

- Identificadores, nomes de arquivos de código e commits em **inglês**; textos de interface e documentação em **português do Brasil**.
- Componentes em PascalCase (`LeadCard.tsx`); hooks com prefixo `use`; utilitários em camelCase.
- Server Components por padrão; `"use client"` apenas quando houver estado, eventos ou APIs do navegador.
- Sem `any`. Tipos de domínio em `src/types/`; tipos derivados de schemas Zod quando possível.
- Validar toda entrada externa (webhook, formulário, query string) com Zod na borda.
- Funções pequenas e com uma responsabilidade. Comentar o "porquê", não o "o quê".
- Cada mudança relevante de arquitetura gera uma ADR curta em `docs/decisoes/NNNN-titulo.md`.

## 6. Diretrizes de UI (SaaS)

- Layout de painel: sidebar fixa + header + área de conteúdo; responsivo até 360 px.
- Tema claro e escuro via tokens (variáveis CSS mapeadas no Tailwind). Nada de cor solta no componente.
- Estados obrigatórios em toda tela com dados: carregando (skeleton), vazio, erro e sucesso.
- Acessibilidade: contraste AA, foco visível, navegação por teclado (inclusive no Kanban), `aria-*` nos componentes interativos.
- Detalhes em `.claude/skills/saas-ui/SKILL.md` e `.claude/skills/dashboard-analitico/SKILL.md`.

## 7. Diretrizes de IA e WhatsApp

- Usar apenas a **WhatsApp Cloud API oficial**. Não usar bibliotecas não oficiais que automatizam o WhatsApp Web (violam os termos e arriscam banimento do número).
- Manter um **modo simulado** (`WHATSAPP_MODE=mock`) para desenvolvimento e demonstração do portfólio sem número real.
- Webhook: verificar assinatura `X-Hub-Signature-256`, responder 200 rápido e processar de forma idempotente (deduplicar pelo id da mensagem).
- Respeitar a janela de 24 h do WhatsApp: fora dela, só mensagens de template aprovadas.
- Chave da Claude API e modelo vêm de variáveis de ambiente; nunca no código nem no cliente.
- Toda chamada de IA roda no servidor. O agente sempre tem regra de handoff para humano (pedido explícito, baixa confiança, assunto sensível).
- Prompts versionados em `src/lib/ai/`, não espalhados pelo código.
- Detalhes em `.claude/skills/fluxo-conversacional/SKILL.md`.

## 8. Segurança e dados

- Somente dados fictícios em `src/mocks/` e no seed. Nenhum telefone ou conversa real no repositório.
- O arquivo do banco (`prisma/*.db`) e o client gerado (`src/generated/`) não são versionados.
- Nunca rodar `prisma migrate reset`, `db push --force-reset`/`--accept-data-loss` ou `npm run db:reset-demo` sem pedido explícito da Molina: apagam dados.
- Para testes que alteram dados, usar uma cópia do banco (`DATABASE_URL="file:./prisma/test.db"`) e apagá-la depois.
- `.env` nunca é versionado; `.env.example` documenta todas as variáveis.
- Isolamento por `workspaceId` em toda consulta.
- Não registrar conteúdo de mensagens nem tokens em logs.

## 9. Fluxo de trabalho com o Claude

- Agente do projeto: `atendezap-architect` (`.claude/agents/`). Usar para planejar módulos, revisar arquitetura e propor estrutura antes de codificar.
- Skills do projeto: `saas-ui`, `dashboard-analitico`, `fluxo-conversacional`.
- Antes de instalar dependências, confirmar com a Molina e registrar a decisão.
- **Next.js 16 tem mudanças incompatíveis com versões anteriores.** Antes de escrever código de Next, consultar a doc local em `node_modules/next/dist/docs/` (ver `AGENTS.md`). Pontos já confirmados:
  - `error.tsx` recebe `{ error: unknown, retry }`.
  - `LayoutProps<"/rota">` e `PageProps<"/rota">` são globais (gerados por `next dev`/`build`/`typegen`).
  - Com `cacheComponents`, rotas visitadas ficam ocultas em `<Activity>`: fechar menus/popovers ao navegar (`Link onNavigate`).
  - `usePathname`/`useSearchParams`/`useParams` dentro de `<Suspense>`.
  - Ler `params`/`searchParams` em página só dentro de `<Suspense>` (senão o dev acusa "instant-shell-url-data").
  - `notFound()` dentro de conteúdo transmitido responde 200 + `noindex` (comportamento documentado).
  - Leitura de banco em componente: sempre dentro de `<Suspense>` e depois de `await getRequestTime()` (`src/server/requestTime.ts`, que chama `connection()`). O driver SQLite é síncrono: sem isso a consulta roda no build e fica congelada. O `now` retornado é passado como prop aos componentes cliente.
  - Escritas: Server Actions em `src/server/actions/` (validam com Zod, chamam o serviço e terminam com `refresh()`). Regras de negócio puras em `src/features/conversas/rules.ts`, usadas no servidor e na atualização otimista (`useOptimistic`).
  - Prisma 7: client gerado em `src/generated/prisma` (importar de `@/generated/prisma/client`); rodar `npm run db:generate` após mudar o schema. Repositórios convertem linhas do Prisma em tipos de domínio (`src/types/`).
  - **Cache do dev:** ao mudar o bloco `@theme` do `globals.css`, o servidor de dev pode manter o tema antigo. Parar o servidor, apagar `.next/dev` e iniciar de novo.

## 10. Comandos

| Comando                 | Uso                                                                      |
| ----------------------- | ------------------------------------------------------------------------ |
| `npm run dev`           | Servidor de desenvolvimento (http://localhost:3000)                      |
| `npm run build`         | Build de produção                                                        |
| `npm run start`         | Servir o build                                                           |
| `npm run typecheck`     | Checagem de tipos (`tsc --noEmit`)                                       |
| `npm run lint`          | ESLint                                                                   |
| `npm run format`        | Prettier (ordena classes Tailwind)                                       |
| `npm run check`         | typecheck + lint                                                         |
| `npm run db:migrate`    | Cria/aplica migração após mudar `prisma/schema.prisma` (dev)             |
| `npm run db:generate`   | Regenera o Prisma Client                                                 |
| `npm run db:seed`       | Popula o banco só se estiver vazio (seguro)                              |
| `npm run db:reset-demo` | **Apaga** o workspace de demonstração e recria (só com pedido explícito) |
| `npm run db:studio`     | Interface visual do banco (Prisma Studio)                                |

Rodar `npm run check` e `npm run build` antes de considerar uma etapa concluída.
