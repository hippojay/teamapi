import pandas as pd
import os
import argparse
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import SessionLocal, engine, Base
import models
from models import ServiceStatus, DependencyType

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

def load_data_from_excel(file_path: str, db: Session, append_mode: bool = False, sheet_name: str = "Sheet1"):
    """
    Load production data from Excel file into the database
    
    Parameters:
    - file_path: Path to the Excel file
    - db: Database session
    - append_mode: If True, will update existing records rather than creating duplicates
    - sheet_name: Name of the Excel sheet to load (default: "Squad List")
    """
    print(f"Loading production data from {file_path}, sheet: {sheet_name}")
    
    # Read the Excel file
    try:
        df = pd.read_excel(file_path, sheet_name=sheet_name)
        print(f"Successfully read Excel file with {len(df)} rows")
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        return
    
    # Extract unique areas, tribes, and squads
    areas = df['Area'].dropna().unique()
    print(f"Found {len(areas)} areas")
    
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
        
        print(f"Operating in append mode. Found {len(existing_areas)} existing areas, {len(existing_tribes)} existing tribes, {len(existing_squads)} existing squads, and {len(existing_members)} existing team members.")
    else:
        members_by_email = {}
        members_by_name = {}
    
    # Create Areas (or use existing in append mode)
    for area_name in areas:
        if append_mode and area_name in area_objects:
            # Area already exists
            print(f"Using existing area: {area_name} (ID: {area_objects[area_name].id})")
            continue
            
        area = models.Area(
            name=area_name, 
            description=""  # Empty description as per requirements
        )
        db.add(area)
        db.flush()  # Flush to get the ID
        area_objects[area_name] = area
        print(f"Created area: {area_name} (ID: {area.id})")
    
    # Create Tribes (or use existing in append mode)
    tribes_data = df[['Area', 'Tribe']].dropna().drop_duplicates()
    for _, row in tribes_data.iterrows():
        area_name = row['Area']
        tribe_name = row['Tribe']
        
        if area_name not in area_objects:
            print(f"Warning: Area '{area_name}' not found for tribe '{tribe_name}'. Skipping.")
            continue
            
        if append_mode and tribe_name in tribe_objects:
            # Tribe already exists
            print(f"Using existing tribe: {tribe_name} (ID: {tribe_objects[tribe_name].id})")
            continue
        
        tribe = models.Tribe(
            name=tribe_name,
            description="",  # Empty description as per requirements
            area_id=area_objects[area_name].id
        )
        db.add(tribe)
        db.flush()
        tribe_objects[tribe_name] = tribe
        print(f"Created tribe: {tribe_name} (ID: {tribe.id})")
    
    # Create Squads (or use existing in append mode)
    squads_data = df[['Tribe', 'Squad']].dropna().drop_duplicates()
    for _, row in squads_data.iterrows():
        tribe_name = row['Tribe']
        squad_name = row['Squad']
        
        if tribe_name not in tribe_objects:
            print(f"Warning: Tribe '{tribe_name}' not found for squad '{squad_name}'. Skipping.")
            continue
            
        if append_mode and squad_name in squad_objects:
            # Squad already exists
            print(f"Using existing squad: {squad_name} (ID: {squad_objects[squad_name].id})")
            continue
        
        squad = models.Squad(
            name=squad_name,
            description="",  # Empty description as per requirements
            status="Active",  # Default to Active as per requirements
            timezone="UTC",   # Default to UTC as per requirements
            member_count=0,   # Will be updated later
            tribe_id=tribe_objects[tribe_name].id
        )
        db.add(squad)
        db.flush()
        squad_objects[squad_name] = squad
        print(f"Created squad: {squad_name} (ID: {squad.id})")
    
    # Dictionary to track supervisors
    supervisors_by_name = {}
    
    # Create Team Members
    members_data = df[['Squad', 'Name', 'Business Email Address', 'Position', 'Current Phasing', 
                       'Work Geography', 'Work City', 'Regular / Temporary', 'Supervisor Name','Vendor Name']].dropna(subset=['Squad', 'Name', 'Business Email Address'])
    
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
                
        # No random image URL generation for production data
        image_url = None
        
        # Check if this member already exists (by email)
        email = row['Business Email Address']
        name = row['Name']
        
        # Check if member exists in database already
        if email in members_by_email:
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
                    print(f"Updated existing member {member.name}'s capacity in squad {squad_name} to {capacity}")
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
                print(f"Added existing member {member.name} to additional squad {squad_name} with capacity {capacity}")
                
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
                geography=row['Work Geography'] if 'Work Geography' in row and not pd.isna(row['Work Geography']) else None,
                location=row['Work City'] if 'Work City' in row and not pd.isna(row['Work City']) else None,
                image_url=image_url,
                employment_type=employment_type,
                vendor_name=vendor_name if employment_type == "subcon" else None,
                is_external=False  # Regular team member
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
            print(f"Created new member {member.name} in squad {squad_name} with capacity {capacity}")
            
            # Update counts
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
        print(f"Created external supervisor: {supervisor_name}")
    
    # Now set supervisor relationships based on the Supervisor Name field
    for _, row in members_data.iterrows():
        if pd.isna(row['Supervisor Name']):
            continue
            
        member_email = row['Business Email Address']
        supervisor_name = row['Supervisor Name']
        
        if member_email in members_by_email and supervisor_name in supervisors_by_name:
            member = members_by_email[member_email]
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
            print(f"Updated squad '{squad_name}' with {squad.member_count} members (Core: {squad.core_count}, Subcon: {squad.subcon_count}) and total capacity of {squad.total_capacity:.2f} FTE (Core: {squad.core_capacity:.2f}, Subcon: {squad.subcon_capacity:.2f})")
    
    # Update tribe and area counts and capacities
    if append_mode:
        # Recalculate all tribe and area counts to ensure correctness
        update_all_tribe_and_area_counts(db)
    else:
        # Calculate tribe totals for just the tribes in this file
        calculate_tribe_and_area_counts(db, list(tribe_objects.values()))
    
    # Commit all changes
    db.commit()
    print(f"Database successfully updated with data from {file_path}!")

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
        
        print(f"Updated tribe '{tribe.name}' with {member_count} members (Core: {core_count}, Subcon: {subcon_count}) and total capacity of {capacity:.2f} FTE (Core: {core_capacity:.2f}, Subcon: {subcon_capacity:.2f})")
        
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
            
            print(f"Updated area '{area_name}' with {count} members (Core: {area.core_count}, Subcon: {area.subcon_count}) and total capacity of {area.total_capacity:.2f} FTE (Core: {area.core_capacity:.2f}, Subcon: {area.subcon_capacity:.2f})")

