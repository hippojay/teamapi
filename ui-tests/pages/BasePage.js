class BasePage {
  constructor(page) {
    this.page = page;
  }

  async navigate(path = '') {
    await this.page.goto(`${process.env.BASE_URL || 'http://localhost:3000'}${path}`);
  }

  async waitForPageLoad() {
    // Wait for the main content to be visible
    await this.page.waitForSelector('#root', { state: 'visible' });
  }

  async getErrorMessages() {
    // Look for common error message patterns
    const errorElements = await this.page.$$('[class*="error"], [class*="Error"], .alert-danger, .text-danger');
    const errorMessages = [];
    
    for (const element of errorElements) {
      const text = await element.textContent();
      if (text && text.trim()) {
        errorMessages.push(text.trim());
      }
    }
    
    return errorMessages;
  }

  async hasErrorMessages() {
    const errors = await this.getErrorMessages();
    return errors.length > 0;
  }

  async getSidebarMenu() {
    return this.page.locator('.sidebar, .side-nav, nav[aria-label="Sidebar"]');
  }

  async getHeaderMenu() {
    return this.page.locator('header, .header, [role="banner"]');
  }

  async getSummaryBoxes() {
    return this.page.locator('.summary-box, .card, .dashboard-card, [class*="summary"]');
  }

  async clickSidebarMenuItem(menuText) {
    // Try several common selectors for sidebar menu items
    const menuItem = this.page.locator('.sidebar a, .side-nav a, nav[aria-label="Sidebar"] a, .sidebar button, .side-nav button', {
      hasText: menuText
    });
    
    await menuItem.click();
    await this.waitForPageLoad();
  }
}

module.exports = BasePage;
