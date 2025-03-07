#!/usr/bin/env python3
"""
Script to run the service model migration.
This adds the service_type and url fields to the Service model.
"""

import os
import sys
import argparse
from sqlalchemy import create_engine, text
from database import DATABASE_URL

def run_migration():
    print("Running service model migration...")
    
    # Load and run the migration
    migration_path = os.path.join('migrations', '20250307_update_service_model', 'migrate.py')
    
    if not os.path.exists(migration_path):
        print(f"Error: Migration file not found at {migration_path}")
        return False
    
    # Add the directory to sys.path
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    
    # Import and run the migration
    try:
        from migrations.update_service_model.migrate import run_migration as _run_migration
        _run_migration()
        print("Migration completed successfully")
        return True
    except Exception as e:
        print(f"Error running migration: {e}")
        return False

def check_migration_status():
    print("Checking migration status...")
    
    # Create engine connection
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Check if service_type column exists
        result = conn.execute(text("""
            SELECT COUNT(*) as count FROM pragma_table_info('services') 
            WHERE name = 'service_type'
        """))
        has_service_type = result.fetchone()[0] > 0
        
        # Check if url column exists
        result = conn.execute(text("""
            SELECT COUNT(*) as count FROM pragma_table_info('services') 
            WHERE name = 'url'
        """))
        has_url = result.fetchone()[0] > 0
        
        if has_service_type and has_url:
            print("Migration has been applied successfully.")
            return True
        else:
            print("Migration has not been applied or is incomplete.")
            return False

def parse_args():
    parser = argparse.ArgumentParser(description='Run service model migration')
    parser.add_argument('--check', action='store_true', help='Check migration status without applying')
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_args()
    
    if args.check:
        check_migration_status()
    else:
        run_migration()
