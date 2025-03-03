from sqlalchemy.orm import Session
from sqlalchemy import select, join
from typing import List, Optional
from sqlalchemy.sql import text

import models
import schemas

# Area operations
def get_areas(db: Session) -> List[models.Area]:
    return db.query(models.Area).all()

def get_area(db: Session, area_id: int) -> Optional[models.Area]:
    return db.query(models.Area).filter(models.Area.id == area_id).first()

# Tribe operations
def get_tribes(db: Session) -> List[models.Tribe]:
    return db.query(models.Tribe).all()

def get_tribes_by_area(db: Session, area_id: int) -> List[models.Tribe]:
    return db.query(models.Tribe).filter(models.Tribe.area_id == area_id).all()

def get_tribe(db: Session, tribe_id: int) -> Optional[models.Tribe]:
    return db.query(models.Tribe).filter(models.Tribe.id == tribe_id).first()

# Squad operations
def get_squads(db: Session) -> List[models.Squad]:
    return db.query(models.Squad).all()

def get_squads_by_tribe(db: Session, tribe_id: int) -> List[models.Squad]:
    return db.query(models.Squad).filter(models.Squad.tribe_id == tribe_id).all()

def get_squad(db: Session, squad_id: int) -> Optional[models.Squad]:
    return db.query(models.Squad).filter(models.Squad.id == squad_id).first()

# Team Member operations
def get_team_members(db: Session) -> List[models.TeamMember]:
    return db.query(models.TeamMember).all()

def get_team_members_by_squad(db: Session, squad_id: int) -> List[models.TeamMember]:
    """
    Get team members for a squad using the squad_members association table,
    but fall back to legacy direct relationship if needed
    """
    # Try to get members from the many-to-many relationship
    stmt = select(models.TeamMember).join(
        models.squad_members,
        models.TeamMember.id == models.squad_members.c.member_id
    ).where(models.squad_members.c.squad_id == squad_id)
    
    members = db.execute(stmt).scalars().all()
    
    # If no members found, try the legacy relationship
    if not members:
        members = db.query(models.TeamMember).filter(models.TeamMember.squad_id == squad_id).all()
    
    return members

def get_team_member(db: Session, member_id: int) -> Optional[models.TeamMember]:
    # Get the team member
    member = db.query(models.TeamMember).filter(models.TeamMember.id == member_id).first()
    
    if not member:
        return None
    
    # We'll add squad_memberships as a property to be used by schema conversion
    # rather than trying to set 'squads' directly on the SQLAlchemy model
    
    # First try to get squad memberships from the many-to-many relationship
    stmt = text("""
        SELECT sm.squad_id, s.name as squad_name, sm.capacity, sm.role
        FROM squad_members sm
        JOIN squads s ON sm.squad_id = s.id
        WHERE sm.member_id = :member_id
    """)
    
    result = db.execute(stmt, {"member_id": member_id}).fetchall()
    
    # Store as a property on the member object, not as a direct relationship
    squad_memberships = [
        {
            "squad_id": row[0],
            "squad_name": row[1],
            "capacity": row[2] if row[2] is not None else member.capacity,
            "role": row[3] if row[3] is not None else member.role
        }
        for row in result
    ]
    
    # If no squad memberships found from the many-to-many relationship,
    # check the legacy squad_id relationship
    if not squad_memberships and member.squad_id:
        squad = db.query(models.Squad).filter(models.Squad.id == member.squad_id).first()
        if squad:
            squad_memberships = [
                {
                    "squad_id": squad.id,
                    "squad_name": squad.name,
                    "capacity": member.capacity,
                    "role": member.role
                }
            ]
    
    # Attach as a property, not overriding the SQLAlchemy relationship
    # This ensures we're using our custom property and not the SQLAlchemy relationship
    setattr(member, "squad_memberships", squad_memberships)
    
    # IMPORTANT: Set squads to None to avoid validation errors with Pydantic
    # This ensures we're using our squad_memberships property for conversion
    if hasattr(member, '_sa_instance_state'):
        member.__dict__['squads'] = None
    
    return member

# Service operations
def get_services(db: Session) -> List[models.Service]:
    return db.query(models.Service).all()

def get_services_by_squad(db: Session, squad_id: int) -> List[models.Service]:
    return db.query(models.Service).filter(models.Service.squad_id == squad_id).all()

def get_service(db: Session, service_id: int) -> Optional[models.Service]:
    return db.query(models.Service).filter(models.Service.id == service_id).first()

# Dependency operations
def get_dependencies(db: Session, squad_id: int) -> List[models.Dependency]:
    return db.query(models.Dependency).filter(models.Dependency.dependent_squad_id == squad_id).all()

def get_all_dependencies(db: Session) -> List[models.Dependency]:
    return db.query(models.Dependency).all()

# On-call roster operations
def get_on_call(db: Session, squad_id: int) -> Optional[models.OnCallRoster]:
    return db.query(models.OnCallRoster).filter(models.OnCallRoster.squad_id == squad_id).first()
