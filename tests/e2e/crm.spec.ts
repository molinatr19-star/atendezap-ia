import { expect, test, type Page } from "@playwright/test";

const column = (page: Page, name: string) =>
  page.getByRole("listitem", { name: new RegExp(`^Etapa ${name},`) });

test.describe("CRM Kanban", () => {
  test("mover pelo seletor persiste após recarregar", async ({ page }) => {
    await page.goto("/crm");
    const lucas = page.getByRole("article", { name: "Lead Lucas Martins" });
    await expect(
      column(page, "Proposta enviada").getByRole("article", { name: "Lead Lucas Martins" }),
    ).toBeVisible();

    await lucas.getByRole("combobox", { name: /Mover Lucas Martins para/ }).selectOption({
      label: "Negociação",
    });
    await expect(
      column(page, "Negociação").getByRole("article", { name: "Lead Lucas Martins" }),
    ).toBeVisible();

    await expect(page.getByText("Salvando alterações…")).toHaveCount(0);
    await page.reload();
    await expect(
      column(page, "Negociação").getByRole("article", { name: "Lead Lucas Martins" }),
    ).toBeVisible();
  });

  test("arrastar pelo teclado move o lead para a coluna seguinte", async ({ page }) => {
    await page.goto("/crm");
    // Fernanda começa em "Negociação"; a coluna à direita é "Fechado".
    await expect(
      column(page, "Negociação").getByRole("article", { name: "Lead Fernanda Ribeiro" }),
    ).toBeVisible();

    const handle = page.getByRole("button", { name: "Arrastar lead Fernanda Ribeiro" });
    // Como um usuário de leitor de tela: espera cada anúncio antes da próxima tecla.
    const announcer = page.locator("[id^='DndLiveRegion']");
    await handle.focus();
    await page.keyboard.press("Space");
    await expect(announcer).toContainText("Negociação");
    await page.keyboard.press("ArrowRight");
    await expect(announcer).toContainText("Fechado");
    await page.keyboard.press("Space");
    await expect(announcer).toContainText("movido para coluna Fechado");

    await expect(
      column(page, "Fechado").getByRole("article", { name: "Lead Fernanda Ribeiro" }),
    ).toBeVisible();
    await expect(page.getByText("Salvando alterações…")).toHaveCount(0);
    await page.reload();
    await expect(
      column(page, "Fechado").getByRole("article", { name: "Lead Fernanda Ribeiro" }),
    ).toBeVisible();
  });
});
