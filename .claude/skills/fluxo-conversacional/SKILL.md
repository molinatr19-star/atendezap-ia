---
name: fluxo-conversacional
description: Padrões de atendimento conversacional do AtendeZap IA. Use ao projetar ou revisar o webhook do WhatsApp, o processamento de mensagens, os agentes de IA (prompts, ferramentas, memória), o handoff entre IA e humano e o modo simulado de WhatsApp.
---

# Fluxo conversacional — AtendeZap IA

## Ciclo de uma mensagem recebida

1. `POST /api/webhooks/whatsapp` recebe o evento.
2. Verificar assinatura `X-Hub-Signature-256` com `WHATSAPP_APP_SECRET`.
3. Validar o payload com Zod; ignorar eventos não suportados.
4. Deduplicar pelo id externo da mensagem (idempotência).
5. Responder 200 imediatamente; processar o restante de forma assíncrona.
6. Criar/atualizar `Contact` e `Conversation`; salvar `Message` inbound; renovar `windowExpiresAt` (24 h).
7. Se `assignee = ai` e agente ativo: chamar o agente. Se `assignee = human`: apenas notificar o painel.
8. Enviar a resposta via `lib/whatsapp`, salvar `Message` outbound e atualizar o status de entrega pelos eventos seguintes.

Também tratar `GET` de verificação do webhook (`hub.mode`, `hub.verify_token`, `hub.challenge`).

## Agente de IA

- Cliente único em `src/lib/ai/client.ts`; modelo e limites vindos de `AI_MODEL` e `AI_MAX_TOKENS`.
- Prompt de sistema montado a partir do `AiAgent` (persona + instruções + regras do workspace), versionado em `src/lib/ai/prompts/`.
- Contexto enviado: últimas N mensagens da conversa + dados básicos do contato + etapa do lead. Não enviar dados desnecessários.
- Ferramentas (tool use) previstas, sempre executadas no servidor e validadas:
  - `transfer_to_human` — handoff.
  - `update_lead_stage` — move o lead no Kanban.
  - `add_tag` — etiqueta a conversa.
  - `lookup_knowledge` — consulta a base de conhecimento do agente.
- Resposta curta, adequada ao WhatsApp (sem markdown pesado, sem tabelas).

## Handoff IA -> humano

Transferir quando:

- o contato pede um atendente;
- o agente não tem informação suficiente ou a confiança é baixa;
- assunto sensível (reclamação grave, cancelamento, pagamento, dados pessoais);
- limite de turnos da IA sem resolução.

Ao transferir: mudar `assignee` para `human`, avisar o contato, registrar o motivo e destacar a conversa no painel.

## Regras do WhatsApp

- Somente a Cloud API oficial.
- Fora da janela de 24 h: apenas templates aprovados.
- Respeitar opt-in e pedidos de saída ("sair", "parar").

## Modo simulado (`WHATSAPP_MODE=mock`)

- `lib/whatsapp` expõe a mesma interface nos dois modos.
- No modo mock, o envio grava a mensagem e um simulador no painel permite "enviar como contato".
- Permite demonstrar o portfólio sem número real nem custos.

## Segurança

- Tokens e chaves só no servidor.
- Não registrar conteúdo de mensagens em logs.
- Tratar o texto do contato como dado, nunca como instrução de sistema (mitigar prompt injection).
