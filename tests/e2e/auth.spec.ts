import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { MOCK_TOKEN, MOCK_USER } from '../fixtures/mocks';

test.describe('Autenticação', () => {
  test('redireciona /login para quem não está autenticado', async ({ page }) => {
    await page.route('**/api/**', (route) => route.fulfill({ status: 401, json: {} }));
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('exibe formulário de login com campos corretos', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.submitButton).toHaveText('Entrar');
  });

  test('login com sucesso redireciona para dashboard', async ({ page }) => {
    // catch-all primeiro — rotas específicas adicionadas depois têm precedência (LIFO)
    await page.route('**/api/**', (route) => route.fulfill({ json: {} }));
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ json: { token: MOCK_TOKEN, user: MOCK_USER } })
    );

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin@teste.com', 'senha123');
    await loginPage.expectRedirectToDashboard();
  });

  test('credenciais inválidas exibem toast de erro', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ status: 401, json: { error: 'Credenciais inválidas' } })
    );

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('errado@teste.com', 'senhaerrada');

    await expect(page.getByText('Email ou senha incorretos')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('botão mostra "Entrando..." durante o loading', async ({ page }) => {
    await page.route('**/api/**', (route) => route.fulfill({ json: {} }));
    await page.route('**/api/auth/login', async (route) => {
      await new Promise((r) => setTimeout(r, 800));
      route.fulfill({ json: { token: MOCK_TOKEN, user: MOCK_USER } });
    });

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.emailInput.fill('admin@teste.com');
    await loginPage.passwordInput.fill('senha123');

    // Usar locator pelo type para não perder a referência quando o texto mudar
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    await expect(submitBtn).toHaveText('Entrando...');
    await expect(submitBtn).toBeDisabled();
  });

  test('logout limpa autenticação e redireciona para /login', async ({ page }) => {
    await page.addInitScript(({ token, user }) => {
      localStorage.setItem('crm-auth', JSON.stringify({ state: { token, user }, version: 0 }));
    }, { token: MOCK_TOKEN, user: MOCK_USER });

    await page.route('**/api/**', (route) => route.fulfill({ json: {} }));
    await page.goto('/dashboard');

    // Localizar e clicar no botão de logout na sidebar/header
    const logoutButton = page.getByRole('button', { name: /sair|logout/i });
    if (await logoutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutButton.click();
    } else {
      // Pode estar dentro de um dropdown — clicar no avatar primeiro
      await page.getByText('Admin Teste').click();
      await page.getByRole('button', { name: /sair|logout/i }).click();
    }

    await expect(page).toHaveURL('/login');
  });
});
