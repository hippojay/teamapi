# CI Configuration for Backend

This document provides information about the CI configuration for the backend of the Who What Where portal.

## CI Tools

The following tools are used in our CI pipeline:

1. **Flake8**: For linting Python code
2. **MyPy**: For static type checking
3. **Bandit**: For security scanning
4. **Pytest**: For unit testing
5. **CodeQL**: For deeper security analysis (runs in a separate workflow)

## Configuration Files

- `.flake8`: Configuration for Flake8 linting
- `mypy.ini`: Configuration for MyPy type checking
- `.bandit`: Configuration for Bandit security scanning
- `pytest.ini`: Configuration for Pytest

## Example Files

The repo contains some example files that are used for documentation purposes:

- `models_typed_example.py`: An example of how to add type annotations to SQLAlchemy models

These files are excluded from CI checks and not used in production.

## Running Checks Locally

You can run the same checks locally that are run in CI:

```bash
# Lint with flake8
flake8 .

# Type check with MyPy
mypy --config-file mypy.ini models schemas

# Security scan with Bandit
bandit -r . -x ./tests,./venv --severity-level medium

# Run tests
pytest
```

## CI Workflow

Our CI workflow performs the following steps:

1. Checkout the code
2. Set up Python 3.10
3. Install dependencies
4. Lint with flake8
5. Type check with MyPy
6. Security scan with Bandit
7. Run tests with pytest
8. Upload coverage report

The CI workflow runs on every push to main and on pull requests targeting main.
