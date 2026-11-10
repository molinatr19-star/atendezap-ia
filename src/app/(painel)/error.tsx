"use client"; // Error boundaries precisam ser Client Components.

import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

type PainelErrorProps = {
  error: unknown;
  retry: () => void;
};

export default function PainelError({ error, retry }: PainelErrorProps) {
  useEffect(() => {
    // Ponto único para plugar um serviço de monitoramento no futuro.
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      icon={TriangleAlert}
      title="Algo deu errado"
      description="Não foi possível carregar esta página. Tente novamente em instantes."
      action={<Button onClick={retry}>Tentar novamente</Button>}
    />
  );
}
