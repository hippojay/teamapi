import os
import logging
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
from pathlib import Path
import datetime

# Constants
LOG_LEVELS = {
    'DEBUG': logging.DEBUG,
    'INFO': logging.INFO,
    'WARNING': logging.WARNING,
    'ERROR': logging.ERROR,
    'CRITICAL': logging.CRITICAL
}

# Determine the project root directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent
LOG_DIR = PROJECT_ROOT / "logs"

# Ensure log directory exists
if not LOG_DIR.exists():
    LOG_DIR.mkdir(parents=True, exist_ok=True)

class Logger:
    """
    Logger class to provide standardized logging functionality across the application.
    
    This implements different log levels (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    and ensures logs are written to appropriately named files with timestamps.
    """
    
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
        
        # Create formatter with timestamp and module information
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
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
        
        file_handler.setFormatter(formatter)
        self.logger.addHandler(file_handler)
        
        # Add console handler if requested
        if log_to_console:
            console_handler = logging.StreamHandler()
            console_handler.setFormatter(formatter)
            self.logger.addHandler(console_handler)
    
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
        
        # Add context information if provided
        if kwargs:
            context_str = " | ".join(f"{k}={v}" for k, v in kwargs.items())
            full_message = f"{message} | {context_str}"
        else:
            full_message = message
        
        self.logger.log(log_level, full_message)

# Function to get a configured logger instance
def get_logger(module_name, log_level='INFO', log_to_console=True):
    """
    Get a logger configured for the specified module.
    
    Args:
        module_name (str): Name of the module (e.g., 'load_data', 'database')
        log_level (str): Minimum log level to record (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_to_console (bool): Whether to also log to console
        
    Returns:
        Logger: Configured logger instance
    """
    # Get log level from environment variable if set, otherwise use provided value
    env_log_level = os.environ.get('LOG_LEVEL', log_level)
    
    return Logger(module_name, env_log_level, log_to_console)
