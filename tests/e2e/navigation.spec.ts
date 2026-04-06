import { test, expect } from '../fixtures/auth.fixture';

test.describe('Navegação', () => {
  test.beforeEach(async ({ authedPage }) => {
    await authedPage.route('**/api/ai-agent*', (route) =>
      route.fulfill({ json: { sessions: [], total: 0, page: 1, pages: 1 } })
    );
    await authedPage.route('**/api/form-captures*', (route) =>
      route.fulfill({ json: [] })
    );
    await authedPage.goto('/dashboard');
  });

  test('navega para Pipeline via sidebar', async ({ authedPage }) => {
    await authedPage.getByRole('link', { name: 'Pipeline', exact: true }).click();
    await expect(authedPage).toHaveURL('/kanban');
    await expect(authedPage.getByRole('heading', { name: 'Pipeline Kanban' })).toBeVisible();
  });

  test('navega para Leads via sidebar', async ({ authedPage }) => {
    await authedPage.getByRole('link', { name: 'Leads', exact: true }).click();
    await expect(authedPage).toHaveURL('/leads');
    await expect(authedPage.getByRole('heading', { name: 'Leads', exact: true })).toBeVisible();
  });

  test('navega para Agente de IA via sidebar', async ({ authedPage }) => {
    await authedPage.getByRole('link', { name: 'Agente de IA', exact: true }).click();
    await expect(authedPage).toHaveURL('/ai-agent');
  });

  test('navega para Equipe via sidebar', async ({ authedPage }) => {
    await authedPage.getByRole('link', { name: 'Equipe', exact: true }).click();
    await expect(authedPage).toHaveURL('/users');
  });

  test('navega para Configurações via sidebar', async ({ authedPage }) => {
    await authedPage.getByRole('link', { name: 'Configurações', exact: true }).click();
    await expect(authedPage).toHaveURL('/settings');
  });

  test('rota desconhecida redireciona para dashboard', async ({ authedPage }) => {
    await authedPage.goto('/pagina-que-nao-existe');
    await expect(authedPage).toHaveURL('/dashboard');
  });
});
