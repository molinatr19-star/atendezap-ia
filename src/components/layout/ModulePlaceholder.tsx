import { getNavItem } from "@/config/navigation";
import { EmptyState } from "@/components/ui/EmptyState";

import { PageHeader } from "./PageHeader";

type ModulePlaceholderProps = {
  href: string;
  nextStep: string;
};

/** Página provisória de um módulo ainda não implementado. Título e ícone vêm da navegação. */
export function ModulePlaceholder({ href, nextStep }: ModulePlaceholderProps) {
  const item = getNavItem(href);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={item.title} description={item.description} />
      <EmptyState icon={item.icon} title="Módulo em construção" description={nextStep} />
    </div>
  );
}
