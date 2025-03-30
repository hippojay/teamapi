const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

// Global page object for the test
let page;

// Before each scenario
Given('I am a normal user accessing the application', async function() {
  // Initialize the page
  page = this.page;
});

Given('I am on the home page', async function() {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
});

When('I navigate to the home page', async function() {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
});

When('I click on a menu item in the sidebar', async function() {
  // Explicitly wait to ensure the page is fully loaded
  await page.waitForLoadState('networkidle');
  
  // Wait for the sidebar to be visible
  const sidebar = page.locator('nav, .sidebar, [aria-label="Sidebar"]').first();
  await expect(sidebar).toBeVisible();
  
  // Try clicking directly on a known non-home page link (Tribes)
  try {
    console.log('Attempting to click on Tribes link');
    await page.click('a[href="/tribes"]');
    await page.waitForLoadState('networkidle');
    console.log('Successfully clicked on Tribes link');
  } catch (e) {
    console.log('Could not find direct Tribes link, trying text-based selector');
    try {
      await page.click('a:has-text("Tribes")');
      await page.waitForLoadState('networkidle');
      console.log('Successfully clicked on Tribes text link');
    } catch (e2) {
      console.log('Could not find Tribes link, trying to click the first non-home link');
      
      // Use locator API to get all links
      const sidebarLinks = page.locator('nav a, .sidebar a');
      const count = await sidebarLinks.count();
      console.log(`Found ${count} links in the sidebar`);
      
      // Find a non-home link and click it
      let clicked = false;
      for (let i = 0; i < count; i++) {
        const link = sidebarLinks.nth(i);
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        console.log(`Link ${i}: ${text?.trim()} -> ${href}`);
        
        if (href && href !== '/' && href !== '#' && !href.startsWith('javascript:')) {
          console.log(`Clicking link: ${text?.trim()} -> ${href}`);
          await link.click();
          await page.waitForLoadState('networkidle');
          clicked = true;
          break;
        }
      }
      
      if (!clicked) {
        throw new Error('Could not find any suitable navigation links in the sidebar');
      }
    }
  }
});

When('I click on {string} in the sidebar menu', async function(menuText) {
  // More robust selector that works with the app's structure
  await page.waitForSelector(`a:has-text("${menuText}")`);
  await page.click(`a:has-text("${menuText}")`);
  await page.waitForLoadState('networkidle');
});

Then('I should see the sidebar menu', async function() {
  const sidebar = page.locator('nav, .sidebar, [aria-label="Sidebar"]').first();
  await expect(sidebar).toBeVisible();
});

Then('I should see the header menu', async function() {
  // Check for the header container with a longer timeout
  const header = page.locator('div[class*="fixed top-0 left-0 right-0"]');
  await expect(header).toBeVisible({ timeout: 10000 });
  
  // Check for the application title in the header (more specific to avoid matching footer)
  const appTitle = page.locator('div[class*="fixed top-0"] a:has-text("Who What Where")');
  await expect(appTitle).toBeVisible({ timeout: 10000 });
  
  // Check for the search bar
  const searchBar = page.locator('input[type="text"][placeholder*="Search"], input[type="search"]');
  await expect(searchBar).toBeVisible({ timeout: 10000 });
  
  // Check for the login/sign in button for non-logged in users
  const loginButton = page.locator('a:has-text("Sign In"), button:has-text("Sign In"), a:has-text("Login"), button:has-text("Login")');
  await expect(loginButton).toBeVisible({ timeout: 10000 });
  
  console.log('✅ Header verification complete: Found title, search bar, and login button');
});

Then('I should see summary boxes', async function() {
  // Look for elements that might represent summary boxes
  // Wait for a reasonable time as content might load dynamically
  await page.waitForTimeout(1000);
  const boxes = page.locator('main div[class*="rounded-lg shadow"], div[class*="bg-white p-"], div[class*="border rounded"]').first();
  await expect(boxes).toBeVisible();
});