def update_all_tribe_and_area_counts(db: Session):
    """Recalculate all tribe and area counts from squad data"""
    print("Recalculating all tribe and area counts...")
    
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
    
    print("All tribe and area counts have been recalculated.")

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Load production data from Excel files into the database')
    parser.add_argument('--file', '-f', type=str, help='Path to the Excel file to load')
    parser.add_argument('--append', '-a', action='store_true', help='Append to existing data instead of replacing')
    parser.add_argument('--files', nargs='+', help='Multiple files to load (space-separated)')
    parser.add_argument('--sheet', '-s', type=str, dest='sheet_name', default="Sheet1", 
                        help='Name of the Excel sheet to load (default: "Sheet1")')
    
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
            print(f"Error: Default file not found: {default_file}")
            print("Please specify a file with --file or multiple files with --files")
            exit(1)
    
    # Check if files exist
    for file_path in files_to_process:
        if not os.path.exists(file_path):
            print(f"Error: File not found: {file_path}")
            exit(1)
    
    # Get DB session
    db = SessionLocal()
    try:
        for i, file_path in enumerate(files_to_process):
            # First file uses append mode only if specified
            # Subsequent files always use append mode
            should_append = args.append or i > 0
            load_data_from_excel(file_path, db, append_mode=should_append, sheet_name=args.sheet_name)
    finally:
        db.close()