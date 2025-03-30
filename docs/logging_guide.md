# Logging System Guide

This document provides a guide to using the enhanced logging system in the Who What Where application.

## Overview

The enhanced logging system provides:

1. **Centralized configuration** - All logging settings in one place
2. **Structured logging** - Machine-parseable logs with context
3. **Exception handling** - Detailed error logs with context and stack traces
4. **Performance tracking** - Timing of critical operations
5. **Security event logging** - Dedicated logs for security events
6. **Single application log** - One file for all critical errors across modules
7. **Module-specific logs** - Detailed logs per module for debugging
8. **Log rotation** - To prevent log files from growing too large

## Basic Logging

Every module should create its own logger:

```python
from logger import get_logger

logger = get_logger("module_name")
```

Then use the appropriate log level for each message:

```python
# Standard levels
logger.debug("Detailed information useful for debugging")
logger.info("Normal operation information")
logger.warning("Something unexpected but not critical")
logger.error("An error occurred but operation can continue")
logger.critical("Critical error that prevents proper functioning")

# Enhanced logging
logger.exception("Error with automatic exception details")
logger.structured("INFO", "Message with structured data", key1="value1", key2="value2")
```

## Structured Logging

Use structured logging to include machine-parseable context:

```python
logger.structured(
    "INFO",  # Log level
    "Database query completed", # Main message
    query_time=230,  # Context as key-value pairs
    rows_returned=42,
    cache_hit=False
)
```

This produces logs that are easily parsed and analyzed by tools and AI systems.

## Exception Handling

Use the `log_and_handle_exception` function for comprehensive error handling:

```python
from logger import log_and_handle_exception

try:
    # Code that might raise an exception
    result = complex_operation()
except Exception as e:
    log_and_handle_exception(
        logger,
        "Failed to perform complex operation",
        e,
        reraise=True,  # Whether to re-raise the exception after logging
        operation_id=123,  # Additional context
        user_id=user.id
    )
```

## Logging Utilities

The `logging_utilities.py` module provides several decorators and functions to simplify common logging patterns:

### Timing Database Operations

```python
from logging_utilities import log_execution_time

@log_execution_time("database query")
def get_data_from_database(params):
    # Function code here
    return data
```

### Logging API Calls

```python
from logging_utilities import log_api_call

@app.get("/endpoint")
@log_api_call(include_request_body=True, sensitive_params=["password"])
def api_endpoint(request: Request):
    # Endpoint code here
    return {"result": "success"}
```

### Logging Database Transactions

```python
from logging_utilities import log_db_transaction

@log_db_transaction()
def update_user_data(db: Session, user_id: int, data: dict):
    # Database transaction code here
    return result
```

### Logging Security Events

```python
from logging_utilities import log_security_event

# When a security-relevant event occurs
log_security_event(
    "login_failed",
    user_id=user_id,
    ip_address=request.client.host,
    reason="incorrect_password"
)
```

## Log Levels

Choose the appropriate log level for each message:

1. **DEBUG** - Detailed information for debugging purposes
   - Connection pool details
   - Variable values during processing
   - Cache hit/miss information

2. **INFO** - Normal application events
   - Application startup/shutdown
   - User actions (login, logout)
   - Successful API calls
   - Data processing statistics

3. **WARNING** - Unexpected but non-critical issues
   - Deprecated API usage
   - Approaching resource limits
   - Retrying failed operations
   - Using fallback mechanisms

4. **ERROR** - Operation failures that don't crash the application
   - Failed API calls
   - Database query errors
   - File operation failures
   - Invalid user input

5. **CRITICAL** - Errors that prevent proper functioning
   - Database connection failures
   - Required service unavailable
   - Corrupt configuration
   - Resource exhaustion

## Configuration

Logging settings are centralized in `logging_config.py`:

- Log levels per module
- Log file paths
- Rotation settings
- Formatting templates

Module log levels can be overridden with environment variables:

```
# Override global log level
LOG_LEVEL=DEBUG

# Override module-specific log level
LOG_LEVEL_DATABASE=DEBUG
LOG_LEVEL_USER_AUTH=WARNING
```

## Log Files

The system creates the following log files:

- `logs/application.log` - Main application log with all ERROR and CRITICAL logs
- `logs/{module_name}.log` - Module-specific logs (e.g., database.log, user_auth.log)
- `logs/security.log` - Security-specific events

All log files are automatically rotated when they reach 10MB in size.

## Reviewing Logs

When debugging issues, start with:

1. `application.log` - Check for any ERROR or CRITICAL logs
2. Module-specific logs - For detailed debugging
3. Security logs - For security-related issues

## Best Practices

1. **Be Thorough but Concise**
   - Include context but avoid unnecessary details
   - Log both the "what" and the "why" of significant events

2. **Include Identifiers**
   - User IDs, request IDs, transaction IDs in every log

3. **Structured Context**
   - Use structured logging for complex data
   - Include context as key-value pairs, not string concatenation

4. **Proper Log Levels**
   - DEBUG for details only needed during debugging
   - INFO for normal operation tracking
   - WARNING, ERROR, CRITICAL for actionable issues

5. **Security and Privacy**
   - Never log sensitive data (passwords, tokens)
   - Use masking for partial identifiers when needed

6. **Avoid Large Payloads**
   - Don't log entire objects or large datasets
   - Log sizes, counts, and identifiers instead

7. **Standardize Message Formats**
   - Use consistent patterns for similar events
   - Include timestamps, sources, and event types

## Implementation Examples

See `logging_example.py` for comprehensive examples of:
- Setting up module loggers
- Using structured logging
- Exception handling
- Security event logging
- Performance tracking
- Using logging decorators
