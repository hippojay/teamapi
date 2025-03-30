import pandas as pd
import os
import argparse
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from logger import get_logger, log_and_handle_exception

# Configure logging
logger = get_logger('load_prod_data')

def ensure_db_compatibility():
    """Placeholder function for backward compatibility"""
    # This function previously triggered migrations
    # Now it simply logs that migrations are no longer needed
    logger.info("Database compatibility is managed through string-based enums; no migrations needed.")

def load_services_data(file_path: str, db: Session, append_mode: bool = False, sheet_name: str = "Services", run_compatibility_check: bool = True):
    """
    Load services data from Excel or CSV file into the database

    Parameters:
    - file_path: Path to the Excel or CSV file
    - db: Database session
    - append_mode: If True, will update existing records rather than creating duplicates
    - sheet_name: Name of the Excel sheet to load (default: "Services") - not used for CSV
    - run_compatibility_check: If True, will run database compatibility checks
    """
    # Run compatibility check if requested
    if run_compatibility_check:
        ensure_db_compatibility()

    print(f"Loading services data from {file_path}")

    # Determine if file is CSV based on extension
    is_csv = file_path.lower().endswith('.csv')

    # Read the file
    try:
        if is_csv:
            # For CSV files, sheet_name is ignored
            df = pd.read_csv(file_path)
            print(f"Successfully read CSV file with {len(df)} rows")
        else:
            # For Excel files, use the specified sheet
            df = pd.read_excel(file_path, sheet_name=sheet_name)
            print(f"Successfully read Excel file with {len(df)} rows, sheet: {sheet_name}")
    except Exception as e:
        if is_csv:
            print(f"Error reading CSV file: {e}")
        else:
            print(f"Error reading Excel file or sheet '{sheet_name}': {e}")
        return

    # Get existing squads by name for reference
    squads_by_name = {squad.name: squad for squad in db.query(models.Squad).all()}

    # Get existing services if in append mode
    existing_services = {}
    if append_mode:
        for service in db.query(models.Service).all():
            key = f"{service.name}_{service.squad_id}"
            existing_services[key] = service

    # Process each service
    for _, row in df.iterrows():
        # Skip rows with missing required fields
        if pd.isna(row['Service Name']) or pd.isna(row['Squad Name']):
            print(f"Skipping row with missing required fields: {row}")
            continue

        # Get the squad_id from the squad name
        squad_name = row['Squad Name']
        if squad_name not in squads_by_name:
            print(f"Warning: Squad '{squad_name}' not found for service '{row['Service Name']}'. Skipping.")
            continue

        squad_id = squads_by_name[squad_name].id

        service_type_value = None
        if 'Type' in row and not pd.isna(row['Type']):
            type_str = row['Type'].lower()
            if type_str == 'api':
                service_type_value = "api"
            elif 'repo' in type_str or 'repository' in type_str:
                service_type_value = "repo"
            elif 'platform' in type_str:
                service_type_value = "platform"
            elif 'web' in type_str or 'webpage' in type_str:
                service_type_value = "webpage"
            elif 'app' in type_str or 'module' in type_str:
                service_type_value = "app_module"

        # Use API as default if type couldn't be determined
        if service_type_value is None:
            service_type_value = "api"

        # Check if this service already exists
        service_key = f"{row['Service Name']}_{squad_id}"
        if append_mode and service_key in existing_services:
            # Update existing service
            service = existing_services[service_key]
            service.description = row['Description'] if 'Description' in row and not pd.isna(row['Description']) else service.description
            service.service_type = service_type_value
            service.url = row['URL'] if 'URL' in row and not pd.isna(row['URL']) else service.url
            service.version = row['Version'] if 'Version' in row and not pd.isna(row['Version']) else service.version
            service.status = "healthy"  # Default to healthy

            print(f"Updated existing service: {service.name} (ID: {service.id})")
        else:
            # Create new service
            service = models.Service(
                name=row['Service Name'],
                description=row['Description'] if 'Description' in row and not pd.isna(row['Description']) else "",
                service_type=service_type_value,
                url=row['URL'] if 'URL' in row and not pd.isna(row['URL']) else None,
                version=row['Version'] if 'Version' in row and not pd.isna(row['Version']) else "1.0.0",
                status="healthy",  # Default to healthy
                uptime=99.9,  # Default uptime
                squad_id=squad_id
            )
            db.add(service)
            print(f"Created new service: {service.name} (Type: {service.service_type})")

    # Commit all changes
    db.commit()
    print(f"Services data successfully loaded from {file_path}!")

