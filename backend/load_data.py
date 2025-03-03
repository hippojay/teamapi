import pandas as pd
import os
import random
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from database import SessionLocal, engine, Base
import models
from models import ServiceStatus, DependencyType

# Create tables
Base.metadata.create_all(bind=engine)

def load_data_from_excel(file_path: str, db: Session):
    """Load data from Excel file into the database"""
    print(f"Loading data from {file_path}")
    
    # Read the Excel file
    try:
        df = pd.read_excel(file_path)
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
    
    # Create Areas
    for area_name in areas:
        area = models.Area(name=area_name, description=f"Area responsible for {area_name}")
        db.add(area)
        db.flush()  # Flush to get the ID
        area_objects[area_name] = area
        print(f"Created area: {area_name} (ID: {area.id})")
    
    # Create Tribes
    tribes_data = df[['Area', 'Tribe']].dropna().drop_duplicates()
    for _, row in tribes_data.iterrows():
        area_name = row['Area']
        tribe_name = row['Tribe']
        
        if area_name in area_objects and tribe_name not in tribe_objects:
            tribe = models.Tribe(
                name=tribe_name,
                description=f"Tribe focused on {tribe_name}",
                area_id=area_objects[area_name].id
            )
            db.add(tribe)
            db.flush()
            tribe_objects[tribe_name] = tribe
            print(f"Created tribe: {tribe_name} (ID: {tribe.id})")
    
    # Create Squads
    squads_data = df[['Tribe', 'Squad']].dropna().drop_duplicates()
    for _, row in squads_data.iterrows():
        tribe_name = row['Tribe']
        squad_name = row['Squad']
        
        if tribe_name in tribe_objects and squad_name not in squad_objects:
            # Generate a random timezone
            timezones = ["UTC", "CET", "EST", "PST", "IST", "JST"]
            status_options = ["Active", "Forming", "Disbanded"]
            
            squad = models.Squad(
                name=squad_name,
                description=f"Squad working on {squad_name}",
                status=random.choice(status_options),
                timezone=random.choice(timezones),
                member_count=0,  # Will be updated later
                tribe_id=tribe_objects[tribe_name].id
            )
            db.add(squad)
            db.flush()
            squad_objects[squad_name] = squad
            print(f"Created squad: {squad_name} (ID: {squad.id})")
    
    # Create Team Members
    members_data = df[['Squad', 'Name', 'Business Email Address', 'template', 'Current Months Allocation', 'Work Geography', 'Work City', 'Regular / Temporary']].dropna(subset=['Squad', 'Name', 'Business Email Address'])
    
    # Initialize tracking dictionaries for counts and capacities
    squad_member_counts = {}
    squad_capacity_totals = {}
    squad_core_counts = {}
    squad_core_capacity = {}
    squad_subcon_counts = {}
    squad_subcon_capacity = {}
    
    for _, row in members_data.iterrows():
        squad_name = row['Squad']
        if pd.isna(squad_name) or squad_name not in squad_objects:
            continue
            
        # Initialize count and capacity for this squad if not already done
        if squad_name not in squad_member_counts:
            squad_member_counts[squad_name] = 0
            squad_capacity_totals[squad_name] = 0.0
            squad_core_counts[squad_name] = 0
            squad_core_capacity[squad_name] = 0.0
            squad_subcon_counts[squad_name] = 0
            squad_subcon_capacity[squad_name] = 0.0
            
        # Extract capacity from Current Months Allocation
        capacity = 1.0  # Default to 100% if not specified
        if 'Current Months Allocation' in row and not pd.isna(row['Current Months Allocation']):
            capacity = float(row['Current Months Allocation'])
        
        # Determine employment type based on 'Regular / Temporary' field
        employment_type = "core"  # Default
        if 'Regular / Temporary' in row and not pd.isna(row['Regular / Temporary']):
            if row['Regular / Temporary'].lower() == "regular":
                employment_type = "core"
                squad_core_counts[squad_name] += 1
                squad_core_capacity[squad_name] += capacity
            else:  # Anything else is considered a contractor ("Contingent", etc.)
                employment_type = "subcon"
                squad_subcon_counts[squad_name] += 1
                squad_subcon_capacity[squad_name] += capacity
            
        # Create a user avatar URL for some users (randomly)
        image_url = None
        if random.random() < 0.3:  # 30% chance of having an avatar
            gender = random.choice(['men', 'women'])
            avatar_id = random.randint(1, 99)
            image_url = f"https://randomuser.me/api/portraits/{gender}/{avatar_id}.jpg"
            
        # Increment counter and total capacity
        squad_member_counts[squad_name] += 1
        squad_capacity_totals[squad_name] += capacity
            
        member = models.TeamMember(
            name=row['Name'],
            email=row['Business Email Address'],
            role=row['template'] if not pd.isna(row['template']) else "Team Member",
            geography=row['Work Geography'] if 'Work Geography' in row and not pd.isna(row['Work Geography']) else None,
            location=row['Work City'] if 'Work City' in row and not pd.isna(row['Work City']) else None,
            squad_id=squad_objects[squad_name].id,
            capacity=capacity,
            image_url=image_url,
            employment_type=employment_type
        )
        db.add(member)
        
    # Make sure to commit team members before counting
    db.flush()
    
    # Update member counts and total capacity directly
    for squad_name, count in squad_member_counts.items():
        squad = squad_objects[squad_name]
        squad.member_count = count
        squad.total_capacity = round(squad_capacity_totals.get(squad_name, 0.0), 2)
        squad.core_count = squad_core_counts.get(squad_name, 0)
        squad.core_capacity = round(squad_core_capacity.get(squad_name, 0.0), 2)
        squad.subcon_count = squad_subcon_counts.get(squad_name, 0)
        squad.subcon_capacity = round(squad_subcon_capacity.get(squad_name, 0.0), 2)
        print(f"Updated squad '{squad_name}' with {count} members (Core: {squad.core_count}, Subcon: {squad.subcon_count}) and total capacity of {squad.total_capacity:.2f} FTE (Core: {squad.core_capacity:.2f}, Subcon: {squad.subcon_capacity:.2f})")
    
    # Update tribe and area counts and capacities
    tribe_member_counts = {}
    tribe_capacity_totals = {}
    tribe_core_counts = {}
    tribe_core_capacity = {}
    tribe_subcon_counts = {}
    tribe_subcon_capacity = {}
    
    area_member_counts = {}
    area_capacity_totals = {}
    area_core_counts = {}
    area_core_capacity = {}
    area_subcon_counts = {}
    area_subcon_capacity = {}
    
    # Calculate tribe totals
    for tribe_name, tribe in tribe_objects.items():
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
        
        tribe_member_counts[tribe_name] = member_count
        tribe_capacity_totals[tribe_name] = capacity
        tribe_core_counts[tribe_name] = core_count
        tribe_core_capacity[tribe_name] = core_capacity
        tribe_subcon_counts[tribe_name] = subcon_count
        tribe_subcon_capacity[tribe_name] = subcon_capacity
        
        print(f"Updated tribe '{tribe_name}' with {member_count} members (Core: {core_count}, Subcon: {subcon_count}) and total capacity of {capacity:.2f} FTE (Core: {core_capacity:.2f}, Subcon: {subcon_capacity:.2f})")
        
        # Add to area counts
        area_name = area_objects[tribe.area.name].name
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
    
    # Update area counts
    for area_name, area in area_objects.items():
        area.member_count = area_member_counts.get(area_name, 0)
        area.total_capacity = round(area_capacity_totals.get(area_name, 0.0), 2)
        area.core_count = area_core_counts.get(area_name, 0)
        area.core_capacity = round(area_core_capacity.get(area_name, 0.0), 2)
        area.subcon_count = area_subcon_counts.get(area_name, 0)
        area.subcon_capacity = round(area_subcon_capacity.get(area_name, 0.0), 2)
        
        print(f"Updated area '{area_name}' with {area.member_count} members (Core: {area.core_count}, Subcon: {area.subcon_count}) and total capacity of {area.total_capacity:.2f} FTE (Core: {area.core_capacity:.2f}, Subcon: {area.subcon_capacity:.2f})")
    
    # Add supervisor relationships
    members = db.query(models.TeamMember).all()
    for member in members:
        # 70% chance of having a supervisor from the same squad
        if random.random() < 0.7 and member.squad_id:
            potential_supervisors = [
                m for m in members
                if m.id != member.id and m.squad_id == member.squad_id
            ]
            
            # If there are potential supervisors in the same squad, assign one
            if potential_supervisors:
                member.supervisor_id = random.choice(potential_supervisors).id
                
    # Add squad_members table entries
    # Check if the squad_members table exists
    inspector = inspect(engine)
    if 'squad_members' in inspector.get_table_names():
        print("Populating squad_members table for multi-squad membership...")
        # For some members (20%), add a secondary squad membership
        for member in random.sample(members, int(len(members) * 0.2)):
            # Find a different squad for secondary membership
            if member.squad_id:
                other_squads = [
                    s for s in squad_objects.values()
                    if s.id != member.squad_id
                ]
                
                if other_squads:
                    secondary_squad = random.choice(other_squads)
                    # Add to squad_members with a partial capacity
                    secondary_capacity = round(random.uniform(0.1, 0.5), 2)  # 10-50% allocation
                    
                    # Create association - using SQLAlchemy text() for proper SQL execution
                    stmt = text(f"INSERT INTO squad_members (member_id, squad_id, capacity, role) "
                             f"VALUES ({member.id}, {secondary_squad.id}, {secondary_capacity}, '{member.role}')")
                    db.execute(stmt)
                    
                    # Also add their primary squad
                    stmt = text(f"INSERT INTO squad_members (member_id, squad_id, capacity, role) "
                             f"VALUES ({member.id}, {member.squad_id}, {member.capacity}, '{member.role}')")
                    db.execute(stmt)
                    
                    print(f"Added user {member.name} to secondary squad {secondary_squad.name} with {secondary_capacity*100:.0f}% capacity")
    
    # Generate Services (sample data)
    for squad_name, squad in squad_objects.items():
        # Create 1-3 services per squad
        for i in range(random.randint(1, 3)):
            service_name = f"{squad_name.replace(' ', '')}Service{i+1}"
            status_options = [ServiceStatus.HEALTHY, ServiceStatus.DEGRADED, ServiceStatus.DOWN]
            weights = [0.7, 0.25, 0.05]  # 70% healthy, 25% degraded, 5% down
            
            service = models.Service(
                name=service_name,
                description=f"Service for {service_name}",
                status=random.choices(status_options, weights=weights)[0],
                uptime=round(random.uniform(99.0, 99.99), 2),
                version=f"{random.randint(1,3)}.{random.randint(0,9)}.{random.randint(0,9)}",
                api_docs_url=f"https://api-docs.example.com/{service_name.lower()}",
                squad_id=squad.id
            )
            db.add(service)
    
    # Generate Dependencies (sample data)
    all_squads = list(squad_objects.values())
    for squad in all_squads:
        # Create 1-3 dependencies per squad
        for _ in range(random.randint(1, 3)):
            # Randomly select another squad as a dependency
            dependency_squad = random.choice(all_squads)
            if dependency_squad.id != squad.id:  # Avoid self-dependency
                dependency = models.Dependency(
                    dependent_squad_id=squad.id,
                    dependency_squad_id=dependency_squad.id,
                    dependency_name=dependency_squad.name,
                    dependency_type=random.choice(list(DependencyType))
                )
                db.add(dependency)
    
    # Generate On-Call Rosters (sample data)
    for squad in all_squads:
        # Get some team members from the squad
        members = db.query(models.TeamMember).filter_by(squad_id=squad.id).all()
        if len(members) >= 2:
            primary = random.choice(members)
            secondary = random.choice([m for m in members if m.id != primary.id])
            
            on_call = models.OnCallRoster(
                squad_id=squad.id,
                primary_name=primary.name,
                primary_contact=primary.email,
                secondary_name=secondary.name,
                secondary_contact=secondary.email
            )
            db.add(on_call)
    
    # Commit all changes
    db.commit()
    print("Database populated successfully!")

if __name__ == "__main__":
    # Check if Excel file exists
    file_path = "dummy_test_people_data.xlsb.xlsx"
    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}")
    else:
        # Get DB session
        db = SessionLocal()
        try:
            load_data_from_excel(file_path, db)
        finally:
            db.close()
