"""
Enhanced audit logging for the Who What Where portal.
This module provides consistent audit logging for key user actions.
"""

from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, Union
import models
import user_auth

def log_login(db: Session, user_id: int, username: str):
    """Log a user login event"""
    # Ensure we have a non-empty username
    display_name = username if username else f"User #{user_id}"
    user_auth.log_user_action(
        db=db,
        user_id=user_id,
        action="LOGIN",
        entity_type="User",
        entity_id=user_id,
        details=f"User logged in: {display_name}"
    )

def log_logout(db: Session, user_id: int, username: str):
    """Log a user logout event"""
    # Ensure we have a non-empty username
    display_name = username if username else f"User #{user_id}"
    user_auth.log_user_action(
        db=db,
        user_id=user_id,
        action="LOGOUT",
        entity_type="User",
        entity_id=user_id,
        details=f"User logged out: {display_name}"
    )

def log_label_update(
    db: Session,
    user_id: int,
    entity_type: str,
    entity_id: int,
    old_label: Optional[str],
    new_label: Optional[str]
):
    """Log a label update for an area or tribe"""
    if old_label is None and new_label is None:
        return  # No change

    if old_label is None:
        details = f"Added {entity_type} label: {new_label}"
    elif new_label is None:
        details = f"Removed {entity_type} label: {old_label}"
    else:
        details = f"Changed {entity_type} label from '{old_label}' to '{new_label}'"

    user_auth.log_user_action(
        db=db,
        user_id=user_id,
        action="UPDATE",
        entity_type=entity_type.capitalize(),
        entity_id=entity_id,
        details=details
    )

def log_description_update(
    db: Session,
    user_id: int,
    entity_type: str,
    entity_id: int
):
    """Log a description update"""
    entity_type_map = {
        "area": "Area",
        "tribe": "Tribe",
        "squad": "Squad"
    }

    mapped_type = entity_type_map.get(entity_type, entity_type.capitalize())

    user_auth.log_user_action(
        db=db,
        user_id=user_id,
        action="UPDATE",
        entity_type=mapped_type,
        entity_id=entity_id,
        details=f"Updated {mapped_type.lower()} description"
    )

def log_objective_action(
    db: Session,
    user_id: int,
    action: str,
    objective_id: int,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    details: Optional[str] = None
):
    """Log an objective-related action"""
    if details is None:
        details = f"{action.capitalize()} objective"

        if entity_type and entity_id:
            details += f" for {entity_type} #{entity_id}"

    user_auth.log_user_action(
        db=db,
        user_id=user_id,
        action=action.upper(),
        entity_type="Objective",
        entity_id=objective_id,
        details=details
    )

def log_key_result_action(
    db: Session,
    user_id: int,
    action: str,
    key_result_id: int,
    objective_id: int,
    details: Optional[str] = None
):
    """Log a key result-related action"""
    if details is None:
        details = f"{action.capitalize()} key result for objective #{objective_id}"

    user_auth.log_user_action(
        db=db,
        user_id=user_id,
        action=action.upper(),
        entity_type="KeyResult",
        entity_id=key_result_id,
        details=details
    )
