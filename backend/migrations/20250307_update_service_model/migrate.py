"""
Migration script to update the Service model with service_type and url fields.
This adds support for different types of services like APIs, repositories, web pages, etc.
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
        # Check if service_type column already exists
        result = conn.execute(text("""
            SELECT COUNT(*) as count FROM pragma_table_info('services') 
            WHERE name = 'service_type'
        """))
        has_service_type = result.fetchone()[0] > 0
        
        # Check if url column already exists
        result = conn.execute(text("""
            SELECT COUNT(*) as count FROM pragma_table_info('services') 
            WHERE name = 'url'
        """))
        has_url = result.fetchone()[0] > 0
        
        # Begin transaction
        trans = conn.begin()
        
        try:
            # Add service_type column if it doesn't exist
            if not has_service_type:
                conn.execute(text("""
                    ALTER TABLE services ADD COLUMN service_type VARCHAR(20) DEFAULT 'API'
                """))
                print("Added service_type column to services table")
            else:
                print("service_type column already exists")
            
            # Add url column if it doesn't exist
            if not has_url:
                conn.execute(text("""
                    ALTER TABLE services ADD COLUMN url VARCHAR DEFAULT NULL
                """))
                print("Added url column to services table")
            else:
                print("url column already exists")
            
            # If the API docs URL exists, migrate it to the new URL field for API services
            conn.execute(text("""
                UPDATE services SET url = api_docs_url WHERE url IS NULL AND api_docs_url IS NOT NULL
            """))
            print("Migrated API docs URLs to generic URL field")
            
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
