# Arquitetura

> Documento vivo. Decisões detalhadas em `docs/decisoes/` (ADRs 0001 a 0007).

## Fluxo de uma mensagem do contato

```
Contato (WhatsApp)                       Hoje: simulador no painel
      |                                   Futuro: webhook da Cloud API
      v
receiveContactMessage  (server/services/inboundService.ts)
  1. valida o texto (Zod)
  2. grava a mensagem, renova a janela de 24 h, reabre se estava resolvida
  3. se a IA conduz a conversa e o agente está ativo:
       runAgentReply  (server/services/agentService.ts)
         - monta o prompt a partir da configuração em /agentes
         - motor Claude (com chave) ou simulado (sem chave)
         - ferramentas executadas pelo serviço: transferir, mover lead, etiquetar
         - falha ou recusa da IA => transfere para a equipe
  4. pg_notify("atendezap_events", { workspaceId, tipo, conversationId })
      |
      v
Processo do Next (LISTEN compartilhado) --SSE /api/events--> abas do mesmo workspace
      |
      v
router.refresh(): lista, chat, Kanban e dashboard relidos com a sessão de cada usuário
```

## Camadas

| Camada       | Pasta                                                  | Responsabilidade                                       |
| ------------ | ------------------------------------------------------ | ------------------------------------------------------ |
| Apresentação | `src/app`, `src/components`                            | Rotas, layouts, componentes (Server por padrão)        |
| Regras puras | `src/features`                                         | Regras compartilhadas por servidor e UI otimista       |
| Entrada      | `src/server/actions`, `src/app/api`                    | Sessão, validação Zod, chamada ao serviço, `refresh()` |
| Aplicação    | `src/server/services`                                  | Casos de uso; workspace sempre explícito               |
| Dados        | `src/server/repositories`, `src/lib/db`                | Prisma -> tipos de domínio, filtro por workspace       |
| Integrações  | `src/lib/ai`, `src/lib/auth.ts`, `src/server/realtime` | Claude API, Better Auth, LISTEN/NOTIFY                 |

## Segurança em camadas

1. `proxy.ts`: sem cookie de sessão, redireciona ao login (rápido, não é verificação real).
2. Páginas: `requireUser()` valida a sessão no banco antes de ler dados.
3. Server Actions e rotas: `getActionUser()`; sem sessão, erro. O workspace vem da sessão.
4. Repositórios: toda consulta e escrita filtra por `workspaceId`.

## Pontos em aberto

- Webhook real da WhatsApp Cloud API (assinatura `X-Hub-Signature-256`, idempotência por `externalId`).
- Gestão de equipe pela tela (convites, papéis) e recuperação de senha.
- Hospedagem (fora do escopo atual).
