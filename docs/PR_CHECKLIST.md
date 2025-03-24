# Pull Request Checklist

Use this checklist when creating and reviewing pull requests for the Who What Where portal project.

## Code Quality

- [ ] Code follows the project's style guide
- [ ] Code is properly commented and documented
- [ ] New code includes appropriate tests
- [ ] All existing tests pass
- [ ] Code has been lint-checked with flake8
- [ ] **Type annotations have been added and checked with MyPy**
- [ ] No unnecessary debug statements or commented-out code

## Security

- [ ] Authentication and authorization checks are properly implemented
- [ ] Input validation is comprehensive and appropriate
- [ ] Database queries are parameterized to prevent SQL injection
- [ ] No sensitive data exposure (keys, credentials, etc.)
- [ ] XSS and CSRF protections are maintained
- [ ] **Bandit security scan passes without medium or high severity issues**
- [ ] Common security anti-patterns are avoided (see BANDIT_GUIDE.md)

## Performance

- [ ] Database queries are optimized and avoid N+1 issues
- [ ] API responses are appropriately sized and paginated
- [ ] Frontend components render efficiently
- [ ] Unnecessary network requests are avoided

## Functionality

- [ ] Feature implementation meets requirements
- [ ] Edge cases are handled appropriately
- [ ] Error handling and user feedback are implemented
- [ ] UI/UX is consistent with the rest of the application
- [ ] Changes are backward compatible (or migrations are provided)

## Documentation

- [ ] Code includes docstrings and comments where appropriate
- [ ] API endpoints are documented
- [ ] README or other documentation is updated if needed
- [ ] Change log is updated if applicable

## Type Checking (MyPy)

- [ ] New or modified Python code includes appropriate type annotations
- [ ] MyPy static type checks pass without errors
- [ ] Type annotations follow project conventions (see MYPY_GUIDE.md)
- [ ] Complex types are properly documented
- [ ] Any type: ignore comments are justified and documented

## CI/CD

- [ ] All CI checks pass
- [ ] PR branch is up to date with the target branch
- [ ] No merge conflicts
