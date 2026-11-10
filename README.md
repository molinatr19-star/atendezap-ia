# AtendeZap IA

Projeto de portfólio: plataforma SaaS de atendimento via WhatsApp com agentes de Inteligência Artificial, dashboard gerencial e CRM em Kanban em tempo real.

> Status: Dashboard e Conversas funcionando com persistência em SQLite (Prisma). CRM, Agentes e Configurações em construção.

## Módulos previstos

- **Dashboard** — métricas de atendimento e conversão.
- **Conversas** — caixa de entrada com handoff entre IA e atendente humano.
- **CRM Kanban** — funil de leads com arrastar e soltar.
- **Agentes de IA** — configuração de persona, instruções e regras de transferência.
- **Configurações** — canal WhatsApp, equipe e etiquetas.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Zod, Claude API e WhatsApp Cloud API (com modo simulado).

## Documentação

- [Arquitetura](docs/arquitetura.md)
- [Modelo de dados](docs/modelo-de-dados.md)
- [Decisões de arquitetura (ADRs)](docs/decisoes/)

## Como rodar

Requisitos: Node.js 20 ou superior.

```bash
npm install                  # também gera o Prisma Client (postinstall)
cp .env.example .env         # define DATABASE_URL (SQLite local)
npx prisma migrate deploy    # cria prisma/dev.db com as tabelas
npm run db:seed              # dados fictícios de demonstração
npm run dev
```

Acesse http://localhost:3000 (redireciona para `/dashboard`).

Outros comandos: `npm run build`, `npm run check` (tipos + lint), `npm run format`.

## Aviso

Projeto educacional. Usa apenas dados fictícios.
