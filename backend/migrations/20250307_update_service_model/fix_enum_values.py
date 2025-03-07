"""
Migration script to fix enum values in the service table.
"""

from sqlalchemy import create_engine, text
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

def run_migration():
    from database import DATABASE_URL
    
    # Create engine connection
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Begin transaction
        trans = conn.begin()
        
        try:
            # Fix service_status values - from lowercase to uppercase
            conn.execute(text("""
                UPDATE services SET status = 'HEALTHY' WHERE status = 'healthy';
                UPDATE services SET status = 'DEGRADED' WHERE status = 'degraded';
                UPDATE services SET status = 'DOWN' WHERE status = 'down';
            """))
            print("Fixed status enum values in services table")
            
            # Fix service_type values - from lowercase to uppercase and handle different naming
            conn.execute(text("""
                UPDATE services SET service_type = 'API' WHERE service_type = 'api';
                UPDATE services SET service_type = 'REPO' WHERE service_type = 'repository';
                UPDATE services SET service_type = 'PLATFORM' WHERE service_type = 'platform';
                UPDATE services SET service_type = 'WEBPAGE' WHERE service_type = 'webpage';
                UPDATE services SET service_type = 'APP_MODULE' WHERE service_type = 'app_module';
            """))
            print("Fixed service_type enum values in services table")
            
            # Commit transaction
            trans.commit()
            print("Migration completed successfully")
            
        except Exception as e:
            # Rollback in case of error
            trans.rollback()
            print(f"Error during migration: {e}")
            raise

if __name__ == "__main__":
    run_migration()
