#!/bin/bash

# Run UI tests with the latest Cucumber in debug mode
echo "Running UI tests with Cucumber 11.2.0 in debug mode..."

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Print versions
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install --no-fund --no-audit
fi

# Set environment variables for debugging
export HEADLESS=false
export SLOW_MO=50

# Run Cucumber with Playwright debugging
echo "Starting Cucumber tests in debug mode..."
PWDEBUG=1 npx cucumber-js

# Exit with Cucumber's status
exit $?
