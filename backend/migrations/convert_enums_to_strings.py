"""
Migration script to convert PostgreSQL enum types to string values
This helps with compatibility across different database engines
"""

import logging
from database import SessionLocal, engine, db_config
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def run_migration():
    """Run the migration to convert enums to strings"""
    if not db_config.is_postgres:
        logger.info("Not running on PostgreSQL, skipping enum conversion")
        return True
        
    logger.info("Starting enum conversion for PostgreSQL")
    
    schema = db_config.schema if db_config.schema else 'public'
    
    try:
        # Connect to the database
        conn = engine.connect()
        
        # Create a list of SQL commands to convert enum types to string values
        commands = [
            # Update team_type in squads table
            f"""
            ALTER TABLE {schema}.squads 
            ALTER COLUMN team_type TYPE VARCHAR
            USING team_type::text
            """,
            
            # Update interaction_mode in dependencies table
            f"""
            ALTER TABLE {schema}.dependencies 
            ALTER COLUMN interaction_mode TYPE VARCHAR
            USING interaction_mode::text
            """,
            
            # Update service_type and status in services table
            f"""
            ALTER TABLE {schema}.services 
            ALTER COLUMN service_type TYPE VARCHAR
            USING service_type::text
            """,
            
            f"""
            ALTER TABLE {schema}.services 
            ALTER COLUMN status TYPE VARCHAR
            USING status::text
            """,
            
            # Update role in users table
            f"""
            ALTER TABLE {schema}.users 
            ALTER COLUMN role TYPE VARCHAR
            USING role::text
            """,
            
            # Update label in areas table
            f"""
            ALTER TABLE {schema}.areas 
            ALTER COLUMN label TYPE VARCHAR
            USING label::text
            """,
            
            # Update label in tribes table
            f"""
            ALTER TABLE {schema}.tribes 
            ALTER COLUMN label TYPE VARCHAR
            USING label::text
            """
        ]
        
        # Execute each command
        for command in commands:
            try:
                conn.execute(sa.text(command))
                logger.info(f"Executed: {command.strip()}")
            except Exception as e:
                # Log the error but continue with other commands
                logger.warning(f"Error executing command: {e}")
                logger.warning(f"Command was: {command.strip()}")
        
        # Ensure all changes are committed
        conn.commit()
        logger.info("Enum conversion completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error running enum conversion: {e}")
        return False

if __name__ == "__main__":
    success = run_migration()
    if success:
        print("Migration completed successfully")
    else:
        print("Migration failed")
