import { test, expect } from '../fixtures/auth.fixture';

const MOCK_SETTINGS = [
  { key: 'wa_provider',          value: 'evolution' },
  { key: 'wa_evolution_url',     value: 'http://localhost:8080' },
  { key: 'wa_evolution_key',     value: 'minha-chave' },
  { key: 'wa_evolution_instance',value: 'default' },
  { key: 'ai_agent_enabled',     value: 'false' },
  { key: 'ai_agent_max_turns',   value: '8' },
  { key: 'ai_agent_company_name',value: 'Empresa Teste' },
];

test.describe('Configurações', () => {
  test.beforeEach(async ({ authedPage }) => {
    await authedPage.route('**/api/settings', (route) =>
      route.fulfill({ json: MOCK_SETTINGS })
    );
    await authedPage.goto('/settings');
  });

  test('exibe página de configurações', async ({ authedPage }) => {
    await expect(authedPage.getByRole('heading', { name: /configurações/i })).toBeVisible();
  });

  test('exibe seção de WhatsApp', async ({ authedPage }) => {
    await expect(authedPage.getByRole('heading', { name: 'WhatsApp Business' })).toBeVisible();
  });

  test('exibe seção de Agente de IA', async ({ authedPage }) => {
    await expect(authedPage.getByText(/agente de ia|ai agent/i)).toBeVisible();
  });

  test('salva configurações via botão de save', async ({ authedPage }) => {
    // Interceptar POST para /api/settings (a rota do beforeEach só faz GET)
    await authedPage.route('**/api/settings', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ json: { ok: true } });
      }
      return route.fulfill({ json: MOCK_SETTINGS });
    });

    // Botão "Salvar Configurações" fica dentro do WhatsAppProviderConfig
    const saveButton = authedPage.getByRole('button', { name: /Salvar Configurações/i });
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    // Toast "Configurações salvas!" deve aparecer
    await expect(authedPage.getByText('Configurações salvas!')).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Página de Equipe', () => {
  test('exibe lista de usuários', async ({ authedPage }) => {
    await authedPage.goto('/users');
    // "Admin Teste" aparece no header e na lista — usar main content para evitar strict mode
    await expect(authedPage.getByRole('main').getByText('Admin Teste').first()).toBeVisible();
    await expect(authedPage.getByText('admin@teste.com')).toBeVisible();
  });

  test('exibe role do usuário', async ({ authedPage }) => {
    await authedPage.goto('/users');
    // Badge com texto "Administrador" identifica o role visualmente
    await expect(authedPage.getByText('Administrador')).toBeVisible();
  });
});
