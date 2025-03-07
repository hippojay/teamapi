#!/usr/bin/env python3
"""
Script to run the service model migration to fix enum value issues.
"""

import os
import subprocess
import sys

def run_migrations():
    print("Running service model migrations...")
    
    # 1. First run the schema migration to update the model
    migration_path = os.path.join('migrations', '20250307_update_service_model', 'migrate.py')
    if os.path.exists(migration_path):
        print("Running schema migration...")
        try:
            result = subprocess.run(
                [sys.executable, migration_path],
                check=True,
                capture_output=True,
                text=True
            )
            print(result.stdout)
        except subprocess.CalledProcessError as e:
            print(f"Error running schema migration: {e}")
            print(e.stdout)
            print(e.stderr)
            return False
    else:
        print(f"Schema migration file not found at {migration_path}")
    
    # 2. Run the fix_enum_values migration to update existing data
    enum_fix_path = os.path.join('migrations', '20250307_update_service_model', 'fix_enum_values.py')
    if os.path.exists(enum_fix_path):
        print("Running enum values fix migration...")
        try:
            result = subprocess.run(
                [sys.executable, enum_fix_path],
                check=True,
                capture_output=True,
                text=True
            )
            print(result.stdout)
        except subprocess.CalledProcessError as e:
            print(f"Error running enum fix migration: {e}")
            print(e.stdout)
            print(e.stderr)
            return False
    else:
        print(f"Enum fix migration file not found at {enum_fix_path}")
        
    print("All migrations completed successfully!")
    return True

if __name__ == "__main__":
    run_migrations()
