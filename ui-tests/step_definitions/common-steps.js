const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const HomePage = require('../pages/HomePage');
const SectionPage = require('../pages/SectionPage');

// Global state for test steps
let homePage;
let currentPage;

Given('I am a normal user accessing the application', async function() {
  homePage = new HomePage(this.page);
  currentPage = homePage;
});

Given('I am on the home page', async function() {
  homePage = new HomePage(this.page);
  await homePage.navigate();
  currentPage = homePage;
});

When('I navigate to the home page', async function() {
  await homePage.navigate();
  currentPage = homePage;
});

When('I click on a menu item in the sidebar', async function() {
  // Click on the first available menu item in the sidebar
  const sidebar = await homePage.getSidebarMenu();
  const menuItems = await sidebar.locator('a, button').all();
  expect(menuItems.length).toBeGreaterThan(0);
  
  await menuItems[0].click();
  await homePage.waitForPageLoad();
});

When('I click on {string} in the sidebar menu', async function(sectionName) {
  await homePage.clickSidebarMenuItem(sectionName);
  currentPage = new SectionPage(this.page, sectionName);
});

Then('I should see the sidebar menu', async function() {
  const hasSidebar = await homePage.hasSidebarMenu();
  expect(hasSidebar).toBeTruthy();
});

Then('I should see the header menu', async function() {
  const hasHeader = await homePage.hasHeaderMenu();
  expect(hasHeader).toBeTruthy();
});

Then('I should see summary boxes', async function() {
  const hasSummary = await homePage.hasSummaryBoxes();
  expect(hasSummary).toBeTruthy();
});

Then('I should not see any error messages', async function() {
  const hasErrors = await currentPage.hasErrorMessages();
  expect(hasErrors).toBeFalsy();
});

Then('I should be navigated to a new page', async function() {
  // Check that URL has changed from home page
  const currentUrl = this.page.url();
  const homeUrl = 'http://localhost:3000/';
  expect(currentUrl).not.toEqual(homeUrl);
});

Then('the new page should be populated with relevant data or a no-data message', async function() {
  const sectionPage = new SectionPage(this.page, '');
  const hasDataOrMessage = await sectionPage.hasDataOrNoDataMessage();
  expect(hasDataOrMessage).toBeTruthy();
});

Then('I should see a list of all {word}', async function(itemType) {
  const sectionPage = new SectionPage(this.page, itemType);
  const hasItems = await sectionPage.hasListItems();
  const hasNoData = await sectionPage.hasNoDataMessage();
  
  // Either we have items or a no-data message
  expect(hasItems || hasNoData).toBeTruthy();
});

Then('I should see a summary of all {word}', async function(itemType) {
  const sectionPage = new SectionPage(this.page, itemType);
  const hasItems = await sectionPage.hasListItems();
  const hasNoData = await sectionPage.hasNoDataMessage();
  
  // Either we have items or a no-data message
  expect(hasItems || hasNoData).toBeTruthy();
});

Then('I should see a summary of all areas in the explorer view', async function() {
  const sectionPage = new SectionPage(this.page, 'Organizational Explorer');
  const hasItems = await sectionPage.hasListItems();
  const hasNoData = await sectionPage.hasNoDataMessage();
  
  // Either we have items or a no-data message
  expect(hasItems || hasNoData).toBeTruthy();
});
