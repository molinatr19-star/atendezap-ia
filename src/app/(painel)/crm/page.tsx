import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const metadata: Metadata = { title: "CRM" };

export default function CrmPage() {
  return (
    <ModulePlaceholder
      href="/crm"
      nextStep="Próxima etapa: quadro Kanban com etapas do funil e cards de leads."
    />
  );
}
