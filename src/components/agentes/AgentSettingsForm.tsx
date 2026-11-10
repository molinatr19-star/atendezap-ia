"use client";

import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useActionState, useId } from "react";

import { Button } from "@/components/ui/Button";
import { saveAgentAction, type AgentFormState } from "@/server/actions/agentActions";
import { cn } from "@/lib/utils/cn";

export type AgentFormValues = {
  name: string;
  persona: string;
  instructions: string;
  handoffRules: string;
  active: boolean;
};

type FieldName = "name" | "persona" | "instructions" | "handoffRules";

const FIELDS: { name: FieldName; label: string; hint: string; rows?: number; max: number }[] = [
  { name: "name", label: "Nome do agente", hint: "Como ele se apresenta ao contato.", max: 40 },
  {
    name: "persona",
    label: "Persona e tom de voz",
    hint: "Quem é o agente e como fala. Ex.: cordial, objetivo, sem gírias.",
    rows: 4,
    max: 1500,
  },
  {
    name: "instructions",
    label: "Instruções do negócio",
    hint: "Produtos, horários, endereço, políticas. O agente não inventa o que não estiver aqui.",
    rows: 8,
    max: 6000,
  },
  {
    name: "handoffRules",
    label: "Quando transferir para a equipe",
    hint: "Situações em que um humano deve assumir.",
    rows: 4,
    max: 1500,
  },
];

const initialState: AgentFormState = { status: "idle" };

export function AgentSettingsForm({ initial }: { initial: AgentFormValues }) {
  const [state, formAction, isPending] = useActionState(saveAgentAction, initialState);
  const baseId = useId();

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {FIELDS.map((field) => {
        const id = `${baseId}-${field.name}`;
        const error = state.fieldErrors?.[field.name];
        const common = {
          id,
          name: field.name,
          defaultValue: initial[field.name],
          maxLength: field.max,
          "aria-invalid": error ? true : undefined,
          "aria-describedby": `${id}-hint${error ? ` ${id}-error` : ""}`,
          className: cn(
            "w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground",
            error && "border-danger",
          ),
        };
        return (
          <div key={field.name} className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-sm font-medium">
              {field.label}
            </label>
            {field.rows ? (
              <textarea
                {...common}
                rows={field.rows}
                className={cn(common.className, "resize-y")}
              />
            ) : (
              <input {...common} type="text" />
            )}
            <p id={`${id}-hint`} className="text-xs text-muted-foreground">
              {field.hint}
            </p>
            {error ? (
              <p id={`${id}-error`} className="text-xs text-danger">
                {error}
              </p>
            ) : null}
          </div>
        );
      })}

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={initial.active}
          className="size-4 accent-(--primary)"
        />
        Agente ativo (responde automaticamente as conversas conduzidas pela IA)
      </label>

      <div className="flex flex-wrap items-center gap-3 border-t pt-5">
        <Button type="submit" disabled={isPending}>
          {isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
          Salvar configuração
        </Button>
        <p
          aria-live="polite"
          className={cn(
            "flex items-center gap-1.5 text-sm",
            state.status === "error" ? "text-danger" : "text-success",
          )}
        >
          {state.status === "saved" ? <CheckCircle2 className="size-4" aria-hidden="true" /> : null}
          {state.message}
        </p>
      </div>
    </form>
  );
}
