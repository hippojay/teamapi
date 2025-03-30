"""
Logging utilities for common logging patterns in the Who What Where application.

This module provides helper functions for common logging scenarios including:
- Timing database operations
- Tracking API endpoint metrics
- Logging database transactions
- Logging security events
"""

import time
import functools
import inspect
import traceback
from typing import Any, Callable, Dict, Optional, TypeVar, cast, List, Union
from fastapi import Request, Response
from logger import get_logger, log_and_handle_exception

# Get module logger
logger = get_logger('logging_utilities')

# Type variable for function return type
F = TypeVar('F', bound=Callable[..., Any])

def log_execution_time(operation_name: str = None):
    """
    Decorator to log the execution time of a function.
    
    Args:
        operation_name: Name of the operation (defaults to function name)
        
    Usage:
        @log_execution_time("database query")
        def my_database_function():
            ...
    """
    def decorator(func: F) -> F:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            func_name = operation_name or func.__name__
            module_name = func.__module__
            
            # Create module-specific logger if needed
            func_logger = get_logger(module_name)
            
            # Log start of operation
            func_logger.debug(f"Starting operation: {func_name}")
            
            # Measure execution time
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                
                # Calculate execution time
                execution_time = time.time() - start_time
                
                # Log completion
                func_logger.info(f"Completed {func_name} in {execution_time:.4f} seconds")
                
                # Also log as a metric for tracking performance over time
                func_logger.metric(
                    "execution_time",
                    execution_time,
                    operation=func_name,
                    module=module_name
                )
                
                return result
            except Exception as e:
                # Log execution failure
                execution_time = time.time() - start_time
                log_and_handle_exception(
                    func_logger,
                    f"Error in {func_name}",
                    e,
                    reraise=True,
                    execution_time=execution_time,
                    operation=func_name,
                    module=module_name
                )
        
        return cast(F, wrapper)
    return decorator

def log_api_call(include_request_body: bool = False, sensitive_params: List[str] = None):
    """
    Decorator to log API endpoint calls.
    
    Args:
        include_request_body: Whether to include request body in logs
        sensitive_params: List of parameter names to mask in logs
        
    Usage:
        @app.post("/users/")
        @log_api_call(sensitive_params=["password"])
        def create_user(user: schemas.UserCreate):
            ...
    """
    if sensitive_params is None:
        sensitive_params = ["password", "token", "secret", "key", "auth"]
    
    def decorator(func: F) -> F:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Find the request object in the args or kwargs
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            
            if request is None:
                request = kwargs.get("request")
            
            # Create logger for the module
            module_name = func.__module__
            endpoint_logger = get_logger(module_name)
            
            # Extract request information
            client_ip = request.client.host if request and hasattr(request, "client") else "unknown"
            method = request.method if request else "unknown"
            path = request.url.path if request else "unknown"
            
            # Log request start
            endpoint_logger.info(f"API {method} request to {path} from {client_ip}")
            
            # Log request body if enabled
            if include_request_body and request:
                try:
                    # Clone the request body
                    body = await request.json()
                    
                    # Mask sensitive data
                    masked_body = body.copy() if isinstance(body, dict) else body
                    if isinstance(masked_body, dict):
                        for param in sensitive_params:
                            if param in masked_body:
                                masked_body[param] = "********"
                    
                    endpoint_logger.debug(f"Request body: {masked_body}")
                except Exception as e:
                    endpoint_logger.warning(f"Could not parse request body: {str(e)}")
            
            # Measure execution time
            start_time = time.time()
            
            try:
                # Execute the endpoint function
                response = await func(*args, **kwargs) if inspect.iscoroutinefunction(func) else func(*args, **kwargs)
                
                # Calculate and log execution time
                execution_time = time.time() - start_time
                status_code = response.status_code if hasattr(response, "status_code") else "unknown"
                
                endpoint_logger.info(f"API response {status_code} in {execution_time:.4f}s - {method} {path}")
                
                # Log as metric
                endpoint_logger.metric(
                    "api_response_time",
                    execution_time,
                    endpoint=path,
                    method=method,
                    status_code=status_code
                )
                
                return response
            except Exception as e:
                # Log execution failure
                execution_time = time.time() - start_time
                log_and_handle_exception(
                    endpoint_logger,
                    f"Error in API endpoint {method} {path}",
                    e,
                    reraise=True,
                    execution_time=execution_time,
                    client_ip=client_ip
                )
        
        return cast(F, wrapper)
    return decorator

