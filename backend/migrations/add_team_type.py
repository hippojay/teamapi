import sys
import os

# Add parent directory to path to import database and models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal, engine
from sqlalchemy import text
import random
from models import TeamType

def migrate():
    """Add team_type column to squads table and assign random team types to existing squads"""
    db = SessionLocal()
    try:
        print("Starting migration to add team_type to squads table...")
        
        # Check if the column already exists
        try:
            db.execute(text("SELECT team_type FROM squads LIMIT 1"))
            print("team_type column already exists in squads table. Skipping column creation.")
        except Exception:
            # Column doesn't exist, add it
            print("Adding team_type column to squads table...")
            db.execute(
                text("""
                ALTER TABLE squads 
                ADD COLUMN team_type VARCHAR DEFAULT 'stream_aligned'
                """)
            )
            print("Column added successfully.")
        
        # Update existing squads with random team types
        # In a real scenario, you'd likely do this more thoughtfully based on actual team responsibilities
        print("Updating existing squads with team types...")
        
        # Get all existing squads
        squads = db.execute(text("SELECT id, name FROM squads")).fetchall()
        
        # Weight distribution for different team types
        # Most teams are stream-aligned in a typical organization
        team_types = [
            TeamType.STREAM_ALIGNED.value,
            TeamType.PLATFORM.value,
            TeamType.ENABLING.value,
            TeamType.COMPLICATED_SUBSYSTEM.value
        ]
        weights = [0.7, 0.15, 0.1, 0.05]  # 70% stream-aligned, 15% platform, 10% enabling, 5% complicated-subsystem
        
        for squad in squads:
            team_type = random.choices(team_types, weights=weights)[0]
            db.execute(
                text("UPDATE squads SET team_type = :team_type WHERE id = :squad_id"),
                {"team_type": team_type, "squad_id": squad[0]}
            )
            print(f"Updated squad '{squad[1]}' (ID: {squad[0]}) with team_type: {team_type}")
        
        db.commit()
        print("Migration completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error during migration: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
