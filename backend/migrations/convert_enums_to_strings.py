import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
import logging
from database import get_db_config

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def run_migration():
    """
    Convert PostgreSQL native enum types to string columns.
    
    This migration is needed due to issues with PostgreSQL enum handling across schemas.
    We'll convert enum columns to use string values instead of PostgreSQL ENUM types.
    """
    # Get database config
    db_config = get_db_config()
    engine = db_config.create_engine()
    
    # Only run this for PostgreSQL
    if not db_config.is_postgres:
        logger.info("Skipping enum conversion for non-PostgreSQL database")
        return True
    
    logger.info("Running migration to convert PostgreSQL enums to strings")
    
    # Set the schema to use
    schema = db_config.schema or "who_what_where"
    
    with engine.begin() as conn:
        try:
            # Set the search path to include our schema
            conn.execute(text(f"SET search_path TO {schema}, public"))
            
            # Step 1: Check if teamtype enum exists
            result = conn.execute(text(f"""
                SELECT typname FROM pg_type t
                JOIN pg_namespace n ON t.typnamespace = n.oid
                WHERE t.typname = 'teamtype' AND n.nspname = '{schema}'
            """)).fetchone()
            
            has_teamtype_enum = result is not None
            logger.info(f"TeamType enum exists: {has_teamtype_enum}")
            
            if has_teamtype_enum:
                # Step 2: Alter the column to use text instead of enum
                # First, create a temporary column
                logger.info("Creating temporary string column")
                conn.execute(text(f"""
                    ALTER TABLE {schema}.squads 
                    ADD COLUMN team_type_text TEXT NULL
                """))
                
                # Copy data from enum column to text column
                logger.info("Copying data from enum to string")
                conn.execute(text(f"""
                    UPDATE {schema}.squads 
                    SET team_type_text = team_type::text
                """))
                
                # Drop the enum column
                logger.info("Dropping enum column")
                conn.execute(text(f"""
                    ALTER TABLE {schema}.squads
                    DROP COLUMN team_type
                """))
                
                # Rename text column to original name
                logger.info("Renaming string column to original name")
                conn.execute(text(f"""
                    ALTER TABLE {schema}.squads
                    RENAME COLUMN team_type_text TO team_type
                """))
                
                # Set default value
                conn.execute(text(f"""
                    ALTER TABLE {schema}.squads
                    ALTER COLUMN team_type 
                    SET DEFAULT 'STREAM_ALIGNED'
                """))
                
                logger.info("TeamType enum conversion completed successfully")
            
            # Step 3: Check if servicestatus enum exists
            result = conn.execute(text(f"""
                SELECT typname FROM pg_type t
                JOIN pg_namespace n ON t.typnamespace = n.oid
                WHERE t.typname = 'servicestatus' AND n.nspname = '{schema}'
            """)).fetchone()
            
            has_servicestatus_enum = result is not None
            logger.info(f"ServiceStatus enum exists: {has_servicestatus_enum}")
            
            if has_servicestatus_enum:
                # Convert the servicestatus enum to string
                logger.info("Creating temporary string column for service status")
                conn.execute(text(f"""
                    ALTER TABLE {schema}.services 
                    ADD COLUMN status_text TEXT NULL
                """))
                
                # Copy data
                logger.info("Copying data from enum to string")
                conn.execute(text(f"""
                    UPDATE {schema}.services 
                    SET status_text = status::text
                """))
                
                # Drop enum column
                logger.info("Dropping enum column")
                conn.execute(text(f"""
                    ALTER TABLE {schema}.services
                    DROP COLUMN status
                """))
                
                # Rename text column
                logger.info("Renaming string column to original name")
                conn.execute(text(f"""
                    ALTER TABLE {schema}.services
                    RENAME COLUMN status_text TO status
                """))
                
                # Set default
                conn.execute(text(f"""
                    ALTER TABLE {schema}.services
                    ALTER COLUMN status 
                    SET DEFAULT 'HEALTHY'
                """))
                
                logger.info("ServiceStatus enum conversion completed successfully")
            
            # Step 4: Check if interactionmode enum exists
            result = conn.execute(text(f"""
                SELECT typname FROM pg_type t
                JOIN pg_namespace n ON t.typnamespace = n.oid
                WHERE t.typname = 'interactionmode' AND n.nspname = '{schema}'
            """)).fetchone()
            
            has_interactionmode_enum = result is not None
            logger.info(f"InteractionMode enum exists: {has_interactionmode_enum}")
            
            if has_interactionmode_enum:
                # Convert the interactionmode enum to string
                logger.info("Creating temporary string column for interaction mode")
                conn.execute(text(f"""
                    ALTER TABLE {schema}.dependencies 
                    ADD COLUMN interaction_mode_text TEXT NULL
                """))
                
                # Copy data
                logger.info("Copying data from enum to string")
                conn.execute(text(f"""
                    UPDATE {schema}.dependencies 
                    SET interaction_mode_text = interaction_mode::text
                """))
                
                # Drop enum column
                logger.info("Dropping enum column")
                conn.execute(text(f"""
                    ALTER TABLE {schema}.dependencies
                    DROP COLUMN interaction_mode
                """))
                
                # Rename text column
                logger.info("Renaming string column to original name")
                conn.execute(text(f"""
                    ALTER TABLE {schema}.dependencies
                    RENAME COLUMN interaction_mode_text TO interaction_mode
                """))
                
                # Set default
                conn.execute(text(f"""
                    ALTER TABLE {schema}.dependencies
                    ALTER COLUMN interaction_mode 
                    SET DEFAULT 'X_AS_A_SERVICE'
                """))
                
                logger.info("InteractionMode enum conversion completed successfully")

            # Step 5: Check if arealabel enum exists
            result = conn.execute(text(f"""
                SELECT typname FROM pg_type t
                JOIN pg_namespace n ON t.typnamespace = n.oid
                WHERE t.typname = 'arealabel' AND n.nspname = '{schema}'
            """)).fetchone()
            
            has_arealabel_enum = result is not None
            logger.info(f"AreaLabel enum exists: {has_arealabel_enum}")
            
            if has_arealabel_enum:
                # Convert the arealabel enum to string
                logger.info("Creating temporary string column for area label")
                conn.execute(text(f"""
                    ALTER TABLE {schema}.areas 
                    ADD COLUMN label_text TEXT NULL
                """))
                
                # Copy data
                logger.info("Copying data from enum to string")
                conn.execute(text(f"""
                    UPDATE {schema}.areas 
                    SET label_text = label::text
                """))
                
                # Drop enum column
                logger.info("Dropping enum column")
                conn.execute(text(f"""
                    ALTER TABLE {schema}.areas
                    DROP COLUMN label
                """))
                
                # Rename text column
                logger.info("Renaming string column to original name")
                conn.execute(text(f"""
                    ALTER TABLE {schema}.areas
                    RENAME COLUMN label_text TO label
                """))
                
                logger.info("AreaLabel enum conversion completed successfully")
                
            # Step 6: Check if tribelabel enum exists
            result = conn.execute(text(f"""
                SELECT typname FROM pg_type t
                JOIN pg_namespace n ON t.typnamespace = n.oid
                WHERE t.typname = 'tribelabel' AND n.nspname = '{schema}'
            """)).fetchone()
            
            has_tribelabel_enum = result is not None
            logger.info(f"TribeLabel enum exists: {has_tribelabel_enum}")
            
            if has_tribelabel_enum:
                # Convert the tribelabel enum to string
                logger.info("Creating temporary string column for tribe label")
                conn.execute(text(f"""
                    ALTER TABLE {schema}.tribes 
                    ADD COLUMN label_text TEXT NULL
                """))
                
                # Copy data
                logger.info("Copying data from enum to string")
                conn.execute(text(f"""
                    UPDATE {schema}.tribes 
                    SET label_text = label::text
                """))
                
                # Drop enum column
                logger.info("Dropping enum column")
                conn.execute(text(f"""
                    ALTER TABLE {schema}.tribes
                    DROP COLUMN label
                """))
                
                # Rename text column
                logger.info("Renaming string column to original name")
                conn.execute(text(f"""
                    ALTER TABLE {schema}.tribes
                    RENAME COLUMN label_text TO label
                """))
                
                logger.info("TribeLabel enum conversion completed successfully")
                
            # Step 7: Check if servicetype enum exists
            result = conn.execute(text(f"""
                SELECT typname FROM pg_type t
                JOIN pg_namespace n ON t.typnamespace = n.oid
                WHERE t.typname = 'servicetype' AND n.nspname = '{schema}'
            """)).fetchone()
            
            has_servicetype_enum = result is not None
            logger.info(f"ServiceType enum exists: {has_servicetype_enum}")
            
            if has_servicetype_enum:
                # Convert the servicetype enum to string
                logger.info("Creating temporary string column for service type")
                conn.execute(text(f"""
                    ALTER TABLE {schema}.services 
                    ADD COLUMN service_type_text TEXT NULL
                """))
                
                # Copy data
                logger.info("Copying data from enum to string")
                conn.execute(text(f"""
                    UPDATE {schema}.services 
                    SET service_type_text = service_type::text
                """))
                
                # Drop enum column
                logger.info("Dropping enum column")
                conn.execute(text(f"""
                    ALTER TABLE {schema}.services
                    DROP COLUMN service_type
                """))
                
                # Rename text column
                logger.info("Renaming string column to original name")
                conn.execute(text(f"""
                    ALTER TABLE {schema}.services
                    RENAME COLUMN service_type_text TO service_type
                """))
                
                # Set default
                conn.execute(text(f"""
                    ALTER TABLE {schema}.services
                    ALTER COLUMN service_type 
                    SET DEFAULT 'API'
                """))
                
                logger.info("ServiceType enum conversion completed successfully")
                
            # Step 8: Check if userrole enum exists
            result = conn.execute(text(f"""
                SELECT typname FROM pg_type t
                JOIN pg_namespace n ON t.typnamespace = n.oid
                WHERE t.typname = 'userrole' AND n.nspname = '{schema}'
            """)).fetchone()
            
            has_userrole_enum = result is not None
            logger.info(f"UserRole enum exists: {has_userrole_enum}")
            
            if has_userrole_enum:
                # The users.role column is already string type, so we only need to deal with
                # any existing userrole enum type
                
                # Drop the enum type if it exists and is not being used
                try:
                    conn.execute(text(f"""
                        DROP TYPE IF EXISTS {schema}.userrole;
                    """))
                    logger.info("Dropped UserRole enum type")
                except Exception as e:
                    logger.warning(f"Could not drop UserRole enum type (might be in use): {e}")
                    
            # Finally, try to drop any remaining unused enum types
            for enum_name in ["teamtype", "servicestatus", "interactionmode", "arealabel", "tribelabel", "servicetype"]:
                try:
                    conn.execute(text(f"""
                        DROP TYPE IF EXISTS {schema}.{enum_name};
                    """))
                    logger.info(f"Dropped unused enum type: {enum_name}")
                except Exception as e:
                    logger.warning(f"Could not drop enum type {enum_name}: {e}")
            
            logger.info("Enum conversion migration completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error during enum conversion: {e}")
            return False

if __name__ == "__main__":
    success = run_migration()
    if success:
        print("Migration completed successfully!")
    else:
        print("Migration failed. Check logs for details.")
        sys.exit(1)