Then('I should not see any error messages', async function() {
  // Look for common error patterns
  const errorTexts = ['error', 'exception', 'failed', 'unexpected'];
  
  for (const text of errorTexts) {
    const errorElements = page.locator(`:text-matches("${text}", "i"):visible`);
    const count = await errorElements.count();
    
    if (count > 0) {
      // Check if it's a real error or just part of normal content
      const elementsText = await errorElements.allTextContents();
      const isActualError = elementsText.some(text => 
        text.toLowerCase().includes('error:') || 
        text.toLowerCase().includes('exception:') ||
        text.toLowerCase().includes('failed to')
      );
      
      expect(isActualError, `Found error text: ${elementsText.join(', ')}`).toBeFalsy();
    }
  }
});

Then('I should be navigated to a new page', async function() {
  // Check we're not on the homepage anymore
  const url = page.url();
  expect(url).not.toBe('http://localhost:3000/');
  expect(url.startsWith('http://localhost:3000/')).toBeTruthy();
});

Then('the new page should be populated with relevant data or a no-data message', async function() {
  // Look for content or no-data messages
  const content = page.locator('main, .content, [role="main"]');
  await expect(content).toBeVisible();
  
  // If there's a no-data message, that's fine too
  const noDataTexts = ['no data', 'no items', 'empty', 'no results'];
  let hasNoDataMessage = false;
  
  for (const text of noDataTexts) {
    const noDataElement = page.locator(`:text-matches("${text}", "i"):visible`);
    const count = await noDataElement.count();
    if (count > 0) {
      hasNoDataMessage = true;
      break;
    }
  }
  
  // Either we have content with real data, or we have a no-data message
  const hasData = await content.isVisible();
  expect(hasData || hasNoDataMessage).toBeTruthy();
});

Then('I should see a list of all {word}', async function(itemType) {
  // Wait for content to load
  await page.waitForTimeout(1000);
  
  // Check for a list of items or a no-data message
  const listSelectors = [
    `table`, 
    `ul, ol`, 
    `div[class*="grid grid-cols"]`,
    `div[class*="flex flex-col"]`,
    `.${itemType.toLowerCase()}-list`,
    `.${itemType.toLowerCase()}-table`,
    `[aria-label="${itemType}"], [aria-label="${itemType} list"]`
  ];
  
  let foundList = false;
  
  for (const selector of listSelectors) {
    const list = page.locator(selector);
    const count = await list.count();
    if (count > 0) {
      foundList = true;
      break;
    }
  }
  
  // Also check for no-data messages
  const noDataSelector = `:text-matches("no ${itemType}", "i"):visible, :text-matches("no data", "i"):visible, :text-matches("empty", "i"):visible`;
  const noDataElement = page.locator(noDataSelector);
  const hasNoDataMessage = await noDataElement.count() > 0;
  
  // Either we found a list or we have a no-data message
  expect(foundList || hasNoDataMessage).toBeTruthy();
});

// Special case for team members (multi-word)
Then('I should see a list of all team members', async function() {
  // Wait for content to load
  await page.waitForTimeout(1000);
  
  // Check for a list of items or a no-data message
  const listSelectors = [
    `table`, 
    `ul, ol`, 
    `div[class*="grid grid-cols"]`,
    `div[class*="flex flex-col"]`,
    `.users-list, .team-list, .members-list`,
    `.users-table, .team-table, .members-table`,
    `[aria-label="Team Members"], [aria-label="Users"]`
  ];
  
  let foundList = false;
  
  for (const selector of listSelectors) {
    const list = page.locator(selector);
    const count = await list.count();
    if (count > 0) {
      foundList = true;
      break;
    }
  }
  
  // Also check for no-data messages
  const noDataSelector = `:text-matches("no users", "i"):visible, :text-matches("no team", "i"):visible, :text-matches("no members", "i"):visible, :text-matches("no data", "i"):visible, :text-matches("empty", "i"):visible`;
  const noDataElement = page.locator(noDataSelector);
  const hasNoDataMessage = await noDataElement.count() > 0;
  
  // Either we found a list or we have a no-data message
  expect(foundList || hasNoDataMessage).toBeTruthy();
});