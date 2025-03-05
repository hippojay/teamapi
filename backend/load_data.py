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
    
    # Create a dictionary to track members by email to handle duplicates in different squads
    members_by_email = {}
    
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
        
        # Check if this member already exists (by email)
        email = row['Business Email Address']
        
        if email in members_by_email:
            # Member already exists, add them to the squad through squad_members table
            member = members_by_email[email]
            
            # Add to squad_members table with provided capacity
            db.execute(
                models.squad_members.insert().values(
                    member_id=member.id,
                    squad_id=squad_objects[squad_name].id,
                    capacity=capacity,
                    role=row['template'] if not pd.isna(row['template']) else "Team Member"
                )
            )
            print(f"Added existing member {member.name} to additional squad {squad_name} with capacity {capacity}")
        else:
            # Create new team member
            member = models.TeamMember(
                name=row['Name'],
                email=email,
                role=row['template'] if not pd.isna(row['template']) else "Team Member",
                geography=row['Work Geography'] if 'Work Geography' in row and not pd.isna(row['Work Geography']) else None,
                location=row['Work City'] if 'Work City' in row and not pd.isna(row['Work City']) else None,
                image_url=image_url,
                employment_type=employment_type
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
            
            # Store in dictionary for potential future squad assignments
            members_by_email[email] = member
            print(f"Created new member {member.name} in squad {squad_name} with capacity {capacity}")
        
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
        if random.random() < 0.7:
            # Get this member's squads from squad_members
            member_squads_query = text("""
                SELECT squad_id FROM squad_members WHERE member_id = :member_id
            """)
            member_squads = [row[0] for row in db.execute(member_squads_query, {"member_id": member.id}).fetchall()]
            
            if member_squads:
                # Get potential supervisors from the same squads
                potential_supervisors = []
                for squad_id in member_squads:
                    supervisors_query = text("""
                        SELECT m.id FROM team_members m
                        JOIN squad_members sm ON m.id = sm.member_id
                        WHERE sm.squad_id = :squad_id AND m.id != :member_id
                    """)
                    supervisors = [row[0] for row in db.execute(
                        supervisors_query, 
                        {"squad_id": squad_id, "member_id": member.id}
                    ).fetchall()]
                    potential_supervisors.extend(supervisors)
                
                # If there are potential supervisors in any of the same squads, assign one
                if potential_supervisors:
                    member.supervisor_id = random.choice(potential_supervisors)
                
    # We no longer need to artificially add secondary squad members
    # as we're now loading the actual squad memberships from the data
    
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
        # Get team members for this squad using squad_members association
        members_query = text("""
            SELECT m.id, m.name, m.email 
            FROM team_members m
            JOIN squad_members sm ON m.id = sm.member_id
            WHERE sm.squad_id = :squad_id
        """)
        squad_members = db.execute(members_query, {"squad_id": squad.id}).fetchall()
        
        if len(squad_members) >= 2:
            primary = random.choice(squad_members)
            secondary = random.choice([m for m in squad_members if m[0] != primary[0]])
            
            on_call = models.OnCallRoster(
                squad_id=squad.id,
                primary_name=primary[1],
                primary_contact=primary[2],
                secondary_name=secondary[1],
                secondary_contact=secondary[2]
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
