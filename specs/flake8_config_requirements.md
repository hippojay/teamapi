# Flake8 Configuration Requirements

## User Needs Identified
- Use a centralized configuration file (backend/.flake8) for flake8 to ensure consistent code style enforcement
- Remove hardcoded flake8 parameters from GitHub Actions workflow files
- Configure flake8 to check according to project-specific rules defined in the .flake8 file
- Maintain critical syntax error checking through explicit --select flags for serious errors
- Apply consistent code style enforcement across both local development and CI/CD pipelines

## Implementation Details
- Removed the `--exit-zero --max-complexity=10` parameters from both GitHub Actions workflow files
- Replaced with a direct call to flake8 that uses the backend/.flake8 configuration file
- Retained the critical syntax error check with `--select=E9,F63,F7,F82` to catch syntax errors
- The backend/.flake8 file enforces:
  - max-line-length = 127
  - Ignores specific errors: E402 (module level imports not at top), E302 (expected 2 blank lines), E305 (expected 2 blank lines after class/function definition)
  - Excludes specific files: .git, __pycache__, venv, models_typed_example.py, tests/*
