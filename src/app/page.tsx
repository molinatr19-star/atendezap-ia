import { redirect } from "next/navigation";

// Sem autenticação nesta fase: a raiz leva direto ao painel.
export default function HomePage() {
  redirect("/dashboard");
}
