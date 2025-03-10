"""Add interaction mode to dependencies

Adds interaction_mode and interaction_frequency columns to the dependencies table
"""

import sqlite3
import logging

db_path = "team_portal.db"
logger = logging.getLogger(__name__)

def migrate():
    """Apply the migration"""
    try:
        # Connect to the SQLite database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(dependencies)")
        columns = [col[1] for col in cursor.fetchall()]
        
        # Add interaction_mode column if it doesn't exist
        if 'interaction_mode' not in columns:
            logger.info("Adding interaction_mode column to dependencies table")
            cursor.execute("ALTER TABLE dependencies ADD COLUMN interaction_mode VARCHAR DEFAULT 'x_as_a_service'")
        else:
            logger.info("interaction_mode column already exists in dependencies table")
        
        # Add interaction_frequency column if it doesn't exist
        if 'interaction_frequency' not in columns:
            logger.info("Adding interaction_frequency column to dependencies table")
            cursor.execute("ALTER TABLE dependencies ADD COLUMN interaction_frequency VARCHAR")
        else:
            logger.info("interaction_frequency column already exists in dependencies table")
        
        # Commit changes and close connection
        conn.commit()
        conn.close()
        logger.info("Migration completed successfully")
        return True
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        return False
