import { expect, test as setup } from "@playwright/test";

export const OWNER_STATE = "playwright/.auth/owner.json";

/** Entra uma vez pela tela de login real e salva a sessão para os demais testes. */
setup("login da dona (admin)", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "E-mail" }).fill("ana@atendezap.example");
  await page.getByLabel("Senha").fill("demo12345");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  // Login faz navegação completa + primeira renderização do dashboard: margem maior que 5 s.
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  await expect(page.getByText("Ana Souza")).toBeVisible({ timeout: 20_000 });
  await page.context().storageState({ path: OWNER_STATE });
});
