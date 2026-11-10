---
name: saas-ui
description: Padrões de interface SaaS do AtendeZap IA (Next.js, React, Tailwind, shadcn/ui). Use ao criar ou revisar layouts de painel, sidebar, header, formulários, tabelas, modais, a caixa de entrada de conversas, o quadro Kanban do CRM ou a tela de configuração de agentes.
---

# Interface SaaS — AtendeZap IA

## Layout base

- Shell do painel em `src/app/(painel)/layout.tsx`: sidebar fixa (recolhível), header com busca e menu do usuário, conteúdo com largura fluida.
- Navegação definida em um único arquivo (`src/config/navigation.ts`), nunca duplicada.
- Mobile: sidebar vira drawer; nenhuma rolagem horizontal da página até 360 px.

## Tokens e tema

- Cores, raios e sombras como variáveis CSS mapeadas no Tailwind (`background`, `foreground`, `primary`, `muted`, `border`, `success`, `warning`, `danger`).
- Tema claro e escuro desde o primeiro componente.
- Proibido usar cor hexadecimal direto no componente.

## Componentes

- Base em `src/components/ui/` (Button, Input, Card, Badge, Dialog, Table, Skeleton, Tooltip, Avatar).
- Componentes de domínio em `src/components/<módulo>/` compõem os de `ui/`.
- Props tipadas; variações com `cva` (class-variance-authority) quando houver mais de duas.

## Estados obrigatórios

Toda tela ou bloco com dados trata: carregando (skeleton), vazio (mensagem + ação), erro (mensagem + tentar novamente) e sucesso.

## Telas específicas

### Conversas (`/conversas`)

- Três colunas: lista de conversas | chat | painel do contato (recolhível).
- Indicadores: não lidas, responsável (IA ou humano), etiqueta, tempo desde a última mensagem.
- Composer com aviso quando a janela de 24 h expirou (só template).
- Botão claro de "Assumir conversa" (handoff IA -> humano) e "Devolver para IA".

### CRM Kanban (`/crm`)

- Colunas = `PipelineStage`; cards = `Lead` (nome, valor, responsável, etiquetas, última interação).
- Arrastar e soltar com alternativa por teclado e por menu ("Mover para...").
- Atualização otimista com reversão em caso de erro.

### Agentes (`/agentes`)

- Formulário em seções: identidade, instruções, base de conhecimento, horário, regras de handoff.
- Pré-visualização de conversa de teste ao lado.

## Acessibilidade

Contraste AA, foco visível, `aria-label` em botões só de ícone, ordem de tabulação lógica, `aria-live` para novas mensagens.

## Textos

Interface em português do Brasil, tom profissional e curto. Datas e moeda com `Intl` em `pt-BR` / `BRL`.
