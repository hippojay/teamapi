const BasePage = require('./BasePage');

class SectionPage extends BasePage {
  constructor(page, section) {
    super(page);
    this.section = section;
  }

  async navigate() {
    const path = this.getSectionPath();
    await super.navigate(path);
  }

  getSectionPath() {
    // Convert section name to URL path
    // This is an assumption - adjust based on your actual URL structure
    const lowerSection = this.section.toLowerCase().replace(/\s+/g, '-');
    return `/${lowerSection}`;
  }

  async hasListItems() {
    // Look for common list item patterns
    // Adjust these selectors based on your actual UI
    const listItems = await this.page.$$('tr, .list-item, .card, [role="listitem"], [class*="item"]');
    return listItems.length > 0;
  }

  async hasNoDataMessage() {
    const noDataMessage = await this.page.locator('text="No data" >> visible=true, text="No items" >> visible=true, text="Empty" >> visible=true, [class*="empty"] >> visible=true, [class*="no-data"] >> visible=true');
    return await noDataMessage.count() > 0;
  }

  async hasDataOrNoDataMessage() {
    const hasItems = await this.hasListItems();
    const hasNoData = await this.hasNoDataMessage();
    return hasItems || hasNoData;
  }
}

module.exports = SectionPage;
