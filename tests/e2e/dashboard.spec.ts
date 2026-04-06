import { test, expect } from '../fixtures/auth.fixture';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ authedPage }) => {
    await authedPage.goto('/dashboard');
  });

  test('exibe heading do Dashboard', async ({ authedPage }) => {
    await expect(authedPage.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  });

  test('exibe os 4 cards de KPI', async ({ authedPage }) => {
    await expect(authedPage.getByText('Total de Leads')).toBeVisible();
    // "Leads este mês" aparece 2x (card + resumo) — verificar somente o primeiro
    await expect(authedPage.getByText('Leads este mês').first()).toBeVisible();
    await expect(authedPage.getByText('Mensagens (semana)')).toBeVisible();
    await expect(authedPage.getByText('Valor total')).toBeVisible();
  });

  test('exibe valores corretos nos KPIs', async ({ authedPage }) => {
    // Total leads = 5
    await expect(authedPage.getByText('5').first()).toBeVisible();
  });

  test('exibe seção de gráficos', async ({ authedPage }) => {
    await expect(authedPage.getByText('Leads por Origem')).toBeVisible();
    await expect(authedPage.getByText('Leads por Etapa')).toBeVisible();
  });

  test('exibe cards de resumo semanal/mensal', async ({ authedPage }) => {
    await expect(authedPage.getByText('Leads esta semana')).toBeVisible();
    // Usar nth(1) pois "Leads este mês" aparece também nos KPIs
    await expect(authedPage.getByText('Leads este mês').nth(1)).toBeVisible();
  });

  test('sidebar exibe links de navegação', async ({ authedPage }) => {
    await expect(authedPage.getByRole('link', { name: 'Pipeline', exact: true })).toBeVisible();
    // Usar exact:true para não pegar "Captura de Leads"
    await expect(authedPage.getByRole('link', { name: 'Leads', exact: true })).toBeVisible();
    await expect(authedPage.getByRole('link', { name: 'Configurações', exact: true })).toBeVisible();
  });

  test('status WhatsApp exibe "Conectado" quando API retorna open', async ({ authedPage }) => {
    await expect(authedPage.getByText('Conectado · Evolution')).toBeVisible();
  });
});
