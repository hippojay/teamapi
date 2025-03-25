from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import models
import schemas
import user_auth


def create_area(db: Session, area_data: schemas.AreaBase, user_id: int) -> models.Area:
    """Create a new area"""
    # Create area with the provided data
    db_area = models.Area(
        name=area_data.name,
        description=area_data.description,
        member_count=area_data.member_count,
        core_count=area_data.core_count,
        subcon_count=area_data.subcon_count,
        total_capacity=area_data.total_capacity,
        core_capacity=area_data.core_capacity,
        subcon_capacity=area_data.subcon_capacity,
        label=area_data.label
    )
    
    db.add(db_area)
    db.commit()
    db.refresh(db_area)
    
    # Log the area creation
    user_auth.log_user_action(
        db=db,
        user_id=user_id,
        action="CREATE",
        entity_type="Area",
        entity_id=db_area.id,
        details=f"Created new area: {area_data.name}"
    )
    
    return db_area


def update_area(db: Session, area_id: int, area_data: schemas.AreaBase, user_id: int) -> Optional[models.Area]:
    """Update an existing area"""
    db_area = db.query(models.Area).filter(models.Area.id == area_id).first()
    if not db_area:
        return None
    
    # Store original name for audit log
    original_name = db_area.name
    
    # Update all provided fields
    for key, value in area_data.dict(exclude_unset=True).items():
        setattr(db_area, key, value)
    
    db.commit()
    db.refresh(db_area)
    
    # Log the area update
    details = f"Updated area: {original_name}"
    if original_name != db_area.name:
        details += f" (renamed to {db_area.name})"
        
    user_auth.log_user_action(
        db=db,
        user_id=user_id,
        action="UPDATE",
        entity_type="Area",
        entity_id=area_id,
        details=details
    )
    
    return db_area


def create_tribe(db: Session, tribe_data: schemas.TribeBase, area_id: int, user_id: int) -> models.Tribe:
    """Create a new tribe within an area"""
    # Create tribe with the provided data
    db_tribe = models.Tribe(
        name=tribe_data.name,
        description=tribe_data.description,
        area_id=area_id,
        member_count=tribe_data.member_count,
        core_count=tribe_data.core_count,
        subcon_count=tribe_data.subcon_count,
        total_capacity=tribe_data.total_capacity,
        core_capacity=tribe_data.core_capacity,
        subcon_capacity=tribe_data.subcon_capacity,
        label=tribe_data.label
    )
    
    db.add(db_tribe)
    db.commit()
    db.refresh(db_tribe)
    
    # Log the tribe creation
    user_auth.log_user_action(
        db=db,
        user_id=user_id,
        action="CREATE",
        entity_type="Tribe",
        entity_id=db_tribe.id,
        details=f"Created new tribe: {tribe_data.name} in area #{area_id}"
    )
    
    return db_tribe


def update_tribe(db: Session, tribe_id: int, tribe_data: schemas.TribeBase, user_id: int) -> Optional[models.Tribe]:
    """Update an existing tribe"""
    db_tribe = db.query(models.Tribe).filter(models.Tribe.id == tribe_id).first()
    if not db_tribe:
        return None
    
    # Store original name and area_id for audit log
    original_name = db_tribe.name
    original_area_id = db_tribe.area_id
    
    # Update all provided fields except area_id
    # We'll handle area_id separately to avoid inconsistencies
    update_data = tribe_data.dict(exclude_unset=True)
    if 'area_id' in update_data:
        del update_data['area_id']  # Don't update area_id here
    
    for key, value in update_data.items():
        setattr(db_tribe, key, value)
    
    db.commit()
    db.refresh(db_tribe)
    
    # Log the tribe update
    details = f"Updated tribe: {original_name}"
    if original_name != db_tribe.name:
        details += f" (renamed to {db_tribe.name})"
        
    user_auth.log_user_action(
        db=db,
        user_id=user_id,
        action="UPDATE",
        entity_type="Tribe",
        entity_id=tribe_id,
        details=details
    )
    
    return db_tribe


