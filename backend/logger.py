import os
import logging
import sys
import traceback
import json
import time
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
import datetime
import socket
import platform
import inspect

# Import centralized logging configuration
from logging_config import (
    LOG_DIR, MAIN_LOG_FILE, get_log_level_for_module
)

# Constants
LOG_LEVELS = {
    'DEBUG': logging.DEBUG,
    'INFO': logging.INFO,
    'WARNING': logging.WARNING,
    'ERROR': logging.ERROR,
    'CRITICAL': logging.CRITICAL
}

# Ensure log directory exists
if not LOG_DIR.exists():
    LOG_DIR.mkdir(parents=True, exist_ok=True)

# Global dictionary to store metrics and counters
_metrics = {}

# Custom formatter for microseconds
class MicrosecondFormatter(logging.Formatter):
    """Custom formatter that correctly handles microsecond formatting."""
    def formatTime(self, record, datefmt=None):
        ct = self.converter(record.created)
        if datefmt:
            s = time.strftime(datefmt, ct)
            # Add microseconds manually - multiply msecs by 1000 to get microseconds
            if '%f' in s:
                s = s.replace('%f', '{0:06d}'.format(int(record.msecs * 1000)))
            return s
        else:
            return time.strftime(self.default_time_format, ct)

class Logger:
    """
    Logger class to provide standardized logging functionality across the application.

    This implements different log levels (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    and ensures logs are written to appropriately named files with timestamps.
    """

    class LevelFilter(logging.Filter):
        """
        Filter that applies different formatters based on log level.
        """
        def __init__(self, handler, standard_formatter, error_formatter):
            super().__init__()
            self.handler = handler
            self.standard_formatter = standard_formatter
            self.error_formatter = error_formatter

        def filter(self, record):
            # No filtering, just formatter switching
            if record.levelno >= logging.WARNING:
                self.handler.setFormatter(self.error_formatter)
            else:
                self.handler.setFormatter(self.standard_formatter)
            return True

    def __init__(self, module_name, log_level='INFO', log_to_console=True,
                 rotating_logs=True, max_size_mb=10, backup_count=5):
        """
        Initialize a logger for a specific module.

        Args:
            module_name (str): Name of the module using the logger (e.g., 'load_data', 'database')
            log_level (str): Minimum log level to record (DEBUG, INFO, WARNING, ERROR, CRITICAL)
            log_to_console (bool): Whether to also log to console
            rotating_logs (bool): Whether to use rotating file handler (True) or daily rotating handler (False)
            max_size_mb (int): Maximum size in MB for log files before rotation (when rotating_logs=True)
            backup_count (int): Number of backup files to keep
        """
        self.module_name = module_name
        self.log_level = LOG_LEVELS.get(log_level.upper(), logging.INFO)

        # Create logger
        self.logger = logging.getLogger(f'who_what_where.{module_name}')
        self.logger.setLevel(self.log_level)

        # Clear existing handlers to avoid duplicate logs
        if self.logger.hasHandlers():
            self.logger.handlers.clear()

        # Create enhanced formatter with timestamp, level, module, but without filename or line number
        formatter = MicrosecondFormatter(
            '%(asctime)s - %(levelname)s - %(name)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S.%f'
        )

        # Create a special formatter for warnings and errors that includes thread name but not filename/line
        error_formatter = MicrosecondFormatter(
            '%(asctime)s - %(levelname)s - %(name)s - %(threadName)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S.%f'
        )

        # Add file handler
        log_file = LOG_DIR / f"{module_name}.log"

        if rotating_logs:
            # Size-based rotation (e.g., 10MB per file)
            file_handler = RotatingFileHandler(
                log_file,
                maxBytes=max_size_mb * 1024 * 1024,  # Convert MB to bytes
                backupCount=backup_count
            )
        else:
            # Time-based rotation (daily)
            file_handler = TimedRotatingFileHandler(
                log_file,
                when='midnight',
                interval=1,
                backupCount=backup_count
            )

        # Add file_handler to logger with level filter
        file_handler.setFormatter(formatter)  # Default formatter
        self.logger.addHandler(file_handler)
        file_filter = self.LevelFilter(file_handler, formatter, error_formatter)
        file_handler.addFilter(file_filter)

        # Add console handler if requested
        if log_to_console:
            console_handler = logging.StreamHandler()
            console_handler.setFormatter(formatter)  # Default formatter
            self.logger.addHandler(console_handler)
            console_filter = self.LevelFilter(console_handler, formatter, error_formatter)
            console_handler.addFilter(console_filter)

    def debug(self, message):
        """Log debug message."""
        self.logger.debug(message)

    def info(self, message):
        """Log info message."""
        self.logger.info(message)

    def warning(self, message):
        """Log warning message."""
        self.logger.warning(message)

    def error(self, message):
        """Log error message."""
        self.logger.error(message)

    def critical(self, message):
        """Log critical message."""
        self.logger.critical(message)

    def structured(self, level, message, **kwargs):
        """
        Advanced structured logging with context data.

        Args:
            level (str): Log level ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL')
            message (str): Main log message
            **kwargs: Additional context data to include in the log
        """
        log_level = LOG_LEVELS.get(level.upper(), logging.INFO)

        # Add call stack information for warnings and above
        if log_level >= logging.WARNING:
            # Get the caller's frame information
            caller_frame = inspect.currentframe().f_back
            filename = caller_frame.f_code.co_filename
            line_number = caller_frame.f_lineno
            function_name = caller_frame.f_code.co_name

            # Include source location in the message for warnings and errors
            source_location = f"{os.path.basename(filename)}:{line_number}"
            message = f"[{source_location}] {message}"

            kwargs.update({
                'file': os.path.basename(filename),
                'line': line_number,
                'function': function_name
            })

        # Add context information as a structured JSON string
        if kwargs:
            try:
                context_json = json.dumps(kwargs)
                full_message = f"{message} | {context_json}"
            except (TypeError, ValueError):
                # Fall back to string format if JSON conversion fails
                context_str = " | ".join(f"{k}={v}" for k, v in kwargs.items())
                full_message = f"{message} | {context_str}"
        else:
            full_message = message

        self.logger.log(log_level, full_message)

        # All errors and criticals are also sent to the main log file
        if log_level >= logging.ERROR:
            with open(MAIN_LOG_FILE, 'a') as f:
                dt = datetime.datetime.now()
                timestamp = dt.strftime('%Y-%m-%d %H:%M:%S.%f')
                f.write(f"{timestamp} - {logging.getLevelName(log_level)} - {self.module_name} - {full_message}\n")

    def exception(self, message, exc_info=True, **kwargs):
        """
        Log an exception with stack trace.

        Args:
            message (str): Error message
            exc_info (bool/Exception): True to use current exception, or pass an exception
            **kwargs: Additional context data to include in the log
        """
        # Capture the current exception info if not provided
        if exc_info is True:
            exc_type, exc_value, exc_traceback = sys.exc_info()
        elif isinstance(exc_info, BaseException):
            exc_type = type(exc_info)
            exc_value = exc_info
            exc_traceback = exc_info.__traceback__
        else:
            exc_type, exc_value, exc_traceback = None, None, None

        # Format the exception into a structured message
        if exc_type and exc_value:
            # Get exception details
            exception_name = exc_type.__name__
            exception_msg = str(exc_value)

            # Format traceback if available
            if exc_traceback:
                tb_lines = traceback.format_tb(exc_traceback)
                tb_text = '\n'.join(tb_lines)
            else:
                tb_text = "No traceback available"

            # Add exception details to kwargs
            kwargs.update({
                'exception_type': exception_name,
                'exception_message': exception_msg,
                'traceback': tb_text
            })

            # Ensure the exception name is part of the message for better filtering
            message = f"{message} - {exception_name}: {exception_msg}"

        # Log the exception with the enhanced context
        self.structured('ERROR', message, **kwargs)

    def metric(self, name, value=1, **kwargs):
        """
        Log a metric or counter that can be used for monitoring or statistics.

        Args:
            name (str): Name of the metric
            value (int/float): Value to record
            **kwargs: Additional dimensions/tags for the metric
        """
        if name not in _metrics:
            _metrics[name] = {'count': 0, 'sum': 0, 'values': []}

        _metrics[name]['count'] += 1
        _metrics[name]['sum'] += value
        _metrics[name]['values'].append(value)

        # Log the metric
        self.structured('INFO', f"METRIC: {name}", value=value, metric=True, **kwargs)

