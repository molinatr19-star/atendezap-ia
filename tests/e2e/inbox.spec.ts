import { expect, test } from "@playwright/test";

test.describe("Caixa de entrada", () => {
  test("operador assume, responde e resolve; tudo persiste após recarregar", async ({ page }) => {
    await page.goto("/conversas/cv-05");
    await expect(page.getByRole("heading", { name: "Camila Rocha" })).toBeVisible();

    // Com a IA no comando, o envio fica bloqueado até assumir.
    await expect(page.getByText("A IA está conduzindo esta conversa.")).toBeVisible();
    await page.getByRole("button", { name: "Assumir", exact: true }).click();

    const message = `Teste E2E: medidas anotadas (${Date.now()})`;
    const input = page.getByRole("textbox", { name: "Mensagem" });
    await input.fill(message);
    await input.press("Enter");
    await expect(page.getByRole("log").getByText(message)).toBeVisible();

    await page.getByRole("button", { name: "Resolver" }).click();
    await expect(page.getByText("Conversa resolvida.")).toBeVisible();

    // Recarregar a página: os dados vêm do banco, não do estado do navegador.
    await page.reload();
    await expect(page.getByRole("log").getByText(message)).toBeVisible();
    await expect(page.getByText("Conversa resolvida.")).toBeVisible();
  });

  test("bloqueia resposta quando a janela de 24 h terminou", async ({ page }) => {
    await page.goto("/conversas/cv-06");
    await expect(page.getByRole("heading", { name: "Lucas Martins" })).toBeVisible();
    await expect(page.getByText(/janela de 24 h do WhatsApp terminou/)).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Mensagem" })).toHaveCount(0);
  });

  test("filtros e busca da lista", async ({ page }) => {
    await page.goto("/conversas");
    const list = page.getByRole("list", { name: "Lista de conversas" });

    await page.getByRole("button", { name: /Com a IA/ }).click();
    await expect(list.getByText("Mariana Alves")).toBeVisible();
    await expect(list.getByText("Rafael Souza")).toHaveCount(0);

    await page.getByRole("button", { name: /Abertas/ }).click();
    await page.getByRole("searchbox", { name: /Buscar conversas/ }).fill("juliana");
    await expect(list.getByText("Juliana Costa")).toBeVisible();
    await expect(list.getByRole("link")).toHaveCount(1);
  });
});

test.describe("Dashboard", () => {
  test("filtro de período atualiza a URL e os indicadores", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("vs. 30 dias anteriores").first()).toBeVisible();

    await page.getByRole("link", { name: "7 dias" }).click();
    await expect(page).toHaveURL(/periodo=7d/);
    await expect(page.getByText("vs. 7 dias anteriores").first()).toBeVisible();

    // Gráfico renderizado e navegável por teclado: o ponto ativo é anunciado ao leitor de tela.
    const chart = page.getByRole("group", { name: /Atendimentos por dia/ });
    await expect(chart.locator("svg path").first()).toBeVisible();
    const announcement = chart.locator("[aria-live]");
    await expect(announcement).toHaveText("");
    await chart.focus();
    await chart.press("ArrowLeft");
    await expect(announcement).toHaveText(/\d+ atendimentos$/);
  });
});
