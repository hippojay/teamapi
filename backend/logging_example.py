"""
Example implementation showing how to use the enhanced logging system.

This module demonstrates best practices for logging in the application,
including using decorators for common scenarios and structured logging.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional
import time

# Import logging components
from logger import get_logger
from logging_utilities import (
    log_execution_time, 
    log_api_call, 
    log_db_transaction, 
    log_security_event,
    contextualize_exception
)

# Import database components
from database import get_db
import models
import schemas

# Create router for these example endpoints
router = APIRouter(prefix="/examples", tags=["examples"])

# Create module-specific logger
logger = get_logger("example_module")

# Example service function with timing decorator
@log_execution_time("database query operation")
def get_complex_data_from_db(db: Session, filter_param: str):
    """Example of a complex database query with timing decorator"""
    logger.info(f"Executing complex database query with filter: {filter_param}")
    
    # Simulate complex database operation
    time.sleep(0.5)  # Just for demonstration
    
    # Log detailed info about the operation
    logger.structured(
        "INFO", 
        "Database query statistics", 
        query_type="complex_join", 
        tables=["users", "squads", "areas"], 
        filter_param=filter_param,
        result_count=42  # Just a placeholder
    )
    
    # Return dummy data
    return {"result": "Complex data from database"}

# Example database transaction with rollback handling
@log_db_transaction()
def update_user_preferences(db: Session, user_id: int, preferences: dict):
    """Example of a database transaction with automatic logging and rollback"""
    logger.info(f"Updating preferences for user {user_id}")
    
    # Validation example
    if not preferences:
        error = ValueError("Preferences cannot be empty")
        error = contextualize_exception(error, user_id=user_id, operation="update_preferences")
        raise error
    
    # Simulate database update
    time.sleep(0.3)  # Just for demonstration
    
    # Log the changes for auditability
    logger.structured(
        "INFO",
        "Updated user preferences",
        user_id=user_id,
        changed_fields=list(preferences.keys())
    )
    
    return {"status": "success", "updated_fields": list(preferences.keys())}

# Example API endpoint with request/response logging
@router.get("/data/{filter_value}")
@log_api_call(include_request_body=True)
async def get_filtered_data(
    filter_value: str,
    request: Request,
    limit: Optional[int] = 10,
    db: Session = Depends(get_db)
):
    """Example API endpoint with request logging"""
    # Use our timed database function
    try:
        result = get_complex_data_from_db(db, filter_value)
        
        # Log successful response with useful metrics
        logger.structured(
            "INFO",
            "Successfully retrieved filtered data",
            filter=filter_value,
            limit=limit,
            client_ip=request.client.host
        )
        
        return {
            "data": result,
            "metadata": {"filter": filter_value, "limit": limit}
        }
    except Exception as e:
        # Log the error with context
        logger.exception(
            f"Failed to retrieve data with filter {filter_value}",
            filter=filter_value,
            limit=limit
        )
        raise HTTPException(status_code=500, detail="Internal server error")

# Example secure operation with security event logging
@router.post("/secure-operation")
async def perform_secure_operation(
    request: Request,
    operation: schemas.SecureOperation,
    db: Session = Depends(get_db)
):
    """Example of a secure operation with security event logging"""
    # Assume we have a user context from auth middleware
    user_id = 123  # Just for demonstration
    
    # Log the attempt
    log_security_event(
        "secure_operation_attempt",
        user_id=user_id,
        operation_type=operation.operation_type,
        ip_address=request.client.host
    )
    
    # Example permission check
    if operation.operation_type == "admin_action" and user_id != 1:
        # Log security event for denied access
        log_security_event(
            "permission_denied",
            user_id=user_id,
            operation_type=operation.operation_type,
            ip_address=request.client.host,
            reason="non_admin_user"
        )
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Perform the operation
    try:
        # Update preferences as example
        update_user_preferences(db, user_id, operation.preferences)
        
        # Log successful operation
        log_security_event(
            "secure_operation_success",
            user_id=user_id,
            operation_type=operation.operation_type,
            ip_address=request.client.host
        )
        
        return {"status": "success", "message": "Operation completed successfully"}
    except Exception as e:
        # Log the failure as a security event
        log_security_event(
            "secure_operation_failed",
            user_id=user_id,
            operation_type=operation.operation_type,
            ip_address=request.client.host,
            error=str(e)
        )
        raise HTTPException(status_code=500, detail="Operation failed")


# Example of handling different log levels appropriately
def demonstrate_log_levels():
    """Example showing when to use different log levels"""
    
    # DEBUG - Detailed information for debugging
    logger.debug("Connection pool size: 20, active connections: 5")
    
    # INFO - Normal application operation events
    logger.info("Application started in development mode")
    
    # STRUCTURED INFO - Complex information that needs to be machine-parseable
    logger.structured(
        "INFO",
        "API rate limits applied",
        default_limit=100,
        premium_limit=1000,
        rate_window="1 minute"
    )
    
    # WARNING - Something unexpected but not critical
    logger.warning("Database connection pool running at 80% capacity")
    
    # ERROR - Something failed, but application can continue
    try:
        # Simulate an error
        result = 1 / 0
    except Exception as e:
        logger.exception("Failed to perform calculation")
    
    # CRITICAL - Application cannot function properly
    try:
        # Simulate a critical error
        raise RuntimeError("Database cluster unreachable")
    except Exception as e:
        logger.structured(
            "CRITICAL",
            "Application failing to connect to critical service",
            service="postgres_db",
            error=str(e),
            impact="Cannot process any user requests"
        )
