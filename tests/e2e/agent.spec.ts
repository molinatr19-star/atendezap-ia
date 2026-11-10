import { expect, test } from "@playwright/test";

test.describe("Agente de IA (motor simulado)", () => {
  test("contato pede atendente: a IA responde e transfere para a equipe", async ({ page }) => {
    await page.goto("/conversas/cv-01");
    await expect(page.getByRole("heading", { name: "Mariana Alves" })).toBeVisible();

    // Texto único por execução: a conversa pode já ter mensagens de execuções anteriores.
    const request = `Prefiro falar com um atendente, por favor (${Date.now()})`;
    await page.getByText(/Simular mensagem de Mariana/).click();
    await page.getByRole("textbox", { name: "Mensagem do contato" }).fill(request);
    await page.getByRole("button", { name: "Enviar como contato" }).click();

    const log = page.getByRole("log");
    await expect(log.getByText(request)).toBeVisible();
    await expect(log.getByText(/Vou chamar alguém da nossa equipe/).last()).toBeVisible();
    await expect(page.getByText("Transferida pela IA:")).toBeVisible();
    await expect(page.getByRole("button", { name: "Devolver para IA" })).toBeVisible();
  });

  test("tela de agentes salva a configuração e valida campos", async ({ page }) => {
    await page.goto("/agentes");
    await expect(page.getByText("Modo simulado.")).toBeVisible();

    const name = page.getByRole("textbox", { name: "Nome do agente" });
    await name.fill("A");
    await page.getByRole("button", { name: "Salvar configuração" }).click();
    await expect(page.getByText("Dê um nome ao agente.")).toBeVisible();

    await name.fill("Aurora Teste");
    await page.getByRole("button", { name: "Salvar configuração" }).click();
    await expect(page.getByText("Configuração salva.")).toBeVisible();

    await page.reload();
    await expect(page.getByRole("textbox", { name: "Nome do agente" })).toHaveValue("Aurora Teste");
  });
});
