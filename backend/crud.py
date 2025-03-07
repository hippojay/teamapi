from sqlalchemy.orm import Session
from sqlalchemy import select, join
from typing import List, Optional
from sqlalchemy.sql import text

import models
import schemas
import user_crud

# Area operations
def get_areas(db: Session) -> List[models.Area]:
    areas = db.query(models.Area).all()
    
    # Check for edited descriptions
    for area in areas:
        edited_description = user_crud.get_entity_description(db, "area", area.id)
        if edited_description is not None:
            area.description = edited_description
            
    return areas

def get_area(db: Session, area_id: int) -> Optional[models.Area]:
    area = db.query(models.Area).filter(models.Area.id == area_id).first()
    
    if area:
        # Check for edited description
        edited_description = user_crud.get_entity_description(db, "area", area_id)
        if edited_description is not None:
            area.description = edited_description
            
    return area

# Tribe operations
def get_tribes(db: Session) -> List[models.Tribe]:
    tribes = db.query(models.Tribe).all()
    
    # Check for edited descriptions
    for tribe in tribes:
        edited_description = user_crud.get_entity_description(db, "tribe", tribe.id)
        if edited_description is not None:
            tribe.description = edited_description
            
    return tribes

def get_tribes_by_area(db: Session, area_id: int) -> List[models.Tribe]:
    tribes = db.query(models.Tribe).filter(models.Tribe.area_id == area_id).all()
    
    # Check for edited descriptions
    for tribe in tribes:
        edited_description = user_crud.get_entity_description(db, "tribe", tribe.id)
        if edited_description is not None:
            tribe.description = edited_description
            
    return tribes

def get_tribe(db: Session, tribe_id: int) -> Optional[models.Tribe]:
    tribe = db.query(models.Tribe).filter(models.Tribe.id == tribe_id).first()
    
    if tribe:
        # Check for edited description
        edited_description = user_crud.get_entity_description(db, "tribe", tribe_id)
        if edited_description is not None:
            tribe.description = edited_description
            
    return tribe

# Squad operations
def get_squads(db: Session) -> List[models.Squad]:
    squads = db.query(models.Squad).all()
    
    # Check for edited descriptions
    for squad in squads:
        edited_description = user_crud.get_entity_description(db, "squad", squad.id)
        if edited_description is not None:
            squad.description = edited_description
            
    return squads

def get_squads_by_tribe(db: Session, tribe_id: int) -> List[models.Squad]:
    squads = db.query(models.Squad).filter(models.Squad.tribe_id == tribe_id).all()
    
    # Check for edited descriptions
    for squad in squads:
        edited_description = user_crud.get_entity_description(db, "squad", squad.id)
        if edited_description is not None:
            squad.description = edited_description
            
    return squads

def get_squad(db: Session, squad_id: int) -> Optional[models.Squad]:
    # Get the squad with all relationships eagerly loaded
    squad = db.query(models.Squad).filter(models.Squad.id == squad_id).first()
    
    if not squad:
        return None
    
    # Check for edited description
    edited_description = user_crud.get_entity_description(db, "squad", squad_id)
    if edited_description is not None:
        squad.description = edited_description
    
    # We'll store capacity and role information separately as metadata
    # Query the squad members junction table
    stmt = text("""
        SELECT sm.member_id, sm.capacity, sm.role
        FROM squad_members sm
        WHERE sm.squad_id = :squad_id
    """)
    
    result = db.execute(stmt, {"squad_id": squad_id}).fetchall()
    
    # Create a dictionary of capacity and role by member_id
    member_metadata = {}
    for row in result:
        member_metadata[row.member_id] = {
            "capacity": row.capacity, 
            "squad_role": row.role
        }
    
    # Attach the metadata to the squad object without modifying the relationship
    setattr(squad, "member_metadata", member_metadata)
    
    return squad

