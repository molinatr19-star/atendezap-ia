# 0002 — Base Next.js e bibliotecas de UI

- Data: 2026-11-10
- Status: aceita

## Contexto

Inicialização do projeto Next.js e da base do painel (layout, navegação, tema). O `create-next-app` não roda em pasta com arquivos, então o template foi gerado em pasta temporária e mesclado.

## Decisão

- **Next.js 16.4.6**, React 19.3, Tailwind CSS 4.3 (via `@tailwindcss/turbopack`), TypeScript strict, ESLint 9.
- Mantidos os padrões do template: `cacheComponents: true` e `partialPrefetching: true` em `next.config.ts`.
- Bibliotecas de apoio à UI no padrão shadcn/ui: `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react` (ícones).
- `zod` instalado para validação.
- Formatação: `prettier` + `prettier-plugin-tailwindcss`.
- **Tema claro/escuro sem biblioteca**: atributo `data-theme` no `<html>`, definido por script inline no `<head>` (padrão do guia oficial "preventing flash before hydration"). O `next-themes` foi descartado por injetar `<script>` em componente, o que o React 19 recente acusa em desenvolvimento.
- Componentes de UI escritos no projeto (não via CLI do shadcn), em PascalCase, conforme o CLAUDE.md.

## Consequências

- Com `cacheComponents`, páginas visitadas ficam ocultas em `<Activity>` em vez de desmontadas: estados transitórios (menus, popovers) precisam ser fechados ao navegar (ver `node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md`).
- Componentes que usam `usePathname`/`useSearchParams` ficam dentro de `<Suspense>` para não quebrar o build em rotas dinâmicas futuras.
- `error.tsx` nesta versão recebe `{ error: unknown, retry }`.
- Recharts e dnd-kit continuam "a confirmar"; só entram quando os módulos de dashboard e CRM forem iniciados.