# Function to get a configured logger instance
def get_logger(module_name, log_level=None, log_to_console=True):
    """
    Get a logger configured for the specified module.

    Args:
        module_name (str): Name of the module (e.g., 'load_data', 'database')
        log_level (str): Override the log level if provided
        log_to_console (bool): Whether to also log to console

    Returns:
        Logger: Configured logger instance
    """
    # Get appropriate log level from configuration or environment, or use provided value
    if log_level is None:
        env_log_level = get_log_level_for_module(module_name)
    else:
        env_log_level = os.environ.get('LOG_LEVEL', log_level)

    logger_instance = Logger(module_name, env_log_level, log_to_console)

    # Add a handler for the main application log file as well (for capturing all modules in one place)
    # Configure a handler for the main log file
    # Use a static reference to avoid creating multiple handlers
    main_handler = getattr(get_logger, '_main_handler', None)

    if main_handler is None:
        # Create a formatter for the main log with new format (level before module, no filename)
        main_formatter = MicrosecondFormatter(
            '%(asctime)s - %(levelname)s - %(name)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S.%f'
        )

        # Use rotating file handler for the main log file
        main_handler = RotatingFileHandler(
            MAIN_LOG_FILE,
            maxBytes=10 * 1024 * 1024,  # 10 MB
            backupCount=5
        )
        main_handler.setFormatter(main_formatter)
        main_handler.setLevel(logging.INFO)  # Only INFO and above for the main log

        # Store the handler for reuse
        setattr(get_logger, '_main_handler', main_handler)

    # Add the main handler if it's not already present
    if main_handler not in logger_instance.logger.handlers:
        logger_instance.logger.addHandler(main_handler)

    return logger_instance

