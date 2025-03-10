"""
This script applies the interaction mode migration to the dependencies table.
"""
import sqlite3
import os

def apply_migration():
    """Apply the migration to add interaction_mode and interaction_frequency columns"""
    db_path = "team_portal.db"
    
    print(f"Applying migration to {db_path}...")
    
    try:
        # Connect to the SQLite database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(dependencies)")
        columns = [col[1] for col in cursor.fetchall()]
        
        # Add interaction_mode column if it doesn't exist
        if 'interaction_mode' not in columns:
            print("Adding interaction_mode column to dependencies table")
            cursor.execute("ALTER TABLE dependencies ADD COLUMN interaction_mode VARCHAR DEFAULT 'x_as_a_service'")
        else:
            print("interaction_mode column already exists in dependencies table")
        
        # Add interaction_frequency column if it doesn't exist
        if 'interaction_frequency' not in columns:
            print("Adding interaction_frequency column to dependencies table")
            cursor.execute("ALTER TABLE dependencies ADD COLUMN interaction_frequency VARCHAR")
        else:
            print("interaction_frequency column already exists in dependencies table")
        
        # Commit changes and close connection
        conn.commit()
        conn.close()
        print("Migration completed successfully")
        return True
    except Exception as e:
        print(f"Migration failed: {e}")
        return False

if __name__ == "__main__":
    apply_migration()
