from sqlalchemy.orm import Session
from sqlalchemy import select, join, or_
from typing import List, Optional, Union
from sqlalchemy.sql import text
from datetime import datetime

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
    # ServiceStatus and ServiceType still use uppercase values, so we need to convert
    # We'll keep the upper case conversion since those enums still use uppercase values
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
    # ServiceStatus and ServiceType still use uppercase values, so we need to convert
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
    # Query dependencies with joined dependency squad for name
    stmt = text("""
        SELECT d.*, s.name as dependency_squad_name 
        FROM dependencies d
        JOIN squads s ON d.dependency_squad_id = s.id
        WHERE d.dependent_squad_id = :squad_id
    """)
    
    result = db.execute(stmt, {"squad_id": squad_id}).fetchall()
    
    # Convert to Dependency objects
    dependencies = []
    for row in result:
        # Handle interaction_mode case sensitivity
        interaction_mode = row.interaction_mode
        if interaction_mode:
            # Convert uppercase to lowercase for frontend compatibility
            if interaction_mode == 'X_AS_A_SERVICE':
                interaction_mode = 'x_as_a_service'
            elif interaction_mode == 'COLLABORATION':
                interaction_mode = 'collaboration'
            elif interaction_mode == 'FACILITATING':
                interaction_mode = 'facilitating'
                
        # Create the base dependency object
        dependency = models.Dependency(
            id=row.id,
            dependent_squad_id=row.dependent_squad_id,
            dependency_squad_id=row.dependency_squad_id,
            dependency_name=row.dependency_name,
            interaction_mode=interaction_mode,
            interaction_frequency=row.interaction_frequency
        )
        
        # Attach the squad name as a property
        setattr(dependency, "dependency_squad_name", row.dependency_squad_name)
        
        dependencies.append(dependency)
        
    return dependencies

def get_all_dependencies(db: Session) -> List[models.Dependency]:
    # Query all dependencies with joined dependency squad for name
    stmt = text("""
        SELECT d.*, s.name as dependency_squad_name 
        FROM dependencies d
        JOIN squads s ON d.dependency_squad_id = s.id
    """)
    
    result = db.execute(stmt).fetchall()
    
    # Convert to Dependency objects
    dependencies = []
    for row in result:
        # Handle interaction_mode case sensitivity
        interaction_mode = row.interaction_mode
        if interaction_mode:
            # Convert uppercase to lowercase for frontend compatibility
            if interaction_mode == 'X_AS_A_SERVICE':
                interaction_mode = 'x_as_a_service'
            elif interaction_mode == 'COLLABORATION':
                interaction_mode = 'collaboration'
            elif interaction_mode == 'FACILITATING':
                interaction_mode = 'facilitating'
                
        # Create the base dependency object
        dependency = models.Dependency(
            id=row.id,
            dependent_squad_id=row.dependent_squad_id,
            dependency_squad_id=row.dependency_squad_id,
            dependency_name=row.dependency_name,
            interaction_mode=interaction_mode,
            interaction_frequency=row.interaction_frequency
        )
        
        # Attach the squad name as a property
        setattr(dependency, "dependency_squad_name", row.dependency_squad_name)
        
        dependencies.append(dependency)
        
    return dependencies

def create_dependency(db: Session, dependent_id: int, dependency_id: int, dependency_data: schemas.DependencyBase) -> models.Dependency:
    # Use the interaction_mode directly from the frontend
    interaction_mode_str = dependency_data.interaction_mode
    
    # Just use the enum value directly - they now use lowercase values
    if isinstance(interaction_mode_str, str):
        # The enum values are already lowercase in models.py
        if interaction_mode_str == 'x_as_a_service':
            interaction_mode_value = models.InteractionMode.X_AS_A_SERVICE
        elif interaction_mode_str == 'collaboration':
            interaction_mode_value = models.InteractionMode.COLLABORATION
        elif interaction_mode_str == 'facilitating':
            interaction_mode_value = models.InteractionMode.FACILITATING
        else:
            interaction_mode_value = models.InteractionMode.X_AS_A_SERVICE
    else:
        interaction_mode_value = interaction_mode_str or models.InteractionMode.X_AS_A_SERVICE
    
    # Create dependency with the mapped enum value
    db_dependency = models.Dependency(
        dependent_squad_id=dependent_id,
        dependency_squad_id=dependency_id,
        dependency_name=dependency_data.dependency_name,
        interaction_mode=interaction_mode_value,
        interaction_frequency=dependency_data.interaction_frequency
    )
    
    # Add and commit to database
    db.add(db_dependency)
    db.commit()
    
    # Instead of using refresh (which causes issues with enum conversion),
    # we'll manually fetch the dependency again
    created_dependency = db.query(models.Dependency).filter(
        models.Dependency.dependent_squad_id == dependent_id,
        models.Dependency.dependency_squad_id == dependency_id,
        models.Dependency.dependency_name == dependency_data.dependency_name
    ).order_by(models.Dependency.id.desc()).first()
    
    return created_dependency

