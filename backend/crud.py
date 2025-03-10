from sqlalchemy.orm import Session
from sqlalchemy import select, join
from typing import List, Optional
from sqlalchemy.sql import text

import models
import schemas
import user_crud

# Function to safely query services table with proper enum handling
def get_services_query(db: Session):
    """Create a query for services that handles potential enum conversion issues"""
    # Use a direct SQL query to fetch the raw data first
    stmt = text("""
        SELECT 
            id, name, description, status, uptime, version, 
            api_docs_url, squad_id, service_type, url
        FROM services
    """)
    
    result = db.execute(stmt).fetchall()
    
    services = []
    
    # Manually convert each row to a Service object with correct enum handling
    for row in result:
        try:
            # Handle status enum
            try:
                status = models.ServiceStatus(row.status) if row.status else models.ServiceStatus.HEALTHY
            except ValueError:
                # Try uppercase
                status = models.ServiceStatus(row.status.upper()) if row.status else models.ServiceStatus.HEALTHY
            
            # Handle service_type enum
            try:
                service_type = models.ServiceType(row.service_type) if row.service_type else models.ServiceType.API
            except ValueError:
                # Try uppercase
                service_type = models.ServiceType(row.service_type.upper()) if row.service_type else models.ServiceType.API
            
            # Create Service object
            service = models.Service(
                id=row.id,
                name=row.name,
                description=row.description,
                status=status,
                uptime=row.uptime if row.uptime is not None else 99.9,
                version=row.version if row.version is not None else "1.0.0",
                api_docs_url=row.api_docs_url,
                squad_id=row.squad_id,
                service_type=service_type,
                url=row.url
            )
            
            services.append(service)
        except Exception as e:
            print(f"Error processing service ID {row.id}: {e}")
    
    return services

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
    # Use the safe query function to avoid enum issues
    return get_services_query(db)

def get_services_by_squad(db: Session, squad_id: int) -> List[models.Service]:
    # Use the safe query function and filter by squad_id in Python
    all_services = get_services_query(db)
    return [s for s in all_services if s.squad_id == squad_id]

def get_service(db: Session, service_id: int) -> Optional[models.Service]:
    # Use the safe query function and filter by service_id in Python
    all_services = get_services_query(db)
    for service in all_services:
        if service.id == service_id:
            return service
    return None

def create_service(db: Session, service: schemas.ServiceCreate) -> models.Service:
    # Ensure we use the enum values from the models module
    status_value = models.ServiceStatus[service.status.upper()] if isinstance(service.status, str) else service.status
    service_type_value = models.ServiceType[service.service_type.upper()] if isinstance(service.service_type, str) else service.service_type
    
    db_service = models.Service(
        name=service.name,
        description=service.description,
        status=status_value,
        uptime=service.uptime,
        version=service.version,
        service_type=service_type_value,
        url=service.url,
        squad_id=service.squad_id
    )
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    return db_service

def update_service(db: Session, service_id: int, service_data: schemas.ServiceUpdate) -> Optional[models.Service]:
    # Get existing service
    db_service = db.query(models.Service).filter(models.Service.id == service_id).first()
    if not db_service:
        return None
        
    # Update fields if provided
    update_data = service_data.dict(exclude_unset=True)
    
    # Handle enum values explicitly
    if 'status' in update_data and update_data['status'] is not None:
        status = update_data['status']
        update_data['status'] = models.ServiceStatus[status.upper()] if isinstance(status, str) else status
        
    if 'service_type' in update_data and update_data['service_type'] is not None:
        service_type = update_data['service_type']
        update_data['service_type'] = models.ServiceType[service_type.upper()] if isinstance(service_type, str) else service_type
    
    for key, value in update_data.items():
        setattr(db_service, key, value)
    
    db.commit()
    db.refresh(db_service)
    return db_service

def delete_service(db: Session, service_id: int) -> bool:
    db_service = db.query(models.Service).filter(models.Service.id == service_id).first()
    if not db_service:
        return False
    
    db.delete(db_service)
    db.commit()
    return True

# Dependency operations
def get_dependencies(db: Session, squad_id: int) -> List[models.Dependency]:
    return db.query(models.Dependency).filter(models.Dependency.dependent_squad_id == squad_id).all()

def get_all_dependencies(db: Session) -> List[models.Dependency]:
    return db.query(models.Dependency).all()

def create_dependency(db: Session, dependent_id: int, dependency_id: int, dependency_data: schemas.DependencyBase) -> models.Dependency:
    # Ensure we use the enum values from the models module
    dependency_type_value = models.DependencyType[dependency_data.dependency_type.upper()] if isinstance(dependency_data.dependency_type, str) else dependency_data.dependency_type
    interaction_mode_value = models.InteractionMode[dependency_data.interaction_mode.upper()] if isinstance(dependency_data.interaction_mode, str) else dependency_data.interaction_mode
    
    db_dependency = models.Dependency(
        dependent_squad_id=dependent_id,
        dependency_squad_id=dependency_id,
        dependency_name=dependency_data.dependency_name,
        dependency_type=dependency_type_value,
        interaction_mode=interaction_mode_value,
        interaction_frequency=dependency_data.interaction_frequency
    )
    db.add(db_dependency)
    db.commit()
    db.refresh(db_dependency)
    return db_dependency

def update_dependency(db: Session, dependency_id: int, dependency_data: schemas.DependencyBase) -> Optional[models.Dependency]:
    # Get existing dependency
    db_dependency = db.query(models.Dependency).filter(models.Dependency.id == dependency_id).first()
    if not db_dependency:
        return None
        
    # Update fields if provided
    update_data = dependency_data.dict(exclude_unset=True)
    
    # Handle enum values explicitly
    if 'dependency_type' in update_data and update_data['dependency_type'] is not None:
        dependency_type = update_data['dependency_type']
        update_data['dependency_type'] = models.DependencyType[dependency_type.upper()] if isinstance(dependency_type, str) else dependency_type
        
    if 'interaction_mode' in update_data and update_data['interaction_mode'] is not None:
        interaction_mode = update_data['interaction_mode']
        update_data['interaction_mode'] = models.InteractionMode[interaction_mode.upper()] if isinstance(interaction_mode, str) else interaction_mode
    
    for key, value in update_data.items():
        setattr(db_dependency, key, value)
    
    db.commit()
    db.refresh(db_dependency)
    return db_dependency

def delete_dependency(db: Session, dependency_id: int) -> bool:
    db_dependency = db.query(models.Dependency).filter(models.Dependency.id == dependency_id).first()
    if not db_dependency:
        return False
    
    db.delete(db_dependency)
    db.commit()
    return True

# On-call roster operations
def get_on_call(db: Session, squad_id: int) -> Optional[models.OnCallRoster]:
    return db.query(models.OnCallRoster).filter(models.OnCallRoster.squad_id == squad_id).first()
