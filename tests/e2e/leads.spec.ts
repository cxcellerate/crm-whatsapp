import { test, expect } from '../fixtures/auth.fixture';
import { MOCK_LEADS, MOCK_PIPELINE } from '../fixtures/mocks';
import { LeadsPage } from '../pages/leads.page';

test.describe('Leads', () => {
  test('exibe lista de leads', async ({ authedPage }) => {
    const leadsPage = new LeadsPage(authedPage);
    await leadsPage.goto();

    await expect(authedPage.getByText('João Silva')).toBeVisible();
    await expect(authedPage.getByText('Maria Santos')).toBeVisible();
  });

  test('exibe telefone e origem dos leads', async ({ authedPage }) => {
    const leadsPage = new LeadsPage(authedPage);
    await leadsPage.goto();

    await expect(authedPage.getByText('11999990001')).toBeVisible();
    await expect(authedPage.getByText('Manual')).toBeVisible();
  });

  test('campo de busca filtra leads via API', async ({ authedPage }) => {
    // Override para busca retornar só um resultado
    await authedPage.route('**/api/leads*search=João*', (route) =>
      route.fulfill({ json: [MOCK_LEADS[0]] })
    );

    const leadsPage = new LeadsPage(authedPage);
    await leadsPage.goto();
    await leadsPage.search('João');

    // Aguarda debounce e nova requisição
    await authedPage.waitForTimeout(300);
    await expect(authedPage.getByText('João Silva')).toBeVisible();
  });

  test('abre modal ao clicar em "Novo Lead"', async ({ authedPage }) => {
    const leadsPage = new LeadsPage(authedPage);
    await leadsPage.goto();
    await leadsPage.openNewLeadModal();

    await expect(authedPage.getByRole('dialog')).toBeVisible();
    // Labels sem htmlFor — verificar pelo placeholder dos campos
    await expect(authedPage.getByPlaceholder('Nome completo')).toBeVisible();
    await expect(authedPage.getByPlaceholder('(11) 99999-9999')).toBeVisible();
  });

  test('campos obrigatórios bloqueiam submit sem preencher', async ({ authedPage }) => {
    const leadsPage = new LeadsPage(authedPage);
    await leadsPage.goto();
    await leadsPage.openNewLeadModal();
    await leadsPage.submitForm();

    // Modal permanece aberto após tentativa de submit sem preencher
    await expect(authedPage.getByRole('dialog')).toBeVisible();
  });

  test('cria lead com sucesso e fecha modal', async ({ authedPage }) => {
    const newLead = { ...MOCK_LEADS[0], id: 'lead-new', name: 'Carlos Novo' };

    await authedPage.route('**/api/leads', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 201, json: newLead });
      }
      return route.fulfill({ json: MOCK_LEADS });
    });

    const leadsPage = new LeadsPage(authedPage);
    await leadsPage.goto();
    await leadsPage.openNewLeadModal();
    await leadsPage.fillLeadForm({ name: 'Carlos Novo', phone: '11999990003', email: 'carlos@teste.com' });

    // Selecionar etapa (obrigatória)
    await authedPage.locator('select').first().selectOption({ index: 1 });
    await leadsPage.submitForm();

    await expect(authedPage.getByRole('dialog')).not.toBeVisible({ timeout: 3000 });
  });

  test('abre modal de edição ao clicar no ícone de edição', async ({ authedPage }) => {
    const leadsPage = new LeadsPage(authedPage);
    await leadsPage.goto();

    // Botões de ação ficam na última célula de cada linha — primeiro botão = editar
    const firstRow = authedPage.locator('tbody tr').first();
    const editButton = firstRow.locator('button').first();
    await editButton.click();

    await expect(authedPage.getByRole('dialog')).toBeVisible();
    await expect(authedPage.getByPlaceholder('Nome completo')).toHaveValue('João Silva');
  });

  test('abre confirmação ao clicar em excluir', async ({ authedPage }) => {
    const leadsPage = new LeadsPage(authedPage);
    await leadsPage.goto();

    // Segundo botão de cada linha = excluir
    const firstRow = authedPage.locator('tbody tr').first();
    const deleteButton = firstRow.locator('button').nth(1);
    await deleteButton.click();

    await expect(authedPage.getByRole('dialog')).toBeVisible();
    await expect(authedPage.getByRole('heading', { name: 'Remover lead' })).toBeVisible();
  });
});
