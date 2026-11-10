# Arquitetura

> Documento vivo. Atualizar a cada decisão registrada em `docs/decisoes/`.

## Visão geral

```
WhatsApp (contato)
      |
      v
WhatsApp Cloud API ──webhook──> /api/webhooks/whatsapp
                                       |
                                       v
                           server/services/inbound
                           (valida, deduplica, salva)
                                       |
                 ┌─────────────────────┴─────────────────────┐
                 v                                           v
      Conversa com responsável = ai               Conversa com responsável = human
                 |                                           |
      lib/ai (Claude API + ferramentas)          Notifica painel (tempo real)
                 |                                           |
      Resposta ou handoff  ───────────────>  Operador responde em /conversas
                 |
      lib/whatsapp (envio) ──> WhatsApp Cloud API ──> contato

Eventos (nova mensagem, mudança de etapa) ──> painel: /conversas, /crm, /dashboard
```

## Camadas

| Camada        | Pasta                                   | Responsabilidade                 |
| ------------- | --------------------------------------- | -------------------------------- |
| Apresentação  | `src/app`, `src/components`             | Rotas, layouts e componentes     |
| Domínio de UI | `src/features`, `src/hooks`             | Estado e lógica por módulo       |
| Aplicação     | `src/server/services`                   | Casos de uso e regras de negócio |
| Dados         | `src/server/repositories`, `src/lib/db` | Persistência                     |
| Integrações   | `src/lib/ai`, `src/lib/whatsapp`        | SDKs e APIs externas             |

## Pontos em aberto

- Banco de dados e ORM.
- Mecanismo de tempo real.
- Provedor de autenticação.
- Hospedagem (ex.: Vercel + banco gerenciado).