def update_tribe_area(db: Session, tribe_id: int, area_id: int, user_id: int) -> Optional[models.Tribe]:
    """Move a tribe to a different area"""
    db_tribe = db.query(models.Tribe).filter(models.Tribe.id == tribe_id).first()
    if not db_tribe:
        return None
    
    # Store original area_id for audit log
    original_area_id = db_tribe.area_id
    
    # Update area_id
    db_tribe.area_id = area_id
    
    db.commit()
    db.refresh(db_tribe)
    
    # Log the tribe move
    user_auth.log_user_action(
        db=db,
        user_id=user_id,
        action="UPDATE",
        entity_type="Tribe",
        entity_id=tribe_id,
        details=f"Moved tribe: {db_tribe.name} from area #{original_area_id} to area #{area_id}"
    )
    
    return db_tribe


def create_squad(db: Session, squad_data: schemas.SquadBase, tribe_id: int, user_id: int) -> models.Squad:
    """Create a new squad within a tribe"""
    # Create squad with the provided data
    db_squad = models.Squad(
        name=squad_data.name,
        description=squad_data.description,
        status=squad_data.status,
        timezone=squad_data.timezone,
        team_type=squad_data.team_type,
        member_count=squad_data.member_count,
        core_count=squad_data.core_count,
        subcon_count=squad_data.subcon_count,
        total_capacity=squad_data.total_capacity,
        core_capacity=squad_data.core_capacity,
        subcon_capacity=squad_data.subcon_capacity,
        teams_channel=squad_data.teams_channel,
        slack_channel=squad_data.slack_channel,
        email_contact=squad_data.email_contact,
        documentation_url=squad_data.documentation_url,
        jira_board_url=squad_data.jira_board_url,
        tribe_id=tribe_id
    )
    
    db.add(db_squad)
    db.commit()
    db.refresh(db_squad)
    
    # Log the squad creation
    user_auth.log_user_action(
        db=db,
        user_id=user_id,
        action="CREATE",
        entity_type="Squad",
        entity_id=db_squad.id,
        details=f"Created new squad: {squad_data.name} in tribe #{tribe_id}"
    )
    
    return db_squad


def update_squad(db: Session, squad_id: int, squad_data: schemas.SquadBase, user_id: int) -> Optional[models.Squad]:
    """Update an existing squad"""
    db_squad = db.query(models.Squad).filter(models.Squad.id == squad_id).first()
    if not db_squad:
        return None
    
    # Store original name and tribe_id for audit log
    original_name = db_squad.name
    original_tribe_id = db_squad.tribe_id
    
    # Update all provided fields except tribe_id
    # We'll handle tribe_id separately to avoid inconsistencies
    update_data = squad_data.dict(exclude_unset=True)
    if 'tribe_id' in update_data:
        del update_data['tribe_id']  # Don't update tribe_id here
    
    for key, value in update_data.items():
        setattr(db_squad, key, value)
    
    db.commit()
    db.refresh(db_squad)
    
    # Log the squad update
    details = f"Updated squad: {original_name}"
    if original_name != db_squad.name:
        details += f" (renamed to {db_squad.name})"
        
    user_auth.log_user_action(
        db=db,
        user_id=user_id,
        action="UPDATE",
        entity_type="Squad",
        entity_id=squad_id,
        details=details
    )
    
    return db_squad


def update_squad_tribe(db: Session, squad_id: int, tribe_id: int, user_id: int) -> Optional[models.Squad]:
    """Move a squad to a different tribe"""
    db_squad = db.query(models.Squad).filter(models.Squad.id == squad_id).first()
    if not db_squad:
        return None
    
    # Store original tribe_id for audit log
    original_tribe_id = db_squad.tribe_id
    
    # Update tribe_id
    db_squad.tribe_id = tribe_id
    
    db.commit()
    db.refresh(db_squad)
    
    # Log the squad move
    user_auth.log_user_action(
        db=db,
        user_id=user_id,
        action="UPDATE",
        entity_type="Squad",
        entity_id=squad_id,
        details=f"Moved squad: {db_squad.name} from tribe #{original_tribe_id} to tribe #{tribe_id}"
    )
    
    return db_squad
