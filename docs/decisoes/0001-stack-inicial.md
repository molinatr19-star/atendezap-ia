# 0001 — Stack inicial

- Data: 2026-11-07
- Status: aceita

## Contexto

Projeto de portfólio de um SaaS de atendimento via WhatsApp com IA, dashboard e CRM Kanban. Precisa ser moderno, tipado e fácil de demonstrar.

## Decisão

- Next.js (App Router) + React + TypeScript strict.
- Tailwind CSS com componentes no padrão shadcn/ui.
- Zod para validação.
- Claude API para os agentes de IA.
- WhatsApp Cloud API oficial, com modo simulado para demonstração.

## Consequências

- Frontend e backend no mesmo projeto (route handlers e server actions).
- Banco, tempo real e autenticação ficam para ADRs próprias.

## Modelo para novas ADRs

Copiar este arquivo como `NNNN-titulo-curto.md` com as seções: Contexto, Decisão, Consequências.