def update_dependency(db: Session, dependency_id: int, dependency_data: schemas.DependencyBase) -> Optional[models.Dependency]:
    # Get existing dependency
    db_dependency = db.query(models.Dependency).filter(models.Dependency.id == dependency_id).first()
    if not db_dependency:
        return None
        
    # Update fields if provided
    update_data = dependency_data.dict(exclude_unset=True)
    
    # Handle interaction_mode conversion using consistent lowercase values
    if 'interaction_mode' in update_data and update_data['interaction_mode'] is not None:
        interaction_mode_str = update_data['interaction_mode']
        
        # Just use the enum value directly - they now use lowercase values
        if isinstance(interaction_mode_str, str):
            # The enum values are already lowercase in models.py
            if interaction_mode_str == 'x_as_a_service':
                update_data['interaction_mode'] = models.InteractionMode.X_AS_A_SERVICE
            elif interaction_mode_str == 'collaboration':
                update_data['interaction_mode'] = models.InteractionMode.COLLABORATION
            elif interaction_mode_str == 'facilitating':
                update_data['interaction_mode'] = models.InteractionMode.FACILITATING
            else:
                update_data['interaction_mode'] = models.InteractionMode.X_AS_A_SERVICE
        else:
            update_data['interaction_mode'] = interaction_mode_str or models.InteractionMode.X_AS_A_SERVICE
    
    # Update the dependency object
    for key, value in update_data.items():
        setattr(db_dependency, key, value)
    
    db.commit()
    
    # Get a fresh instance to avoid refresh issues
    updated_dependency = db.query(models.Dependency).filter(models.Dependency.id == dependency_id).first()
    return updated_dependency

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

# OKR CRUD operations

# Objective operations
def get_objectives(db: Session, area_id: Optional[int] = None, tribe_id: Optional[int] = None, squad_id: Optional[int] = None) -> List[models.Objective]:
    
    # Step 1: Get direct objectives for the specified entity
    query = db.query(models.Objective)
    
    # Apply filters for direct objectives
    direct_filters = []
    if area_id:
        direct_filters.append(models.Objective.area_id == area_id)
    if tribe_id:
        direct_filters.append(models.Objective.tribe_id == tribe_id)
    if squad_id:
        direct_filters.append(models.Objective.squad_id == squad_id)
    
    # Execute query for direct objectives
    if direct_filters:
        direct_objectives = query.filter(or_(*direct_filters)).all()
    else:
        direct_objectives = query.all()
    
    # Step 2: Get cascaded objectives if appropriate
    cascaded_objectives = []
    
    # Handle cascading if we're looking at a specific entity
    if tribe_id or squad_id:
        # If we're looking at a tribe, get cascaded objectives from the parent area
        if tribe_id and not area_id:
            # Get the parent area of this tribe
            tribe = db.query(models.Tribe).filter(models.Tribe.id == tribe_id).first()
            if tribe and tribe.area_id:
                # Get cascaded objectives from the parent area
                cascaded_from_area = db.query(models.Objective).filter(
                    models.Objective.area_id == tribe.area_id,
                    models.Objective.cascade == True
                ).all()
                cascaded_objectives.extend(cascaded_from_area)
        
        # If we're looking at a squad, get cascaded objectives from both the parent tribe and area
        if squad_id:
            # Get the parent tribe of this squad
            squad = db.query(models.Squad).filter(models.Squad.id == squad_id).first()
            if squad:
                # Get cascaded objectives from the parent tribe
                if squad.tribe_id:
                    cascaded_from_tribe = db.query(models.Objective).filter(
                        models.Objective.tribe_id == squad.tribe_id,
                        models.Objective.cascade == True
                    ).all()
                    cascaded_objectives.extend(cascaded_from_tribe)
                
                # Get the parent area of the parent tribe
                if squad.tribe_id:
                    tribe = db.query(models.Tribe).filter(models.Tribe.id == squad.tribe_id).first()
                    if tribe and tribe.area_id:
                        # Get cascaded objectives from the grandparent area
                        cascaded_from_area = db.query(models.Objective).filter(
                            models.Objective.area_id == tribe.area_id,
                            models.Objective.cascade == True
                        ).all()
                        cascaded_objectives.extend(cascaded_from_area)
    
    # Combine direct and cascaded objectives, making sure to avoid duplicates
    all_objectives = direct_objectives.copy()
    
    # Add cascaded objectives, avoiding duplicates by checking IDs
    existing_ids = {obj.id for obj in all_objectives}
    for obj in cascaded_objectives:
        if obj.id not in existing_ids:
            all_objectives.append(obj)
            existing_ids.add(obj.id)
    
    return all_objectives