# Team Member operations
def get_team_members(db: Session) -> List[models.TeamMember]:
    """
    Get all team members with their total capacity calculated from all squad memberships.
    """
    members = db.query(models.TeamMember).all()
    
    # Get all squad memberships
    stmt = text("""
        SELECT sm.member_id, sm.squad_id, s.name as squad_name, sm.capacity, sm.role
        FROM squad_members sm
        JOIN squads s ON sm.squad_id = s.id
    """)
    
    result = db.execute(stmt).fetchall()
    
    # Create a dictionary to store squad memberships by member_id
    memberships_by_member = {}
    for row in result:
        if row.member_id not in memberships_by_member:
            memberships_by_member[row.member_id] = []
        
        memberships_by_member[row.member_id].append({
            "squad_id": row.squad_id,
            "squad_name": row.squad_name,
            "capacity": row.capacity,
            "role": row.role
        })
    
    # Attach memberships and calculate total capacity for each member
    for member in members:
        memberships = memberships_by_member.get(member.id, [])
        
        # Calculate total capacity across all squad memberships
        total_capacity = sum(m["capacity"] for m in memberships) if memberships else 0
        
        # Store primary squad if any (just use the first one for simplicity)
        if memberships:
            setattr(member, "squad_id", memberships[0]["squad_id"])
        else:
            setattr(member, "squad_id", None)
        
        # Store the capacity and memberships as properties
        setattr(member, "capacity", total_capacity)
        setattr(member, "squad_memberships", memberships)
    
    return members

def get_team_members_by_squad(db: Session, squad_id: int) -> List[models.TeamMember]:
    """
    Get team members for a squad using the squad_members association table.
    This will include all team members assigned to the squad with their appropriate capacities.
    """
    # Use the many-to-many relationship through squad_members
    stmt = select(models.TeamMember).join(
        models.squad_members,
        models.TeamMember.id == models.squad_members.c.member_id
    ).where(models.squad_members.c.squad_id == squad_id)
    
    members = db.execute(stmt).scalars().all()
    
    # Get specific capacity and role information for this squad
    capacity_stmt = text("""
        SELECT member_id, capacity, role
        FROM squad_members
        WHERE squad_id = :squad_id
    """)
    
    capacity_result = db.execute(capacity_stmt, {"squad_id": squad_id}).fetchall()
    
    # Create a dictionary of capacity by member_id
    capacity_by_member = {}
    for row in capacity_result:
        capacity_by_member[row.member_id] = {
            "capacity": row.capacity,
            "role": row.role
        }
    
    # Also get all squad memberships for each member to calculate total capacity
    all_memberships_stmt = text("""
        SELECT sm.member_id, sm.squad_id, s.name as squad_name, sm.capacity, sm.role
        FROM squad_members sm
        JOIN squads s ON sm.squad_id = s.id
        WHERE sm.member_id IN :member_ids
    """)
    
    member_ids = [member.id for member in members]
    all_memberships_result = db.execute(all_memberships_stmt, {"member_ids": tuple(member_ids) if member_ids else (0,)}).fetchall()
    
    # Group memberships by member_id
    memberships_by_member = {}
    for row in all_memberships_result:
        if row.member_id not in memberships_by_member:
            memberships_by_member[row.member_id] = []
        
        memberships_by_member[row.member_id].append({
            "squad_id": row.squad_id,
            "squad_name": row.squad_name,
            "capacity": row.capacity,
            "role": row.role
        })
    
    # Attach capacity, role, and total capacity to each member
    for member in members:
        # Set squad-specific capacity and role
        if member.id in capacity_by_member:
            squad_capacity = capacity_by_member[member.id]["capacity"]
            squad_role = capacity_by_member[member.id]["role"]
        else:
            squad_capacity = 0
            squad_role = None
        
        # Set the capacity for this specific squad
        setattr(member, "capacity", squad_capacity)
        if squad_role:
            setattr(member, "role", squad_role)
        
        # Set squad_id
        setattr(member, "squad_id", squad_id)
        
        # Calculate total capacity across all squads
        all_memberships = memberships_by_member.get(member.id, [])
        total_capacity = sum(m["capacity"] for m in all_memberships) if all_memberships else 0
        setattr(member, "total_capacity", total_capacity)
        
        # Store all memberships
        setattr(member, "squad_memberships", all_memberships)
    
    return members

def get_team_member(db: Session, member_id: int) -> Optional[models.TeamMember]:
    # Get the team member
    member = db.query(models.TeamMember).filter(models.TeamMember.id == member_id).first()
    
    if not member:
        return None
    
    # Get squad memberships from the many-to-many relationship
    stmt = text("""
        SELECT sm.squad_id, s.name as squad_name, sm.capacity, sm.role
        FROM squad_members sm
        JOIN squads s ON sm.squad_id = s.id
        WHERE sm.member_id = :member_id
    """)
    
    result = db.execute(stmt, {"member_id": member_id}).fetchall()
    
    # Store memberships as a property on the member object
    squad_memberships = [
        {
            "squad_id": row[0],
            "squad_name": row[1],
            "capacity": row[2],
            "role": row[3] if row[3] is not None else member.role
        }
        for row in result
    ]
    
    # Attach as a property, not overriding the SQLAlchemy relationship
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