def load_data_from_excel(file_path: str, db: Session, append_mode: bool = False, sheet_name: str = "Sheet1", run_compatibility_check: bool = True):
    """
    Load production data from Excel or CSV file into the database

    Parameters:
    - file_path: Path to the Excel or CSV file
    - db: Database session
    - append_mode: If True, will update existing records rather than creating duplicates
    - sheet_name: Name of the Excel sheet to load (default: "Sheet1") - not used for CSV
    - run_compatibility_check: If True, will run database compatibility checks
    """
    # Run compatibility check if requested
    if run_compatibility_check:
        ensure_db_compatibility()

    # Determine if file is CSV based on extension
    is_csv = file_path.lower().endswith('.csv')

    if is_csv:
        logger.info(f"Loading production data from {file_path} (CSV)")
    else:
        logger.info(f"Loading production data from {file_path}, sheet: {sheet_name}")

    # Read the file
    try:
        if is_csv:
            # For CSV files, sheet_name is ignored
            df = pd.read_csv(file_path)
            logger.info(f"Successfully read CSV file with {len(df)} rows")
        else:
            # For Excel files, use the specified sheet
            df = pd.read_excel(file_path, sheet_name=sheet_name)
            logger.info(f"Successfully read Excel file with {len(df)} rows")
    except Exception as e:
        log_and_handle_exception(
            logger,
            f"Error reading {'CSV' if is_csv else 'Excel'} file: {file_path}",
            e,
            reraise=True,
            file_path=file_path,
            sheet_name=None if is_csv else sheet_name
        )

    # Check required columns
    try:
        required_columns = ['Area', 'Tribe', 'Squad', 'Name', 'Business Email Address']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            error_msg = f"Required columns missing: {', '.join(missing_columns)}"
            logger.error(error_msg)
            raise ValueError(error_msg)
    except Exception as e:
        log_and_handle_exception(
            logger,
            f"Error reading column in {'CSV' if is_csv else 'Excel'} file: {file_path}",
            e,
            reraise=True,
            file_path=file_path,
            sheet_name=None if is_csv else sheet_name
        )

    # Extract unique areas, tribes, and squads
    logger.debug("Extracting unique organizational units")
    areas = df['Area'].dropna().unique()
    logger.info(f"Found unique areas: {len(areas)}")

    area_objects = {}
    tribe_objects = {}
    squad_objects = {}

    # Get existing data if in append mode
    if append_mode:
        # Cache existing areas
        existing_areas = {area.name: area for area in db.query(models.Area).all()}
        area_objects.update(existing_areas)

        # Cache existing tribes
        existing_tribes = {tribe.name: tribe for tribe in db.query(models.Tribe).all()}
        tribe_objects.update(existing_tribes)

        # Cache existing squads
        existing_squads = {squad.name: squad for squad in db.query(models.Squad).all()}
        squad_objects.update(existing_squads)

        # Cache existing members by email
        existing_members = {member.email: member for member in db.query(models.TeamMember).all()}
        members_by_email = existing_members.copy()
        members_by_name = {member.name: member for member in existing_members.values()}

        logger.info(f"Operating in append mode: areas={len(existing_areas)}, tribes={len(existing_tribes)}, squads={len(existing_squads)}, members={len(existing_members)}")
    else:
        members_by_email = {}
        members_by_name = {}

    # Create Areas (or use existing in append mode)
    for area_name in areas:
        if append_mode and area_name in area_objects:
            # Area already exists
            logger.info(f"Using existing area: {area_name} (ID: {area_objects[area_name].id})")
            continue

        area = models.Area(
            name=area_name,
            description=""  # Empty description as per requirements
        )
        db.add(area)
        db.flush()  # Flush to get the ID
        area_objects[area_name] = area
        logger.info(f"Created new area: {area_name} (ID: {area.id})")

    # Create Tribes (or use existing in append mode)
    tribes_data = df[['Area', 'Tribe']].dropna().drop_duplicates()
    for _, row in tribes_data.iterrows():
        area_name = row['Area']
        tribe_name = row['Tribe']

        if area_name not in area_objects:
            logger.warning(f"Area not found for tribe: {area_name} -> {tribe_name}")
            continue

        if append_mode and tribe_name in tribe_objects:
            # Tribe already exists
            logger.info(f"Using existing tribe: {tribe_name} (ID: {tribe_objects[tribe_name].id})")
            continue

        tribe = models.Tribe(
            name=tribe_name,
            description="",  # Empty description as per requirements
            area_id=area_objects[area_name].id
        )
        db.add(tribe)
        db.flush()
        tribe_objects[tribe_name] = tribe
        logger.info(f"Created new tribe: {tribe_name} (ID: {tribe.id})")

    # Create Squads (or use existing in append mode)
    squads_data = df[['Tribe', 'Squad']].dropna().drop_duplicates()
    for _, row in squads_data.iterrows():
        tribe_name = row['Tribe']
        squad_name = row['Squad']

        if tribe_name not in tribe_objects:
            logger.warning(f"Tribe not found for squad: {tribe_name} -> {squad_name}")
            continue

        if append_mode and squad_name in squad_objects:
            # Squad already exists
            logger.info(f"Using existing squad: {squad_name} (ID: {squad_objects[squad_name].id})")
            continue

        # Create new squad with default team_type
        # Always use lowercase for enum values for consistency
        team_type_value = "stream_aligned"

        squad = models.Squad(
            name=squad_name,
            description="",  # Empty description as per requirements
            status="Active",  # Default to Active as per requirements
            timezone="UTC",   # Default to UTC as per requirements
            team_type=team_type_value,  # Set default team type value
            member_count=0,   # Will be updated later
            tribe_id=tribe_objects[tribe_name].id
        )
        db.add(squad)
        db.flush()
        squad_objects[squad_name] = squad
        logger.info(f"Created new squad: {squad_name} (ID: {squad.id})")

    # Dictionary to track supervisors
    supervisors_by_name = {}

    # Create Team Members
    members_data = df[['Squad', 'Name', 'Business Email Address', 'Position', 'Current Phasing',
                       'Work Geography', 'Work City', 'Regular / Temporary', 'Supervisor Name', 'Vendor Name', 'Function']].dropna(subset=['Squad', 'Name'])

    # Initialize tracking dictionaries for counts and capacities
    squad_member_counts = {squad_name: 0 for squad_name in squad_objects}
    squad_capacity_totals = {squad_name: 0.0 for squad_name in squad_objects}
    squad_core_counts = {squad_name: 0 for squad_name in squad_objects}
    squad_core_capacity = {squad_name: 0.0 for squad_name in squad_objects}
    squad_subcon_counts = {squad_name: 0 for squad_name in squad_objects}
    squad_subcon_capacity = {squad_name: 0.0 for squad_name in squad_objects}

    # If in append mode, get current counts from database
    if append_mode:
        for squad_name, squad in squad_objects.items():
            # Get current squad member count
            member_count_query = db.query(models.squad_members).filter_by(squad_id=squad.id).count()
            squad_member_counts[squad_name] = member_count_query

            # Keep existing values for capacities
            squad_capacity_totals[squad_name] = squad.total_capacity or 0.0
            squad_core_counts[squad_name] = squad.core_count or 0
            squad_core_capacity[squad_name] = squad.core_capacity or 0.0
            squad_subcon_counts[squad_name] = squad.subcon_count or 0
            squad_subcon_capacity[squad_name] = squad.subcon_capacity or 0.0

    # Process supervisors first - Create unique supervisors who aren't already team members
    supervisor_names = set()
    for _, row in members_data.iterrows():
        if not pd.isna(row['Supervisor Name']):
            supervisor_names.add(row['Supervisor Name'])

    # Process team members
    for _, row in members_data.iterrows():
        squad_name = row['Squad']
        if pd.isna(squad_name) or squad_name not in squad_objects:
            continue

        # Extract capacity from Current Phasing
        capacity = 1.0  # Default to 100% if not specified
        if 'Current Phasing' in row and not pd.isna(row['Current Phasing']):
            capacity = float(row['Current Phasing'])

        # Get name
        name = row['Name']

        # Check if this is a vacancy or has missing email
        is_vacancy = name == 'Vacancy'
        has_email = not pd.isna(row['Business Email Address'])

        logger.debug(f"Processing team member: {name} in squad {squad_name}")

        # Determine employment type and update counts only for non-vacancies
        if not is_vacancy:
            # Determine employment type based on 'Regular / Temporary' field
            employment_type = "core"  # Default
            if 'Regular / Temporary' in row and not pd.isna(row['Regular / Temporary']):
                if row['Regular / Temporary'].lower() == "regular":
                    employment_type = "core"
                else:  # Anything else is considered a contractor ("Contingent", etc.)
                    employment_type = "subcon"

            # For contractors, check if there's a vendor name provided
            vendor_name = None
            if 'Vendor Name' in row and not pd.isna(row['Vendor Name']):
                vendor_name = row['Vendor Name']
        else:
            # For vacancies, don't update counts but set default values
            employment_type = None  # Default for vacancies
            vendor_name = None

        # No random image URL generation for production data
        image_url = None

        # Check if this is a vacancy already detected earlier
        # is_vacancy was already set above

        # Generate email for vacancies or members with missing email
        if is_vacancy or not has_email:
            # Set email to None for vacancies and any entry missing an email
            email = None  # Don't generate dummy emails for any entries
        else:
            # Normal case - use provided email only when it exists
            email = row['Business Email Address']
        # Check if member exists in database already
        if email in members_by_email and not is_vacancy:
            # Member already exists
            member = members_by_email[email]

            # Check if they're already in this squad
            existing_membership_query = db.query(models.squad_members).filter_by(
                member_id=member.id,
                squad_id=squad_objects[squad_name].id
            )

            existing_membership = existing_membership_query.first()

            if existing_membership:
                # Member is already in this squad, update capacity if different
                if abs(existing_membership.capacity - capacity) > 0.01:  # Allow small floating point differences
                    # Update capacity using SQL update method instead of direct assignment
                    existing_membership_query.update({
                        'capacity': capacity,
                        'role': row['Position'] if not pd.isna(row['Position']) else "Team Member"
                    })
                    logger.info(f"Updated member capacity: {member.name} in {squad_name} to {capacity}")
            else:
                # Add to squad_members table with provided capacity
                db.execute(
                    models.squad_members.insert().values(
                        member_id=member.id,
                        squad_id=squad_objects[squad_name].id,
                        capacity=capacity,
                        role=row['Position'] if not pd.isna(row['Position']) else "Team Member"
                    )
                )
                logger.info(f"Added member to additional squad: {member.name} to {squad_name} with capacity {capacity}")

                # Update counts only for non-vacancies
                if not is_vacancy:
                    # Update counts
                    if employment_type == "core":
                        squad_core_counts[squad_name] += 1
                        squad_core_capacity[squad_name] += capacity
                    else:
                        squad_subcon_counts[squad_name] += 1
                        squad_subcon_capacity[squad_name] += capacity

                    squad_member_counts[squad_name] += 1
                    squad_capacity_totals[squad_name] += capacity
        else:
            # Create new team member
            member = models.TeamMember(
                name=name,
                email=email,
                role=row['Position'] if not pd.isna(row['Position']) else "Team Member",
                function=row['Function'] if 'Function' in row and not pd.isna(row['Function']) else None,
                geography=row['Work Geography'] if 'Work Geography' in row and not pd.isna(row['Work Geography']) else None,
                location=row['Work City'] if 'Work City' in row and not pd.isna(row['Work City']) else None,
                image_url=image_url,
                employment_type=employment_type,
                vendor_name=vendor_name if employment_type == "subcon" else None,
                is_external=False,  # Regular team member
                is_vacancy=is_vacancy  # Set vacancy flag
            )
            db.add(member)
            db.flush()  # Flush to get the member ID

            # Add to squad_members table
            db.execute(
                models.squad_members.insert().values(
                    member_id=member.id,
                    squad_id=squad_objects[squad_name].id,
                    capacity=capacity,
                    role=member.role
                )
            )

            # Store in dictionaries for reference
            members_by_email[email] = member
            members_by_name[name] = member
            logger.info(f"Created new team member: {member.name} in {squad_name}, capacity={capacity}, vacancy={is_vacancy}")

            # Update counts only for non-vacancies
            if not is_vacancy:
                if employment_type == "core":
                    squad_core_counts[squad_name] += 1
                    squad_core_capacity[squad_name] += capacity
                else:
                    squad_subcon_counts[squad_name] += 1
                    squad_subcon_capacity[squad_name] += capacity

                squad_member_counts[squad_name] += 1
                squad_capacity_totals[squad_name] += capacity

    # Make sure to commit team members before adding supervisors
    db.flush()

    # Cache existing supervisors in append mode
    if append_mode:
        for team_member in db.query(models.TeamMember).filter_by(role="Supervisor", is_external=True).all():
            supervisors_by_name[team_member.name] = team_member

    # Now create supervisors who aren't already team members
    for supervisor_name in supervisor_names:
        # Skip if this supervisor is already a team member
        if supervisor_name in members_by_name:
            supervisors_by_name[supervisor_name] = members_by_name[supervisor_name]
            continue

        # Skip if supervisor already exists in append mode
        if append_mode and supervisor_name in supervisors_by_name:
            continue

        # Create a placeholder email for the supervisor
        email_prefix = supervisor_name.lower().replace(' ', '.')
        supervisor_email = f"{email_prefix}@example.com"

        # Create external supervisor
        supervisor = models.TeamMember(
            name=supervisor_name,
            email=supervisor_email,
            role="Supervisor",  # Default role for external supervisors
            is_external=True  # Mark as external supervisor
        )
        db.add(supervisor)
        db.flush()  # Flush to get the ID

        supervisors_by_name[supervisor_name] = supervisor
        logger.info(f"Created external supervisor: {supervisor_name}")

    # Now set supervisor relationships based on the Supervisor Name field
    for _, row in members_data.iterrows():
        if pd.isna(row['Supervisor Name']):
            continue

        name = row['Name']
        supervisor_name = row['Supervisor Name']

        # Skip vacancies for supervisor relationships
        if name == 'Vacancy':
            continue

        # Handle members that might have auto-generated emails
        has_email = not pd.isna(row['Business Email Address'])
        if has_email:
            member_email = row['Business Email Address']
            if member_email in members_by_email and supervisor_name in supervisors_by_name:
                member = members_by_email[member_email]
                supervisor = supervisors_by_name[supervisor_name]

                # Set the supervisor relationship if different
                if member.supervisor_id != supervisor.id:
                    member.supervisor_id = supervisor.id
                    logger.info(f"Set supervisor relationship: {member.name} -> {supervisor.name}")
        else:
            # Try to find the member by name
            if name in members_by_name and supervisor_name in supervisors_by_name:
                member = members_by_name[name]
                supervisor = supervisors_by_name[supervisor_name]

                # Set the supervisor relationship if different
                if member.supervisor_id != supervisor.id:
                    member.supervisor_id = supervisor.id
                    print(f"Set supervisor for {member.name}: {supervisor.name}")

    # Update member counts and total capacity directly
    for squad_name, squad in squad_objects.items():
        if squad_name in squad_member_counts:
            squad.member_count = squad_member_counts[squad_name]
            squad.total_capacity = round(squad_capacity_totals[squad_name], 2)
            squad.core_count = squad_core_counts[squad_name]
            squad.core_capacity = round(squad_core_capacity[squad_name], 2)
            squad.subcon_count = squad_subcon_counts[squad_name]
            squad.subcon_capacity = round(squad_subcon_capacity[squad_name], 2)
            logger.info(f"Updated squad metrics: {squad_name}, members={squad.member_count} "
                        f"(Core={squad.core_count}, Subcon={squad.subcon_count}), "
                        f"capacity={round(squad.total_capacity, 2)} (Core={round(squad.core_capacity, 2)}, "
                        f"Subcon={round(squad.subcon_capacity, 2)})")
    # Update tribe and area counts and capacities
    if append_mode:
        # Recalculate all tribe and area counts to ensure correctness
        update_all_tribe_and_area_counts(db)
    else:
        # Calculate tribe totals for just the tribes in this file
        calculate_tribe_and_area_counts(db, list(tribe_objects.values()))

    # Commit all changes
    db.commit()
    logger.info(f"Database successfully updated with organizational data from {file_path}")

