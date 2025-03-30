const { setWorldConstructor, World, Before, After, BeforeAll, AfterAll, setDefaultTimeout } = require('@cucumber/cucumber');
const { chromium } = require('@playwright/test');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Default timeout - set globally now (API changed in Cucumber 11)
setDefaultTimeout(60000);

// Create a custom world class
class CustomWorld extends World {
  constructor(options) {
    super(options);
    this.appUrl = process.env.APP_URL || 'http://localhost:3000';
  }
}

// Set the custom world
setWorldConstructor(CustomWorld);

// Launch browser once for all tests
let browser;
BeforeAll(async function() {
  // Configure browser with WSL-specific settings if needed
  browser = await chromium.launch({
    headless: process.env.HEADLESS !== 'false',
    slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
    // WSL-specific configurations
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });
});

// Close browser after all tests
AfterAll(async function() {
  if (browser) await browser.close();
});

// Create a new browser context and page for each scenario
Before(async function() {
  this.context = await browser.newContext();
  this.page = await this.context.newPage();
});

// Clean up after each scenario
After(async function() {
  if (this.context) await this.context.close();
});
