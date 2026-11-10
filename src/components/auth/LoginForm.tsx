"use client";

import { LoaderCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { safeRedirectPath } from "@/features/auth/safeRedirect";
import { authClient } from "@/lib/authClient";

const DEMO_ACCOUNTS = [
  { label: "Entrar como dona (admin)", email: "ana@atendezap.example" },
  { label: "Entrar como atendente", email: "bruno@atendezap.example" },
] as const;
const DEMO_PASSWORD = "demo12345";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const baseId = useId();

  const signIn = async (credentials: { email: string; password: string }) => {
    setError(null);
    setPending(true);
    const { error: signInError } = await authClient.signIn.email(credentials);
    if (signInError) {
      setPending(false);
      // Mensagem genérica: não revela se o e-mail existe.
      setError(
        signInError.status === 429
          ? "Muitas tentativas. Aguarde um pouco e tente novamente."
          : "E-mail ou senha incorretos.",
      );
      return;
    }
    // Navegação completa (não router.replace): o cache do roteador pode guardar respostas de
    // antes do login (ex.: prefetch redirecionado ao /login). Recarregar garante dados da sessão nova.
    window.location.assign(safeRedirectPath(searchParams.get("next")));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void signIn({ email: email.trim(), password });
  };

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${baseId}-email`} className="text-sm font-medium">
            E-mail
          </label>
          <input
            id={`${baseId}-email`}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-10 rounded-lg border bg-background px-3 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${baseId}-password`} className="text-sm font-medium">
            Senha
          </label>
          <input
            id={`${baseId}-password`}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-10 rounded-lg border bg-background px-3 text-sm"
          />
        </div>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="h-10">
          {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
          Entrar
        </Button>
      </form>

      <div className="flex flex-col gap-2 rounded-lg border border-dashed p-4">
        <p className="text-xs text-muted-foreground">
          Demonstração (dados fictícios). Senha das contas: <code>{DEMO_PASSWORD}</code>
        </p>
        {DEMO_ACCOUNTS.map((account) => (
          <Button
            key={account.email}
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() => void signIn({ email: account.email, password: DEMO_PASSWORD })}
          >
            {account.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