def calculate_tribe_and_area_counts(db: Session, tribes_to_update):
    """Calculate and update member counts and capacities for specific tribes and their areas"""
    # Initialize dictionaries to store area metrics
    area_member_counts = {}
    area_capacity_totals = {}
    area_core_counts = {}
    area_core_capacity = {}
    area_subcon_counts = {}
    area_subcon_capacity = {}

    # Update tribes
    for tribe in tribes_to_update:
        tribe_squads = db.query(models.Squad).filter_by(tribe_id=tribe.id).all()
        member_count = sum([squad.member_count for squad in tribe_squads])
        capacity = sum([squad.total_capacity for squad in tribe_squads])
        core_count = sum([squad.core_count for squad in tribe_squads])
        core_capacity = sum([squad.core_capacity for squad in tribe_squads])
        subcon_count = sum([squad.subcon_count for squad in tribe_squads])
        subcon_capacity = sum([squad.subcon_capacity for squad in tribe_squads])

        tribe.member_count = member_count
        tribe.total_capacity = round(capacity, 2)
        tribe.core_count = core_count
        tribe.core_capacity = round(core_capacity, 2)
        tribe.subcon_count = subcon_count
        tribe.subcon_capacity = round(subcon_capacity, 2)

        logger.info(f"Updated tribe metrics: {tribe.name}, members={member_count} (Core={core_count}, Subcon={subcon_count}), capacity={round(capacity, 2)} (Core={round(core_capacity, 2)}, Subcon={round(subcon_capacity, 2)})")

        # Add to area counts
        area = db.query(models.Area).filter_by(id=tribe.area_id).first()
        area_name = area.name

        if area_name not in area_member_counts:
            area_member_counts[area_name] = 0
            area_capacity_totals[area_name] = 0.0
            area_core_counts[area_name] = 0
            area_core_capacity[area_name] = 0.0
            area_subcon_counts[area_name] = 0
            area_subcon_capacity[area_name] = 0.0

        area_member_counts[area_name] += member_count
        area_capacity_totals[area_name] += capacity
        area_core_counts[area_name] += core_count
        area_core_capacity[area_name] += core_capacity
        area_subcon_counts[area_name] += subcon_count
        area_subcon_capacity[area_name] += subcon_capacity

    # Update areas
    for area_name, count in area_member_counts.items():
        area = db.query(models.Area).filter_by(name=area_name).first()
        if area:
            area.member_count = count
            area.total_capacity = round(area_capacity_totals[area_name], 2)
            area.core_count = area_core_counts[area_name]
            area.core_capacity = round(area_core_capacity[area_name], 2)
            area.subcon_count = area_subcon_counts[area_name]
            area.subcon_capacity = round(area_subcon_capacity[area_name], 2)

            logger.info(f"Updated area metrics: {area_name}, "
                        f"members={count} (Core={area.core_count}, "
                        f"Subcon={area.subcon_count}), capacity={round(area.total_capacity, 2)} "
                        f"(Core={round(area.core_capacity, 2)}, Subcon={round(area.subcon_capacity, 2)})")