def log_db_transaction():
    """
    Decorator to log database transactions.
    
    Usage:
        @log_db_transaction()
        def update_user_data(db, user_id, data):
            ...
    """
    def decorator(func: F) -> F:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Find the database session in the args or kwargs
            db_session = None
            db_arg_name = None
            
            # Check args
            for i, arg in enumerate(args):
                if str(type(arg)).find("Session") != -1:
                    db_session = arg
                    param_names = inspect.signature(func).parameters
                    db_arg_name = list(param_names.keys())[i]
                    break
            
            # Check kwargs if not found in args
            if db_session is None:
                for name, arg in kwargs.items():
                    if str(type(arg)).find("Session") != -1:
                        db_session = arg
                        db_arg_name = name
                        break
            
            # Create logger for the module
            module_name = func.__module__
            func_name = func.__name__
            db_logger = get_logger(module_name)
            
            # Log transaction start
            db_logger.debug(f"Starting DB transaction for {func_name}")
            
            # Get current frame info for context
            caller_frame = inspect.currentframe().f_back
            caller_info = ""
            if caller_frame:
                caller_info = f"{caller_frame.f_code.co_filename}:{caller_frame.f_lineno}"
            
            # Measure execution time
            start_time = time.time()
            try:
                # Execute function
                result = func(*args, **kwargs)
                
                # Calculate and log execution time
                execution_time = time.time() - start_time
                db_logger.info(f"DB transaction completed in {execution_time:.4f}s - {func_name}")
                
                # Log as metric
                db_logger.metric(
                    "db_transaction_time",
                    execution_time,
                    operation=func_name,
                    caller=caller_info
                )
                
                return result
            except Exception as e:
                # Log execution failure and rollback if possible
                if db_session and hasattr(db_session, 'rollback'):
                    try:
                        db_session.rollback()
                        db_logger.warning(f"Rolled back transaction for {func_name} due to error")
                    except Exception as rollback_error:
                        db_logger.error(f"Failed to rollback transaction: {str(rollback_error)}")
                
                # Log the original error
                execution_time = time.time() - start_time
                log_and_handle_exception(
                    db_logger,
                    f"Error in DB transaction {func_name}",
                    e,
                    reraise=True,
                    execution_time=execution_time,
                    operation=func_name,
                    caller=caller_info
                )
        
        return cast(F, wrapper)
    return decorator

def log_security_event(event_type: str, user_id: Optional[int] = None, **details):
    """
    Log a security-related event for auditing.
    
    Args:
        event_type: Type of security event (login, logout, access_denied, etc.)
        user_id: User ID associated with the event
        **details: Additional context details for the event
        
    Example:
        log_security_event(
            "login_failed", 
            username="user@example.com", 
            ip_address="192.168.1.1",
            reason="incorrect_password"
        )
    """
    security_logger = get_logger("security")
    
    # Get caller information for traceability
    caller_frame = inspect.currentframe().f_back
    caller_info = {}
    if caller_frame:
        caller_info = {
            'file': caller_frame.f_code.co_filename,
            'line': caller_frame.f_lineno,
            'function': caller_frame.f_code.co_name
        }
    
    # Add timestamp
    event_timestamp = time.time()
    timestamp_iso = datetime.datetime.fromtimestamp(event_timestamp).isoformat()
    
    # Combine all details into one structured log
    event_details = {
        "event_type": event_type,
        "timestamp": timestamp_iso,
        "user_id": user_id,
        **caller_info,
        **details
    }
    
    # Log the security event with appropriate level based on event type
    if event_type.startswith(("login_failed", "access_denied", "permission_denied")):
        security_logger.warning(f"Security event: {event_type}", **event_details)
    elif event_type.startswith(("account_locked", "suspicious")):
        security_logger.error(f"Security event: {event_type}", **event_details)
    else:
        security_logger.info(f"Security event: {event_type}", **event_details)
    
    # Also log to the structured metrics for analysis
    security_logger.metric("security_event", 1, event_type=event_type, **details)

def contextualize_exception(e: Exception, **context) -> Exception:
    """
    Add context to an exception for better error reporting.
    
    Args:
        e: The exception to contextualize
        **context: Additional context key-value pairs
        
    Returns:
        The modified exception with context
    """
    # Store context in the exception object
    if not hasattr(e, "__context_data__"):
        setattr(e, "__context_data__", {})
    
    # Add new context
    e.__context_data__.update(context)
    
    return e

def get_exception_context(e: Exception) -> Dict[str, Any]:
    """
    Get context information from an exception.
    
    Args:
        e: The exception to get context from
        
    Returns:
        Dictionary with context data
    """
    if hasattr(e, "__context_data__"):
        return e.__context_data__
    return {}
