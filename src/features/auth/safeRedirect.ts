/**
 * Destino após o login (?next=). Só aceita caminhos internos do painel: impede "open redirect"
 * (ex.: ?next=https://site-malicioso.com ou //site-malicioso.com usando o login como isca).
 */
export function safeRedirectPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/dashboard";
  }
  return value;
}
