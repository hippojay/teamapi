from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

import models
import schemas
import auth

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
