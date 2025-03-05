"""
Migration script to update the database to use the many-to-many relationship
between team members and squads.

This script:
1. Creates the squad_members table if it doesn't exist
2. Copies relationships from the existing team_member.squad_id to squad_members
3. Updates the counts and capacities for squads
"""

import os
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import models

def migrate_to_many_to_many(db: Session):
    """Migrate from the legacy one-to-many to many-to-many relationship."""
    
    inspector = inspect(engine)
    
    # Check if the squad_members table exists
    if 'squad_members' not in inspector.get_table_names():
        print("Creating squad_members table...")
        # Create the squad_members table
        models.Base.metadata.tables['squad_members'].create(bind=engine)
        print("squad_members table created.")
    
    # Check if there are existing team members with squad_id set
    members_with_squad = db.query(models.TeamMember).filter(models.TeamMember.squad_id.isnot(None)).all()
    print(f"Found {len(members_with_squad)} team members with squad_id set.")
    
    if members_with_squad:
        print("Migrating existing squad relationships to squad_members table...")
        
        # For each member with a squad_id, create a record in squad_members
        for member in members_with_squad:
            # Check if there's already an entry in squad_members
            existing = db.execute(text(
                "SELECT 1 FROM squad_members WHERE member_id = :member_id AND squad_id = :squad_id"
            ), {"member_id": member.id, "squad_id": member.squad_id}).fetchone()
            
            if not existing:
                # Create the squad_members entry
                db.execute(
                    models.squad_members.insert().values(
                        member_id=member.id,
                        squad_id=member.squad_id,
                        capacity=member.capacity,
                        role=member.role
                    )
                )
                print(f"Migrated member {member.name} to squad {member.squad_id} with capacity {member.capacity}")
        
        # Commit the changes
        db.commit()
        print("Migration of squad relationships complete.")
    
    # Update squad counts based on squad_members table
    print("Updating squad member counts and capacities...")
    
    # Get all squads
    squads = db.query(models.Squad).all()
    
    for squad in squads:
        # Get members from squad_members table
        members_query = text("""
            SELECT 
                m.id, 
                m.employment_type, 
                sm.capacity 
            FROM team_members m
            JOIN squad_members sm ON m.id = sm.member_id
            WHERE sm.squad_id = :squad_id
        """)
        
        members = db.execute(members_query, {"squad_id": squad.id}).fetchall()
        
        # Calculate counts and capacities
        member_count = len(members)
        
        core_count = 0
        core_capacity = 0.0
        subcon_count = 0
        subcon_capacity = 0.0
        total_capacity = 0.0
        
        for member in members:
            capacity = float(member[2]) if member[2] is not None else 1.0
            total_capacity += capacity
            
            if member[1] == 'core':
                core_count += 1
                core_capacity += capacity
            else:
                subcon_count += 1
                subcon_capacity += capacity
        
        # Update the squad
        squad.member_count = member_count
        squad.total_capacity = round(total_capacity, 2)
        squad.core_count = core_count
        squad.core_capacity = round(core_capacity, 2)
        squad.subcon_count = subcon_count
        squad.subcon_capacity = round(subcon_capacity, 2)
        
        print(f"Updated squad '{squad.name}' with {member_count} members (Core: {core_count}, Subcon: {subcon_count}) "
              f"and total capacity of {total_capacity:.2f} FTE")
    
    # Commit the changes
    db.commit()
    print("Squad counts and capacities updated.")
    print("Migration complete!")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        migrate_to_many_to_many(db)
    finally:
        db.close()
