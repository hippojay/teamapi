import os
import sys

# Add the current directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from migrations.remove_dependency_type import run_migration

if __name__ == "__main__":
    try:
        run_migration()
        print("Migration successfully completed!")
    except Exception as e:
        print(f"Error during migration: {e}")
