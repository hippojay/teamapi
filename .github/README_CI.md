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

### Frontend

Add new test files alongside your React components following the naming pattern `*.test.js` or in the `src/__tests__` directory.

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