def update_all_tribe_and_area_counts(db: Session):
    """Recalculate all tribe and area counts from squad data"""
    logger.info("Recalculating all tribe and area counts")

    # Initialize area counts
    areas = {area.id: area for area in db.query(models.Area).all()}
    area_counts = {area_id: {
        'member_count': 0,
        'total_capacity': 0.0,
        'core_count': 0,
        'core_capacity': 0.0,
        'subcon_count': 0,
        'subcon_capacity': 0.0
    } for area_id in areas}

    # Initialize tribe counts
    tribes = {tribe.id: tribe for tribe in db.query(models.Tribe).all()}
    tribe_counts = {tribe_id: {
        'member_count': 0,
        'total_capacity': 0.0,
        'core_count': 0,
        'core_capacity': 0.0,
        'subcon_count': 0,
        'subcon_capacity': 0.0,
        'area_id': tribes[tribe_id].area_id
    } for tribe_id in tribes}

    # Get all squads with their counts
    squads = db.query(models.Squad).all()

    # Sum up squad counts to tribes
    for squad in squads:
        if squad.tribe_id in tribe_counts:
            tribe_counts[squad.tribe_id]['member_count'] += squad.member_count
            tribe_counts[squad.tribe_id]['total_capacity'] += squad.total_capacity
            tribe_counts[squad.tribe_id]['core_count'] += squad.core_count
            tribe_counts[squad.tribe_id]['core_capacity'] += squad.core_capacity
            tribe_counts[squad.tribe_id]['subcon_count'] += squad.subcon_count
            tribe_counts[squad.tribe_id]['subcon_capacity'] += squad.subcon_capacity

    # Update tribe records and sum to areas
    for tribe_id, counts in tribe_counts.items():
        # Update tribe
        tribe = tribes[tribe_id]
        tribe.member_count = counts['member_count']
        tribe.total_capacity = round(counts['total_capacity'], 2)
        tribe.core_count = counts['core_count']
        tribe.core_capacity = round(counts['core_capacity'], 2)
        tribe.subcon_count = counts['subcon_count']
        tribe.subcon_capacity = round(counts['subcon_capacity'], 2)

        # Add to area counts
        area_id = counts['area_id']
        if area_id in area_counts:
            area_counts[area_id]['member_count'] += counts['member_count']
            area_counts[area_id]['total_capacity'] += counts['total_capacity']
            area_counts[area_id]['core_count'] += counts['core_count']
            area_counts[area_id]['core_capacity'] += counts['core_capacity']
            area_counts[area_id]['subcon_count'] += counts['subcon_count']
            area_counts[area_id]['subcon_capacity'] += counts['subcon_capacity']

    # Update area records
    for area_id, counts in area_counts.items():
        area = areas[area_id]
        area.member_count = counts['member_count']
        area.total_capacity = round(counts['total_capacity'], 2)
        area.core_count = counts['core_count']
        area.core_capacity = round(counts['core_capacity'], 2)
        area.subcon_count = counts['subcon_count']
        area.subcon_capacity = round(counts['subcon_capacity'], 2)

    logger.info("All tribe and area metrics have been recalculated")

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Load production data from Excel files into the database')
    parser.add_argument('--file', '-f', type=str, help='Path to the Excel file to load')
    parser.add_argument('--append', '-a', action='store_true', help='Append to existing data instead of replacing')
    parser.add_argument('--files', nargs='+', help='Multiple files to load (space-separated)')
    parser.add_argument('--sheet', '-s', type=str, dest='sheet_name', default="Sheet1",
                        help='Name of the Excel sheet to load (default: "Sheet1")')
    parser.add_argument('--services', action='store_true', help='Load services data from the Excel file')
    parser.add_argument('--run-migrations', action='store_true', help='Run database compatibility migrations before loading data')

    return parser.parse_args()