def get_objective(db: Session, objective_id: int) -> Optional[models.Objective]:
    return db.query(models.Objective).filter(models.Objective.id == objective_id).first()

def create_objective(db: Session, objective: schemas.ObjectiveCreate) -> models.Objective:
    db_objective = models.Objective(
        content=objective.content,
        area_id=objective.area_id,
        tribe_id=objective.tribe_id,
        squad_id=objective.squad_id,
        cascade=objective.cascade
    )
    db.add(db_objective)
    db.commit()
    db.refresh(db_objective)
    return db_objective

def update_objective(db: Session, objective_id: int, objective: schemas.ObjectiveUpdate) -> Optional[models.Objective]:
    db_objective = get_objective(db, objective_id)
    if not db_objective:
        return None
    
    # Update fields if provided
    update_data = objective.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_objective, field, value)
    
    db_objective.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_objective)
    return db_objective

def delete_objective(db: Session, objective_id: int) -> bool:
    db_objective = get_objective(db, objective_id)
    if not db_objective:
        return False
    
    db.delete(db_objective)
    db.commit()
    return True

# Key Result operations
def get_key_results(db: Session, objective_id: Optional[int] = None) -> List[models.KeyResult]:
    query = db.query(models.KeyResult)
    if objective_id:
        query = query.filter(models.KeyResult.objective_id == objective_id)
    return query.all()

def get_key_result(db: Session, key_result_id: int) -> Optional[models.KeyResult]:
    return db.query(models.KeyResult).filter(models.KeyResult.id == key_result_id).first()

def create_key_result(db: Session, key_result: schemas.KeyResultCreate) -> models.KeyResult:
    # Get the count of existing key results for this objective to set the position
    existing_key_results = db.query(models.KeyResult).filter(models.KeyResult.objective_id == key_result.objective_id).all()
    
    # Use the explicitly provided position if available, otherwise use next available position
    if key_result.position is not None:
        position = key_result.position
    else:
        # Calculate next position based on the highest current position
        position = 1  # Default if there are no key results yet
        if existing_key_results:
            max_position = max([kr.position or 0 for kr in existing_key_results])
            position = max_position + 1
    
    db_key_result = models.KeyResult(
        content=key_result.content,
        objective_id=key_result.objective_id,
        current_value=key_result.current_value,
        target_value=key_result.target_value,
        position=position
    )
    db.add(db_key_result)
    db.commit()
    db.refresh(db_key_result)
    return db_key_result

def update_key_result(db: Session, key_result_id: int, key_result: schemas.KeyResultUpdate) -> Optional[models.KeyResult]:
    db_key_result = get_key_result(db, key_result_id)
    if not db_key_result:
        return None
    
    # Check if position is being updated
    old_position = db_key_result.position
    new_position = key_result.position
    
    # Handle position changes
    if new_position is not None and old_position != new_position and db_key_result.objective_id:
        # Get all key results for this objective
        objective_id = db_key_result.objective_id
        
        # If moving to a higher position (e.g. from 1 to 3)
        if old_position < new_position:
            # Shift down all positions between old+1 and new
            key_results_to_update = db.query(models.KeyResult).filter(
                models.KeyResult.objective_id == objective_id,
                models.KeyResult.position > old_position,
                models.KeyResult.position <= new_position
            ).all()
            
            for kr in key_results_to_update:
                kr.position -= 1
                
        # If moving to a lower position (e.g. from 3 to 1)
        elif old_position > new_position:
            # Shift up all positions between new and old-1
            key_results_to_update = db.query(models.KeyResult).filter(
                models.KeyResult.objective_id == objective_id,
                models.KeyResult.position >= new_position,
                models.KeyResult.position < old_position
            ).all()
            
            for kr in key_results_to_update:
                kr.position += 1
    
    # Update fields if provided
    update_data = key_result.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_key_result, field, value)
    
    db_key_result.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_key_result)
    return db_key_result

def delete_key_result(db: Session, key_result_id: int) -> bool:
    db_key_result = get_key_result(db, key_result_id)
    if not db_key_result:
        return False
    
    # Get the objective ID and position before deleting
    objective_id = db_key_result.objective_id
    deleted_position = db_key_result.position
    
    # Delete the key result
    db.delete(db_key_result)
    
    # Update positions for remaining key results
    if deleted_position:
        # Get all key results for this objective with higher positions
        key_results_to_update = db.query(models.KeyResult).filter(
            models.KeyResult.objective_id == objective_id,
            models.KeyResult.position > deleted_position
        ).all()
        
        # Decrease their positions by 1
        for kr in key_results_to_update:
            kr.position -= 1
    
    db.commit()
    return True
