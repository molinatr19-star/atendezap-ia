import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const metadata: Metadata = { title: "Agentes de IA" };

export default function AgentesPage() {
  return (
    <ModulePlaceholder
      href="/agentes"
      nextStep="Próxima etapa: lista de agentes e formulário de persona, instruções e regras de handoff."
    />
  );
}
