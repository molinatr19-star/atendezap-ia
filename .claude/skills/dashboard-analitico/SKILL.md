---
name: dashboard-analitico
description: Padrões do dashboard gerencial do AtendeZap IA. Use ao criar ou revisar KPIs, gráficos, filtros de período, tabelas analíticas e as consultas que alimentam as métricas de atendimento e de funil do CRM.
---

# Dashboard analítico — AtendeZap IA

## Objetivo

Responder em poucos segundos: "Como está o atendimento e o funil agora, e comparado ao período anterior?"

## Estrutura da tela (`/dashboard`)

1. Barra de filtros: período (hoje, 7 dias, 30 dias, personalizado), canal, responsável.
2. Linha de KPIs (4 a 6 cards).
3. Gráficos principais (2 colunas no desktop, 1 no mobile).
4. Tabela de detalhe (ex.: conversas pendentes mais antigas).

## KPIs sugeridos

| KPI                        | Cálculo                              | Formato |
| -------------------------- | ------------------------------------ | ------- |
| Conversas abertas          | count(status = open)                 | inteiro |
| Tempo médio da 1ª resposta | média(1ª outbound − 1ª inbound)      | mm:ss   |
| Resolvidas pela IA         | resolvidas sem handoff / resolvidas  | %       |
| Novos leads                | count(Lead criado no período)        | inteiro |
| Taxa de conversão          | leads na etapa final / leads criados | %       |
| Mensagens                  | count(Message)                       | inteiro |

Cada KPI mostra valor atual, variação vs. período anterior (com seta e cor semântica) e tooltip com a definição.

## Gráficos

| Pergunta                     | Tipo                                          |
| ---------------------------- | --------------------------------------------- |
| Volume ao longo do tempo     | linha ou área                                 |
| Distribuição por hora do dia | barras ou heatmap                             |
| Funil por etapa              | barras horizontais (funil)                    |
| IA vs. humano                | barras empilhadas ou rosca (no máx. 4 fatias) |

Regras: eixo Y começa em zero em barras; legenda só quando há mais de uma série; paleta vinda dos tokens; testar no tema escuro.

## Dados

- Métricas calculadas no servidor (`src/server/services/metrics`), nunca no cliente a partir de listas completas.
- Contrato tipado por KPI (`{ value, previousValue, delta, unit }`).
- Filtros refletidos na URL (query string) para links compartilháveis.
- Dados fictícios coerentes em `src/mocks/` para demonstração.

## Estados

Skeleton por card/gráfico, mensagem de vazio por período, erro isolado por bloco (um gráfico com falha não derruba a tela).
