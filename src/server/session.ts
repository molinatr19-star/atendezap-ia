import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export type UserRole = "owner" | "admin" | "agent";

/** Usuário logado, no formato que o resto do app usa. workspaceId vem SEMPRE daqui. */
export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  workspaceId: string;
  role: UserRole;
};

function toRole(value: unknown): UserRole {
  return value === "owner" || value === "admin" ? value : "agent";
}

/** Valida a sessão no banco (não só a existência do cookie). Lê headers: é por requisição. */
async function readCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    workspaceId: session.user.workspaceId,
    role: toRole(session.user.role),
  };
}

/** Para páginas e componentes de servidor: sem sessão válida, vai para o login. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await readCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Para Server Actions e rotas de API: devolve null e quem chamou responde com erro. */
export async function getActionUser(): Promise<CurrentUser | null> {
  return readCurrentUser();
}

export function canManageWorkspace(user: CurrentUser): boolean {
  return user.role === "owner" || user.role === "admin";
}
