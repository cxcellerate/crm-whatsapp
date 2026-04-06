import { Page, Locator, expect } from '@playwright/test';

export class LeadsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly newLeadButton: Locator;
  readonly searchInput: Locator;
  readonly modal: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Leads', exact: true });
    // "Novo Lead" pode aparecer em várias páginas — pegar o da toolbar (primeiro na área de ação)
    this.newLeadButton = page.getByRole('button', { name: 'Novo Lead' }).first();
    this.searchInput = page.getByPlaceholder('Buscar por nome, telefone ou email...');
    this.modal = page.getByRole('dialog');
    this.saveButton = page.getByRole('button', { name: 'Criar lead' });
  }

  async goto() {
    await this.page.goto('/leads');
    await expect(this.heading).toBeVisible();
  }

  async openNewLeadModal() {
    await this.newLeadButton.click();
    await expect(this.modal).toBeVisible();
  }

  async fillLeadForm(data: { name: string; phone: string; email?: string }) {
    // Labels sem htmlFor — usar placeholder
    await this.page.getByPlaceholder('Nome completo').fill(data.name);
    await this.page.getByPlaceholder('(11) 99999-9999').fill(data.phone);
    if (data.email) {
      await this.page.getByPlaceholder('email@exemplo.com').fill(data.email);
    }
  }

  async submitForm() {
    await this.saveButton.click();
  }

  async search(term: string) {
    await this.searchInput.fill(term);
  }
}
