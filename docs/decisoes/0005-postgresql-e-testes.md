# 0005 — PostgreSQL, testes automatizados e CI

- Data: 2026-11-10
- Status: aceita
- Substitui: a escolha do SQLite da ADR 0004 (o restante da 0004 continua valendo)

## Contexto

Para um portfólio profissional, o projeto precisava de um banco de produção real, testes automatizados e verificação contínua.

## Decisão

- **PostgreSQL 17 via Docker Compose**, com dois bancos: `atendezap` (desenvolvimento) e `atendezap_test` (criado por script de inicialização). Driver `@prisma/adapter-pg` (Prisma 7.10.1, versões fixadas juntas).
- Histórico de migrações recriado para PostgreSQL (o SQL do SQLite não é compatível). Enums passam a ser validados pelo banco.
- **Vitest** em dois projetos: `unit` (funções puras) e `integration` (serviços contra o banco de teste, um arquivo por vez). Trava de segurança: recusa banco cujo nome não termina em `_test`.
- **Playwright** contra o build de produção e o banco de teste (migrações + seed `--reset` antes da suíte). Localmente usa o Microsoft Edge instalado; na CI, Chromium.
- **GitHub Actions**: tipos, lint, formatação, testes, build e E2E, com Postgres como serviço.

## Consequências

- `docker compose up -d` passa a ser pré-requisito do desenvolvimento.
- Achados reais dos testes, já corrigidos: transação do seed acima do limite de 5 s; consultas paralelas dentro de transação (uma conexão só); dependência de ordem entre testes E2E.
- No Windows, terminais abertos em `c:\` (minúsculo) faziam o Vite duplicar módulos; `scripts/vitest.mjs` normaliza o caminho.
