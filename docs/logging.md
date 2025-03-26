# Logging System for Who What Where

This document explains how to use the logging system implemented in the Who What Where application.

## Overview

The application uses a custom logging system built on top of Python's standard `logging` module. The system provides:

- Consistent log formatting across modules
- File-based logging with rotation
- Console output for development environments
- Different log levels (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- Structured logging with contextual information

## Basic Usage

To use the logger in any module, import the `get_logger` function and create a logger with your module name:

```python
from logger import get_logger

# Create a logger for your module
logger = get_logger('module_name')

# Log messages at different levels
logger.debug("This is a debug message")
logger.info("This is an info message")
logger.warning("This is a warning message")
logger.error("This is an error message")
logger.critical("This is a critical error message")
```

## Log Levels

The system supports standard Python log levels:

- **DEBUG**: Detailed information for diagnosing problems
- **INFO**: Confirmation that things are working as expected
- **WARNING**: An indication that something unexpected happened
- **ERROR**: Due to a more serious problem, the application could not perform some function
- **CRITICAL**: A very serious error, indicating that the program may be unable to continue running

## Configuration

You can configure the logger when creating it:

```python
# Create a logger with custom settings
logger = get_logger(
    module_name='my_module',  
    log_level='DEBUG',        # Minimum log level to record
    log_to_console=True       # Whether to also output to console
)
```

You can also set the global log level using an environment variable:

```
LOG_LEVEL=DEBUG python your_script.py
```

## Best Practices

1. **Use one logger per module**: Create a logger at the top of your module with a name matching the module name.

2. **Choose appropriate log levels**: Use DEBUG for development details, INFO for normal operations, WARNING for unexpected but non-critical issues, ERROR for problems that prevent normal operation, and CRITICAL for fatal errors.

3. **Include useful context**: Make sure your log messages contain enough information to understand the context. Include relevant variables and state information.

4. **Log at the right time**: Log before and after important operations to track progress and results.

5. **Be consistent**: Use a consistent style for log messages across the application.

## Log File Location

Log files are stored in the `/logs` directory at the project root. Each module gets its own log file named after the module (e.g., `load_data.log`).

## Log Rotation

Log files are automatically rotated to prevent them from growing too large:

- By default, logs rotate when they reach 10MB
- The system keeps 5 backup files before deleting older logs
- Alternatively, you can configure time-based rotation (daily)

## Examples

```python
# Basic logging
logger.info("Processing started")

# Logging with context in a formatted string
user_id = "12345"
logger.info(f"User logged in: {user_id}")

# Logging errors with exception information
try:
    result = some_function()
except Exception as e:
    logger.error(f"Error in some_function: {str(e)}")

# Logging with timing information
import time
start_time = time.time()
# ... do something ...
duration = time.time() - start_time
logger.info(f"Operation completed in {duration:.2f} seconds")
```
