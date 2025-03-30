const { Given, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

Given('I run a simple test', function() {
  // Just a simple step that doesn't do anything
  console.log('Running a simple test');
});

Then('it should pass', function() {
  // A simple assertion
  expect(true).toBeTruthy();
});
