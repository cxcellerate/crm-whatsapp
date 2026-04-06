import { test, expect } from '../fixtures/auth.fixture';
import { MOCK_PIPELINE, MOCK_STAGES } from '../fixtures/mocks';

test.describe('Kanban / Pipeline', () => {
  test.beforeEach(async ({ authedPage }) => {
    await authedPage.goto('/kanban');
  });

  test('exibe título "Pipeline Kanban"', async ({ authedPage }) => {
    await expect(authedPage.getByRole('heading', { name: 'Pipeline Kanban' })).toBeVisible();
  });

  test('exibe nome do pipeline ativo', async ({ authedPage }) => {
    await expect(authedPage.getByText(MOCK_PIPELINE.name)).toBeVisible();
  });

  test('exibe as colunas de cada etapa', async ({ authedPage }) => {
    // Nomes das etapas ficam em <span> dentro de KanbanColumn, não em heading
    // "Novo Lead" colide com o botão — usar nth(0) que é a coluna
    await expect(authedPage.getByText('Novo Lead').first()).toBeVisible();
    await expect(authedPage.getByText('Qualificado', { exact: true })).toBeVisible();
    await expect(authedPage.getByText('Proposta', { exact: true })).toBeVisible();
  });

  test('exibe cards dos leads nas colunas corretas', async ({ authedPage }) => {
    await expect(authedPage.getByText('João Silva')).toBeVisible();
    await expect(authedPage.getByText('Maria Santos')).toBeVisible();
  });

  test('botão "Novo Lead" da toolbar abre modal', async ({ authedPage }) => {
    // Botão na toolbar do KanbanPage — btn-primary com texto "Novo Lead"
    await authedPage.getByRole('button', { name: /Novo Lead/ }).first().click();
    await expect(authedPage.getByRole('dialog')).toBeVisible();
  });

  test('exibe mensagem quando não há pipeline configurado', async ({ authedPage }) => {
    await authedPage.route('**/api/pipelines', (route) =>
      route.fulfill({ json: [] })
    );
    await authedPage.reload();

    await expect(
      authedPage.getByText(/nenhum pipeline configurado/i)
    ).toBeVisible();
  });
});
