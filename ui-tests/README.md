# Who What Where UI Tests

This directory contains UI tests for the Who What Where application using Cucumber and Playwright.

## Prerequisites

- Node.js (v14+)
- NPM (v6+)
- The Who What Where application running on http://localhost:3000

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure the test environment:
   Edit the `.env` file to set your preferences:
   ```
   APP_URL=http://localhost:3000  # URL of the application
   HEADLESS=false                 # Set to true for headless browser testing
   SLOW_MO=0                      # Slow down test execution for debugging (in ms)
   WSL=true                       # Set to true if running in WSL environment
   ```

## Running the Tests

Run all tests:
```bash
npm test
```

Run tests with report generation:
```bash
npm run test:report
```

Run specific feature:
```bash
npx cucumber-js features/basic_navigation.feature
```

Run in debug mode:
```bash
npm run test:debug
```

## Test Reports

Test reports are generated in the `reports` directory:

- HTML Report: `reports/cucumber-report.html`
- JSON Report: `reports/cucumber-report.json`

To open the HTML report:
```bash
open reports/cucumber-report.html  # On macOS
xdg-open reports/cucumber-report.html  # On Linux
```

## Test Structure

- `features/`: Cucumber feature files
- `features/step_definitions/`: Step definition files
- `world.js`: Cucumber world configuration and Playwright setup
- `cucumber.js`: Cucumber configuration
- `reports/`: Generated test reports

## Troubleshooting

1. If tests fail with timeout errors, try:
   - Increase the default timeout in `world.js`
   - Check if the application is running at the specified URL
   - Use `HEADLESS=false` to see what's happening in the browser

2. If selectors aren't matching elements:
   - Review the actual HTML structure in the application
   - Try more flexible selectors that can handle layout changes
   - Add explicit waits before checking for elements

3. For WSL-specific issues:
   - Ensure the browser can access localhost through WSL
   - Try using IP address instead of localhost
   - Add appropriate launch arguments in `world.js`
