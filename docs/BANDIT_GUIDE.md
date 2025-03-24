# Bandit Security Scanning Guide for Who What Where

This guide provides instructions for using Bandit for security scanning in the Who What Where portal.

## Introduction

[Bandit](https://bandit.readthedocs.io/) is a tool designed to find common security issues in Python code. It's especially useful for identifying potential vulnerabilities like:

- SQL injection
- Command injection
- Hardcoded credentials
- Unsafe YAML or pickle usage
- Use of insecure functions
- And many more security anti-patterns

## Setup

### Installation

Bandit is included in the project's development dependencies. You can also install it locally:

```bash
pip install bandit
```

### Configuration

A Bandit configuration file is located at `/home/dave/who/backend/.bandit`. This file defines which directories to exclude, which tests to skip, and other behavior options.

## Running Bandit Locally

To run Bandit manually on your codebase:

```bash
# Run on the entire backend directory
cd backend
bandit -r .

# Exclude test files and virtual environments
bandit -r . -x ./tests,./venv

# Output to JSON format
bandit -r . -x ./tests,./venv -f json -o bandit-results.json

# Only show medium and high severity issues
bandit -r . -x ./tests,./venv --severity-level medium
```

## Common Security Issues to Watch For

### 1. SQL Injection

Avoid direct string concatenation with SQL queries:

```python
# BAD
query = "SELECT * FROM users WHERE username = '" + username + "'"

# GOOD
query = "SELECT * FROM users WHERE username = :username"
result = db.execute(query, {"username": username})
```

We use SQLAlchemy, which helps protect against SQL injection by default.

### 2. Command Injection

Be careful with functions that execute shell commands:

```python
# BAD
os.system("rm -rf " + user_input)

# GOOD
subprocess.run(["rm", "-rf", user_input], check=True)
```

### 3. Hardcoded Credentials

Never hardcode passwords, API keys, or other secrets:

```python
# BAD
password = "super_secret_123"

# GOOD
password = os.environ.get("PASSWORD")
```

### 4. Insecure Deserialization

Be careful with pickle, YAML, and other serialization formats:

```python
# BAD
data = pickle.loads(user_input)

# GOOD
try:
    data = json.loads(user_input)
except json.JSONDecodeError:
    # Handle error
```

### 5. Unsafe File Operations

Validate file paths and avoid path traversal:

```python
# BAD
with open(user_input) as f:
    data = f.read()

# GOOD
filepath = os.path.abspath(os.path.join(safe_dir, user_input))
if not filepath.startswith(os.path.abspath(safe_dir)):
    raise ValueError("Invalid file path")
with open(filepath) as f:
    data = f.read()
```

## Understanding Bandit Output

Bandit reports issues by severity (LOW, MEDIUM, HIGH) and confidence (LOW, MEDIUM, HIGH). Focus on addressing issues with:

1. HIGH severity and HIGH confidence first
2. Then HIGH severity, MEDIUM confidence
3. Then MEDIUM severity, HIGH confidence
4. And so on...

Each issue includes:
- Test ID (e.g., B101, B102)
- Test name (e.g., assert_used, exec_used)
- File and line number
- Code snippet
- Issue description

## Bandit in CI/CD Pipeline

Bandit runs automatically as part of our CI/CD pipeline. When it finds issues:

1. The full results are saved as a JSON file
2. Medium and high severity issues are displayed in the CI output
3. However, the build doesn't fail (yet) to allow gradual improvement

## Fixing Common Issues

### B101: Use of assert detected

Assertions are removed when Python is run with optimizations. Use proper error handling instead.

```python
# Instead of
assert user.is_admin, "User is not admin"

# Use
if not user.is_admin:
    raise PermissionError("User is not admin")
```

### B104: Hardcoded bind address

Avoid hardcoded bind addresses like 0.0.0.0 which can expose services externally.

### B105: Hardcoded password string

Replace hardcoded passwords with environment variables or secure configuration.

### B305: Use of insecure cipher modes

Use secure encryption modes (e.g., GCM instead of ECB).

### B324: Use of weak hashing functions

Use secure hash functions (e.g., SHA-256, SHA-3) instead of MD5 or SHA-1.

## References

- [Bandit Documentation](https://bandit.readthedocs.io/)
- [OWASP Python Security Project](https://owasp.org/www-project-python-security/)
- [Python Security Best Practices](https://snyk.io/blog/python-security-best-practices-cheat-sheet/)