if __name__ == "__main__":
    args = parse_args()

    # Handle multiple files or single file
    files_to_process = []

    if args.files:
        files_to_process = args.files
    elif args.file:
        files_to_process = [args.file]
    else:
        # No file specified, use default
        default_file = "MSL_FY2526_Build Template_Sales.xlsm"
        if os.path.exists(default_file):
            files_to_process = [default_file]
        else:
            logger.error(f"Default file not found: {default_file}")
            logger.info("Please specify a file with --file or multiple files with --files")
            exit(1)

    # Check if files exist
    for file_path in files_to_process:
        if not os.path.exists(file_path):
            logger.error(f"File not found: {file_path}")
            exit(1)

    # Run database compatibility check if requested
    if args.run_migrations:
        logger.info("Running database compatibility migrations")
        ensure_db_compatibility()

    # Get DB session
    db = SessionLocal()
    try:
        for i, file_path in enumerate(files_to_process):
            # First file uses append mode only if specified
            # Subsequent files always use append mode
            should_append = args.append or i > 0

            if args.services:
                # Load services data
                service_sheet = "Sheet1" if args.sheet_name == "Sheet1" else args.sheet_name
                load_services_data(file_path, db, append_mode=should_append,
                                   sheet_name=service_sheet, run_compatibility_check=False)
            else:
                # Load regular team data
                load_data_from_excel(file_path, db, append_mode=should_append,
                                     sheet_name=args.sheet_name, run_compatibility_check=False)
    finally:
        db.close()
