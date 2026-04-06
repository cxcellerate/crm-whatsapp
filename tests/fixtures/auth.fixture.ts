import { test as base, Page } from '@playwright/test';
import { MOCK_TOKEN, MOCK_USER, MOCK_PIPELINE, MOCK_LEADS, MOCK_STATS } from './mocks';

/**
 * Injeta o token de autenticação no localStorage (Zustand persist) e
 * configura os mocks de API padrão para todos os testes autenticados.
 */
async function setupAuthStorage(page: Page) {
  await page.addInitScript(({ token, user }) => {
    const authState = { state: { token, user }, version: 0 };
    localStorage.setItem('crm-auth', JSON.stringify(authState));
  }, { token: MOCK_TOKEN, user: MOCK_USER });
}

async function setupDefaultApiMocks(page: Page) {
  // Auth - /me
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ json: MOCK_USER })
  );

  // Dashboard
  await page.route('**/api/dashboard/stats', (route) =>
    route.fulfill({ json: MOCK_STATS })
  );

  // Pipelines
  await page.route('**/api/pipelines', (route) =>
    route.fulfill({ json: [MOCK_PIPELINE] })
  );

  // Leads
  await page.route('**/api/leads*', (route) =>
    route.fulfill({ json: MOCK_LEADS })
  );

  // Users
  await page.route('**/api/users', (route) =>
    route.fulfill({ json: [MOCK_USER] })
  );

  // WhatsApp status
  await page.route('**/api/settings/whatsapp/status', (route) =>
    route.fulfill({ json: { state: 'open', provider: 'evolution' } })
  );

  // Settings
  await page.route('**/api/settings*', (route) =>
    route.fulfill({ json: [] })
  );

  // AI Agent sessions
  await page.route('**/api/ai-agent*', (route) =>
    route.fulfill({ json: { sessions: [], total: 0, page: 1, pages: 1 } })
  );
}

type AuthFixtures = {
  authedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authedPage: async ({ page }, use) => {
    await setupAuthStorage(page);
    await setupDefaultApiMocks(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
export { setupAuthStorage, setupDefaultApiMocks };
