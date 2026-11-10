import { LogOut } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { signOutAction } from "@/server/actions/authActions";
import { requireUser, type UserRole } from "@/server/session";

const ROLE_LABEL: Record<UserRole, string> = {
  owner: "Dono(a)",
  admin: "Administrador(a)",
  agent: "Atendente",
};

/** Usuário logado + sair. Também protege o painel: sem sessão válida, redireciona ao login. */
export async function UserMenu() {
  const user = await requireUser();
  return (
    <div className="flex items-center gap-2">
      <div className="hidden text-right sm:block">
        <p className="text-sm leading-tight font-medium">{user.name}</p>
        <p className="text-xs leading-tight text-muted-foreground">{ROLE_LABEL[user.role]}</p>
      </div>
      <Avatar name={user.name} size="sm" className="bg-primary-soft text-primary-soft-foreground" />
      <form action={signOutAction}>
        <Button type="submit" variant="ghost" size="icon" aria-label="Sair">
          <LogOut />
        </Button>
      </form>
    </div>
  );
}
