# 0007 — Autenticação, permissões e tempo real

- Data: 2026-11-10
- Status: aceita
- Substitui: o workspace fixo de demonstração usado até a ADR 0004

## Contexto

Sem login, qualquer pessoa com acesso às Server Actions (que são endpoints públicos) poderia alterar dados. Também faltava atualizar a tela quando outro usuário ou o agente mudasse algo.

## Decisão

### Autenticação

- **Better Auth 1.7** (e-mail e senha), sessões no PostgreSQL via adaptador Prisma. Tabelas geradas pelo CLI oficial, mais uma chave estrangeira `User -> Workspace`.
- Cadastro público desativado; usuários de demonstração criados pelo seed com o mesmo hash de senha do Better Auth.
- **Validação em três camadas**: `proxy.ts` (só checa se o cookie existe, para redirecionar rápido), páginas (`requireUser`) e cada Server Action/rota (`getActionUser`). O `workspaceId` sempre vem da sessão.
- Serviços perderam o workspace padrão: o compilador obriga cada chamada a informar o workspace.
- Papéis: só `owner`/`admin` alteram o agente de IA (verificado no servidor).
- Redirecionamento pós-login restrito a caminhos internos (proteção contra open redirect). Login termina com navegação completa para descartar o cache do roteador anterior ao login.
- Limite de tentativas de login mantido; desligado apenas no servidor dos testes E2E.

### Tempo real

- **PostgreSQL `LISTEN/NOTIFY` + Server-Sent Events**, sem serviço extra: os serviços publicam eventos só com ids e tipo; cada processo mantém **uma** conexão `LISTEN` e repassa os eventos às abas do mesmo workspace; o navegador recarrega os dados da tela (`router.refresh`).
- SSE em vez de WebSocket: comunicação só servidor -> navegador, reconexão automática nativa e funciona com rotas comuns do Next.

## Consequências

- Escala horizontal funciona sem mudanças: cada instância escuta o mesmo canal do Postgres.
- O conteúdo das mensagens nunca trafega pelo canal de eventos (cada aba relê os dados com a própria sessão).
- Próximos passos possíveis: convite de usuários pela tela, recuperação de senha por e-mail, auditoria de ações.
