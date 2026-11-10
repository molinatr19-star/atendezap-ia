import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "./safeRedirect";

describe("safeRedirectPath", () => {
  it("aceita caminhos internos", () => {
    expect(safeRedirectPath("/crm")).toBe("/crm");
    expect(safeRedirectPath("/conversas/cv-01")).toBe("/conversas/cv-01");
  });

  // URL externa, protocolo relativo, barra invertida, vazio e ausente.
  it.each([
    "https://site-malicioso.com",
    "//site-malicioso.com",
    "/\\site-malicioso.com",
    "",
    null,
  ])("recusa %s e volta ao dashboard", (value) => {
    expect(safeRedirectPath(value)).toBe("/dashboard");
  });
});
