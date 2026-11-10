import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const metadata: Metadata = { title: "Configurações" };

export default function ConfiguracoesPage() {
  return (
    <ModulePlaceholder
      href="/configuracoes"
      nextStep="Próxima etapa: conexão do canal WhatsApp (modo simulado), equipe e etiquetas."
    />
  );
}
