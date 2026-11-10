# 0003 — Dashboard analítico e caixa de conversas (dados fictícios)

- Data: 2026-11-10
- Status: aceita

## Contexto

Primeira implementação funcional dos módulos Dashboard e Conversas, ainda sem banco de dados, sem IA real e com WhatsApp em modo simulado.

## Decisões

### Dados e camadas

- Dados fictícios determinísticos em `src/mocks/`: gerador com semente (mulberry32) e **relógio fixo** (`DEMO_NOW` = 10/11/2026 18:00, São Paulo). Motivo: com `cacheComponents`, `Date.now()`/`Math.random()` impedem a pré-renderização, e um relógio fixo garante o mesmo texto no servidor e no navegador.
- Camadas respeitadas: páginas -> `server/services` (cálculo de KPIs, montagem da caixa de entrada) -> `server/repositories` (hoje lê os mocks; amanhã, o banco). Os repositórios já são assíncronos, para os serviços não mudarem quando a persistência chegar.

### Dashboard

- **Gráficos em SVG próprio, sem Recharts.** São só três formas (área de série única, colunas, barra segmentada); escrever isso evita uma dependência e dá controle total de acessibilidade e tema. Reavaliar se surgirem gráficos mais complexos.
- Paleta categórica (azul/laranja) validada com o script da skill `dataviz` nos dois temas, contra as superfícies reais (`#ffffff` e `#121821`). Série única usa a cor primária da marca.
- Interação: crosshair e tooltip no gráfico de área, tooltip por coluna, navegação por teclado (setas, Home, End) e visualização em tabela em todos os gráficos.
- Filtro de período por URL (`?periodo=7d|30d|90d`), validado com Zod; valor inválido cai em 30 dias.

### Conversas

- Layout `conversas/layout.tsx` mantém a lista enquanto a conversa muda; no mobile, uma coluna por vez via CSS (`:has([data-conversation-open])`), sem ler a URL no layout.
- Regras de atendimento num reducer puro (`features/conversas/inboxReducer.ts`): marcar como lida, assumir (handoff IA -> humano), devolver para IA, resolver, reabrir, enviar. Estado compartilhado entre lista e chat por `InboxProvider`.
- Bloqueios de envio: conversa com a IA (precisa assumir), resolvida (precisa reabrir) e janela de 24 h encerrada (só templates).
- Mensagens validadas com Zod (1 a 4.096 caracteres, limite da Cloud API).

## Consequências e limitações

- Ações do operador valem só na sessão do navegador (não há backend). Ao recarregar, a demonstração volta ao estado inicial.
- `notFound()` em conversa inexistente mostra a página 404, mas o status HTTP é 200 (resposta já em streaming), com `noindex`.
- Ainda sem testes automatizados: as regras do reducer e da escala dos gráficos foram verificadas com um script manual. Vitest segue "a confirmar".
