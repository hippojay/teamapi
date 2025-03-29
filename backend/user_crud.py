from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

import models
import schemas
import auth
from database import db_config

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        is_admin=user.is_admin
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user_last_login(db: Session, user_id: int):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db_user.last_login = datetime.utcnow()
        db.commit()
        db.refresh(db_user)
    return db_user

# Description edit operations
def get_entity_description(db: Session, entity_type: str, entity_id: int) -> Optional[str]:
    """Get the latest description for an entity (area, tribe, squad)"""
    # First check if there's a custom description in the description_edits table
    latest_edit = db.query(models.DescriptionEdit).filter(
        models.DescriptionEdit.entity_type == entity_type,
        models.DescriptionEdit.entity_id == entity_id
    ).order_by(models.DescriptionEdit.edited_at.desc()).first()

    if latest_edit:
        return latest_edit.description

    # If no custom description, get the original description from the entity's table
    if entity_type == "area":
        entity = db.query(models.Area).filter(models.Area.id == entity_id).first()
    elif entity_type == "tribe":
        entity = db.query(models.Tribe).filter(models.Tribe.id == entity_id).first()
    elif entity_type == "squad":
        entity = db.query(models.Squad).filter(models.Squad.id == entity_id).first()
    else:
        return None

    return entity.description if entity else None

def update_entity_description(
    db: Session,
    entity_type: str,
    entity_id: int,
    description: str,
    user_id: int
) -> models.DescriptionEdit:
    """Create a new description edit for an entity"""
    # First validate that the entity exists
    if entity_type == "area":
        entity = db.query(models.Area).filter(models.Area.id == entity_id).first()
    elif entity_type == "tribe":
        entity = db.query(models.Tribe).filter(models.Tribe.id == entity_id).first()
    elif entity_type == "squad":
        entity = db.query(models.Squad).filter(models.Squad.id == entity_id).first()
    else:
        return None

    if not entity:
        return None

    # Create new description edit
    db_edit = models.DescriptionEdit(
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
        edited_by=user_id
    )

    db.add(db_edit)
    db.commit()
    db.refresh(db_edit)
    return db_edit

def get_description_edit_history(
    db: Session,
    entity_type: str,
    entity_id: int
) -> List[models.DescriptionEdit]:
    """Get edit history for an entity's description"""
    return db.query(models.DescriptionEdit).filter(
        models.DescriptionEdit.entity_type == entity_type,
        models.DescriptionEdit.entity_id == entity_id
    ).order_by(models.DescriptionEdit.edited_at.desc()).all()

def update_squad_team_type(db: Session, squad_id: int, team_type: str, user_id: int):
    """Update a squad's team_type and log the change"""
    # First check if squad exists
    squad = db.query(models.Squad).filter(models.Squad.id == squad_id).first()
    if not squad:
        return None

    # Normalize and validate team_type
    team_type_upper = team_type.upper() if team_type else "STREAM_ALIGNED"
    
    # Ensure it's one of the valid values
    if team_type_upper not in ["STREAM_ALIGNED", "PLATFORM", "ENABLING", "COMPLICATED_SUBSYSTEM"]:
        team_type_upper = "STREAM_ALIGNED"
    
    # Update the team_type with the string value directly
    squad.team_type = team_type_upper

    # Create an edit record
    edit = models.DescriptionEdit(
        entity_type="squad_team_type",
        entity_id=squad_id,
        description=f"Updated team type to {team_type_upper}",
        edited_by=user_id
    )

    db.add(edit)
    db.commit()
    db.refresh(squad)
    db.refresh(edit)

    return squad

# Admin settings operations
def get_admin_settings(db: Session):
    """Get all admin settings"""
    return db.query(models.AdminSetting).all()

def get_admin_setting(db: Session, key: str):
    """Get a specific admin setting by key"""
    return db.query(models.AdminSetting).filter(models.AdminSetting.key == key).first()

def get_admin_setting_value(db: Session, key: str, default_value: str = None):
    """Get the value of an admin setting, or return default if not found"""
    setting = get_admin_setting(db, key)
    return setting.value if setting else default_value

def update_admin_setting(db: Session, setting: schemas.AdminSettingUpdate, key: str, user_id: int):
    """Update an admin setting or create it if it doesn't exist"""
    db_setting = db.query(models.AdminSetting).filter(models.AdminSetting.key == key).first()
    
    if db_setting:
        db_setting.value = setting.value
        if setting.description is not None:
            db_setting.description = setting.description
    else:
        db_setting = models.AdminSetting(
            key=key,
            value=setting.value,
            description=setting.description or ""
        )
        db.add(db_setting)
    
    db.commit()
    db.refresh(db_setting)
    
    # Log the setting update
    from audit_logger import log_setting_update
    log_setting_update(db, user_id, key)
    
    return db_setting

def get_audit_logs(db: Session, skip: int = 0, limit: int = 100):
    """Get audit logs ordered by most recent first"""
    return db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).offset(skip).limit(limit).all()
