# Continuous Integration & Security Workflows

This document outlines the CI/CD workflows configured for the Who What Where Portal application.

## Workflow Overview

The repository uses GitHub Actions to automate testing, code quality checks, and security scanning. The following workflows are available:

### 1. Backend CI (`backend-ci.yml`)

This workflow runs when changes are made to the backend Python code.

Features:
- Python setup with dependencies installation
- Code linting with Flake8
- Unit testing with pytest
- Code coverage reporting

### 2. Frontend CI (`frontend-ci.yml`)

This workflow runs when changes are made to the frontend React code.

Features:
- Node.js setup with npm dependencies installation
- ESLint for code quality
- Running React tests
- Production build verification

### 3. CodeQL Security Analysis (`codeql-analysis.yml`)

This workflow runs security scanning on both Python and JavaScript code.

Features:
- Scheduled weekly runs (Mondays)
- Runs on push to main and pull requests
- Detects security vulnerabilities and coding errors
- Supports Python and JavaScript analysis

### 4. Combined Checks (`combined-checks.yml`)

A comprehensive workflow that runs all of the above checks in a single workflow.

### 5. Dependabot Configuration

Automated dependency updates are configured in `.github/dependabot.yml`:
- Weekly scans for npm (frontend), pip (backend), and GitHub Actions dependencies
- Creates pull requests for outdated or vulnerable dependencies

## Running Tests Locally

### Backend Tests

```bash
cd backend
pip install pytest pytest-cov
pytest --cov=.
```

### Frontend Tests

```bash
cd frontend
npm test
```

## Adding New Tests

### Backend

Add new test files in the `backend/tests` directory following the naming pattern `test_*.py`.

When creating model tests, make sure you include all required fields from the schema. Common issues include:
- Missing required fields (status, timezone, member_count, total_capacity)
- Incorrect field types
- Case-sensitive enum values

### Frontend

Add new test files alongside your React components following the naming pattern `*.test.js` or in the `src/__tests__` directory.

## Schema Testing Guidelines

1. Always check the schema definition before writing tests
2. Include all required fields
3. Test validation rules
4. For enums, ensure correct case sensitivity
5. Test with both valid and invalid data

## Security Best Practices

1. Never ignore security warnings from Dependabot
2. Review CodeQL alerts regularly
3. Keep dependencies up to date
4. Include tests for security-critical features
5. Use automated scanning for secrets with gitleaks

## CI/CD Pipeline Expansion

Future enhancements planned for the CI/CD pipeline:
- Deployment workflows for staging and production
- Performance testing
- End-to-end testing
- Docker container scanning
- Infrastructure-as-code validation

## Troubleshooting Common CI Issues

### Test Failures

- Check that your schema tests include all required fields
- Verify enum values match exactly (including case)
- Ensure database migrations are properly tested

### Build Failures

- Look for dependency issues in package.json or requirements.txt
- Check for syntax errors in code
- Verify that all required environment variables are set

### npm Cache and package-lock.json

- We now track package-lock.json in git for better CI performance (removed from .gitignore)
- This enables GitHub Actions to properly cache npm dependencies between workflow runs
- If you encounter the error "Some specified paths were not resolved, unable to cache dependencies", it's likely because package-lock.json isn't committed
- Generate package-lock.json with `npm install` in the frontend directory
- Always commit package-lock.json when making changes to package.json
- Our workflows include a fallback (`npm install`) if `npm ci` fails