# Error handling utility function
def log_and_handle_exception(logger, message, exception=None, reraise=True, **kwargs):
    """
    Utility function to log an exception with full context and optionally re-raise it.

    Args:
        logger: Logger instance
        message (str): Error message to log
        exception: Exception to log (defaults to current exception)
        reraise (bool): Whether to re-raise the exception after logging
        **kwargs: Additional context to include in the log
    """
    try:
        if exception is None:
            # Log current exception
            logger.exception(message, **kwargs)
        else:
            # Log provided exception
            logger.exception(message, exc_info=exception, **kwargs)
    except Exception as e:
        # Fallback to ensure we at least get some record of the error
        print(f"ERROR: Failed to log exception: {e}. Original error: {message}")

    # Re-raise if requested
    if reraise and exception is not None:
        raise exception
    elif reraise:
        # Just re-raise current exception
        raise

# System information for logging context
def get_system_info():
    """
    Get basic system information for log context.

    Returns:
        dict: System information including hostname, python version, etc.
    """
    return {
        'hostname': socket.gethostname(),
        'python_version': platform.python_version(),
        'platform': platform.platform(),
        'system': platform.system(),
        'version': platform.version()
    }

# Global logger for system-wide messages
system_logger = get_logger('system', log_level='INFO')
system_logger.structured('INFO', "Logging system initialized", **get_system_info())
