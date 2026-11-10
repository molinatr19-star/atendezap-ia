# Modelo de dados (rascunho conceitual)

> Modelo conceitual. O schema implementado está em `prisma/schema.prisma` (ADR 0004). Diferenças: `User` e `WhatsAppChannel` ainda não existem (sem login e sem número real); foi criada a entidade `Attendance` (atendimento encerrado: início, fim, quem resolveu, tempo da 1ª resposta, se gerou lead), que alimenta o dashboard.

## Entidades

| Entidade | Campos principais | Observações |
|---|---|---|
| Workspace | id, name, plan, createdAt | Raiz do multi-tenant |
| User | id, workspaceId, name, email, role | role: owner, admin, agent |
| WhatsAppChannel | id, workspaceId, phoneNumberId, displayPhone, status | Um workspace pode ter vários números |
| Contact | id, workspaceId, phoneE164, name, tags, optIn | Telefone sempre em E.164 |
| Conversation | id, workspaceId, contactId, channelId, status, assignee, assignedUserId, lastMessageAt, windowExpiresAt | status: open, pending, resolved. assignee: ai, human |
| Message | id, conversationId, externalId, direction, author, type, content, deliveryStatus, createdAt | externalId único (idempotência do webhook) |
| Lead | id, workspaceId, contactId, stageId, value, ownerId, position | position ordena o card na coluna |
| PipelineStage | id, workspaceId, name, order, color | Colunas do Kanban |
| AiAgent | id, workspaceId, name, persona, instructions, model, temperature, handoffRules, active | Configurado em /agentes |
| Tag | id, workspaceId, name, color | Aplicada a contatos e conversas |

## Relacionamentos

```
Workspace 1──N User
Workspace 1──N WhatsAppChannel
Workspace 1──N Contact 1──N Conversation 1──N Message
Contact   1──N Lead N──1 PipelineStage
Workspace 1──N AiAgent
```

## Métricas do dashboard (derivadas)

- Conversas abertas, pendentes e resolvidas por período.
- Tempo médio da primeira resposta.
- Taxa de resolução pela IA (sem handoff).
- Leads por etapa e taxa de conversão entre etapas.
- Volume de mensagens por hora/dia.
