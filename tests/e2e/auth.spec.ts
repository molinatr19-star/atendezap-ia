import { expect, test } from "@playwright/test";

// Login faz navegação completa + renderização do painel: URLs pós-login esperam até 20 s.
test.describe("Autenticação e permissões", () => {
  test.describe("sem sessão", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("painel redireciona ao login e volta ao destino depois", async ({ page }) => {
      await page.goto("/crm");
      await expect(page).toHaveURL(/\/login\?next=%2Fcrm/);

      await page.getByRole("button", { name: "Entrar como dona (admin)" }).click();
      await expect(page).toHaveURL(/\/crm$/, { timeout: 20_000 });
    });

    test("senha errada mostra mensagem genérica", async ({ page }) => {
      await page.goto("/login");
      await page.getByRole("textbox", { name: "E-mail" }).fill("ana@atendezap.example");
      await page.getByLabel("Senha").fill("senha-errada");
      await page.getByRole("button", { name: "Entrar", exact: true }).click();
      // Filtra pelo texto: o Next também tem um elemento role="alert" (anunciador de rotas).
      await expect(
        page.getByRole("alert").filter({ hasText: "E-mail ou senha incorretos." }),
      ).toBeVisible();
      await expect(page).toHaveURL(/\/login/);
    });

    test("API de tempo real exige sessão", async ({ request }) => {
      const response = await request.get("/api/events");
      expect(response.status()).toBe(401);
    });

    test("atendente vê o agente somente leitura", async ({ page }) => {
      await page.goto("/login");
      await page.getByRole("button", { name: "Entrar como atendente" }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

      await page.goto("/agentes");
      await expect(page.getByText("Somente leitura")).toBeVisible();
      await expect(page.getByRole("button", { name: "Salvar configuração" })).toBeDisabled();
    });

    test("sair encerra a sessão", async ({ page }) => {
      await page.goto("/login");
      await page.getByRole("button", { name: "Entrar como atendente" }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

      await page.getByRole("button", { name: "Sair" }).click();
      await expect(page).toHaveURL(/\/login/);
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/login/);
    });
  });
});

test.describe("Tempo real", () => {
  test("mensagem nova aparece na lista de outra aba sem recarregar", async ({ context }) => {
    const observer = await context.newPage();
    await observer.goto("/conversas");
    await expect(observer.getByRole("status", { name: "Ao vivo" })).toBeVisible();

    const actor = await context.newPage();
    await actor.goto("/conversas/cv-02");
    const text = `Tempo real ${Date.now()}`;
    await actor.getByText(/Simular mensagem de Rafael/).click();
    await actor.getByRole("textbox", { name: "Mensagem do contato" }).fill(text);
    await actor.getByRole("button", { name: "Enviar como contato" }).click();

    // A outra aba não foi recarregada: a lista se atualiza pelo evento do servidor.
    await expect(
      observer.getByRole("list", { name: "Lista de conversas" }).getByText(text),
    ).toBeVisible({ timeout: 10_000 });
  });
});
