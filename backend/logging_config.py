"""
Centralized logging configuration for the Who What Where application.

This module defines default logging levels, formats, and other configuration
that can be applied consistently across the application.
"""

import os
from pathlib import Path

# Default log level - can be overridden with environment variable
DEFAULT_LOG_LEVEL = "INFO"

# Log directory - relative to project root
LOG_DIR = Path(__file__).resolve().parent.parent / "logs"

# Ensure log directory exists
if not LOG_DIR.exists():
    LOG_DIR.mkdir(parents=True, exist_ok=True)

# Main application log file path
MAIN_LOG_FILE = LOG_DIR / "application.log"

# Default number of backup log files to keep
DEFAULT_BACKUP_COUNT = 5

# Default maximum log file size before rotation (in MB)
DEFAULT_MAX_LOG_SIZE_MB = 10

# Log format templates
SIMPLE_LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
DETAILED_LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(threadName)s - %(message)s'

# Email configuration for critical error alerts (if needed)
ERROR_EMAIL_ENABLED = False
ERROR_EMAIL_FROM = "app@example.com"
ERROR_EMAIL_TO = ["admin@example.com"]
ERROR_EMAIL_SUBJECT = "WHO WHAT WHERE - CRITICAL ERROR ALERT"

# Log sensitive actions to a separate security log
SECURITY_LOG_ENABLED = True
SECURITY_LOG_FILE = LOG_DIR / "security.log"

# Define which modules should use which log level by default
MODULE_LOG_LEVELS = {
    "main": "INFO",
    "database": "INFO",
    "user_auth": "INFO",
    "crud": "INFO",
    "load_prod_data": "INFO",
    "db_initializer": "INFO",
    # Add other modules as needed
}

# Get log level from environment variable if set
def get_log_level_for_module(module_name):
    """Get the appropriate log level for a module, checking environment variables first"""
    # Check for module-specific environment variable
    env_var_name = f"LOG_LEVEL_{module_name.upper()}"
    module_level = os.environ.get(env_var_name)

    if module_level:
        return module_level

    # Check for global log level environment variable
    global_level = os.environ.get("LOG_LEVEL")
    if global_level:
        return global_level

    # Fall back to module-specific default
    if module_name in MODULE_LOG_LEVELS:
        return MODULE_LOG_LEVELS[module_name]

    # Last resort: general default
    return DEFAULT_LOG_LEVEL
