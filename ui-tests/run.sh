#!/bin/bash

# Run UI tests with the latest Cucumber
echo "Running UI tests with Cucumber 11.2.0..."

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

# Run Cucumber
echo "Starting Cucumber tests..."
npx cucumber-js

# Exit with Cucumber's status
exit $?
