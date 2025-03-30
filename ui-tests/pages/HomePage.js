const BasePage = require('./BasePage');

class HomePage extends BasePage {
  constructor(page) {
    super(page);
  }

  async navigate() {
    await super.navigate('/');
  }

  async hasSidebarMenu() {
    const sidebar = await this.getSidebarMenu();
    return await sidebar.isVisible();
  }

  async hasHeaderMenu() {
    const header = await this.getHeaderMenu();
    return await header.isVisible();
  }

  async hasSummaryBoxes() {
    const boxes = await this.getSummaryBoxes();
    return await boxes.count() > 0;
  }
}

module.exports = HomePage;
