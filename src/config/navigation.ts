import {
  Bot,
  KanbanSquare,
  LayoutDashboard,
  MessagesSquare,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

/** Fonte única da navegação do painel (sidebar, menu mobile e cabeçalhos de página). */
export const mainNav: readonly NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Visão geral do atendimento e do funil de vendas.",
  },
  {
    title: "Conversas",
    href: "/conversas",
    icon: MessagesSquare,
    description: "Caixa de entrada do WhatsApp com handoff entre IA e equipe.",
  },
  {
    title: "CRM",
    href: "/crm",
    icon: KanbanSquare,
    description: "Funil de leads em quadro Kanban.",
  },
  {
    title: "Agentes de IA",
    href: "/agentes",
    icon: Bot,
    description: "Persona, instruções e regras de transferência dos agentes.",
  },
  {
    title: "Configurações",
    href: "/configuracoes",
    icon: Settings,
    description: "Canal WhatsApp, equipe, etiquetas e integrações.",
  },
];

export function getNavItem(href: string): NavItem {
  const item = mainNav.find((entry) => entry.href === href);
  if (!item) throw new Error(`Rota de navegação não cadastrada: ${href}`);
  return item;
}

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
