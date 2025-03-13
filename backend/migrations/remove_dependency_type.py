import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL

def run_migration():
    """
    Remove the dependency_type column from the dependencies table
    """
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    with engine.connect() as connection:
        # Create a temporary table without the dependency_type column
        connection.execute(text("""
        CREATE TABLE dependencies_new (
            id INTEGER PRIMARY KEY,
            dependent_squad_id INTEGER,
            dependency_squad_id INTEGER,
            dependency_name TEXT,
            interaction_mode TEXT,
            interaction_frequency TEXT,
            FOREIGN KEY (dependent_squad_id) REFERENCES squads (id),
            FOREIGN KEY (dependency_squad_id) REFERENCES squads (id)
        )
        """))
        
        # Copy data to the new table, excluding the dependency_type column
        connection.execute(text("""
        INSERT INTO dependencies_new (id, dependent_squad_id, dependency_squad_id, dependency_name, interaction_mode, interaction_frequency)
        SELECT id, dependent_squad_id, dependency_squad_id, dependency_name, interaction_mode, interaction_frequency FROM dependencies
        """))
        
        # Drop the old table
        connection.execute(text("DROP TABLE dependencies"))
        
        # Rename the new table to the original name
        connection.execute(text("ALTER TABLE dependencies_new RENAME TO dependencies"))
        
        # Commit the transaction
        connection.commit()
    
    print("Migration completed: Removed dependency_type column from dependencies table")

if __name__ == "__main__":
    run_migration()
