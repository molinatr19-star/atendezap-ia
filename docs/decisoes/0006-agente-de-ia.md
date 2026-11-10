# 0006 — Agente de IA com Claude API e motor simulado

- Data: 2026-11-10
- Status: aceita

## Contexto

O agente precisa responder clientes, agir no CRM e transferir para humanos, sem que a demonstração dependa de uma chave paga.

## Decisão

- **SDK oficial** `@anthropic-ai/sdk`. Modelo padrão `claude-opus-5-5` (recomendação da skill oficial; trocar por Sonnet/Haiku via `AI_MODEL` é decisão de custo de quem paga), esforço `low` para chat (`AI_EFFORT`).
- **Loop manual de ferramentas** no endpoint beta, para controlar cada efeito no banco: `transfer_to_human`, `update_lead_stage` (enum com as etapas do workspace) e `add_tag`. Ferramentas com `strict: true`; forçar ferramenta não é permitido neste modelo, então o prompt orienta.
- **Fallback de recusa no servidor** (`server-side-fallback-2026-07-01`, `fallbacks: "default"`). Se mesmo assim houver recusa, ou se a API falhar, a conversa é **transferida para a equipe**: o contato nunca fica sem atendimento.
- **Contrato de motor** (`AgentEngine`): o motor decide; o serviço executa as ferramentas. Dois motores com a mesma interface: Claude (com `ANTHROPIC_API_KEY`) e simulado (sem chave, regras simples, mesmas ferramentas).
- Argumentos das ferramentas validados com Zod; texto do contato tratado como dado (instrução explícita no prompt contra injeção).
- Entrada única de mensagens (`receiveContactMessage`): usada pelo simulador do painel e, no futuro, pelo webhook do WhatsApp.
- Configuração do agente por workspace (`AiAgent`), editável em `/agentes` por dono/admin.

## Consequências

- Testes forçam o motor simulado: nunca geram custo de API.
- A chave fica só no `.env` do servidor; a tela de agentes mostra o modelo, nunca a chave.
- Próximos passos possíveis: base de conhecimento (RAG), streaming da resposta, avaliação (eval) das respostas.
