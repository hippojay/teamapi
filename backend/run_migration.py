import argparse
import logging
import importlib
import sys
import os
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def run_specific_migration(migration_name):
    """
    Run a specific migration by name

    Args:
        migration_name (str): Name of the migration module to run

    Returns:
        bool: True if migration was successful, False otherwise
    """
    try:
        # Check if the migration file exists
        migration_path = os.path.join("migrations", f"{migration_name}.py")
        if not os.path.exists(migration_path):
            logger.error(f"Migration file not found: {migration_path}")
            return False

        # Import the migration module dynamically
        module_path = f"migrations.{migration_name}"
        migration_module = importlib.import_module(module_path)

        # Run the migration
        logger.info(f"Running migration: {migration_name}")
        if hasattr(migration_module, "run_migration"):
            success = migration_module.run_migration()
            if success:
                logger.info(f"Migration {migration_name} completed successfully")
                return True
            else:
                logger.error(f"Migration {migration_name} failed")
                return False
        else:
            logger.error(f"Migration {migration_name} does not have a run_migration function")
            return False

    except Exception as e:
        logger.error(f"Error running migration {migration_name}: {e}")
        return False

def run_all_migrations():
    """
    Run all available migrations in the migrations directory

    Returns:
        bool: True if all migrations were successful, False otherwise
    """
    try:
        # Get all Python files in the migrations directory
        migrations_dir = Path("migrations")
        migration_files = [f.stem for f in migrations_dir.glob("*.py")
                           if f.is_file() and f.stem != "__init__" and not f.stem.startswith("_")]

        # Sort migration files to ensure they're executed in a consistent order
        migration_files.sort()

        if not migration_files:
            logger.info("No migrations found to run")
            return True

        logger.info(f"Found {len(migration_files)} migrations to run: {migration_files}")

        # Run each migration
        success = True
        for migration_name in migration_files:
            migration_success = run_specific_migration(migration_name)
            if not migration_success:
                logger.error(f"Migration {migration_name} failed, stopping migration process")
                success = False
                break

        return success

    except Exception as e:
        logger.error(f"Error running all migrations: {e}")
        return False

def record_migration_in_db(migration_name):
    """
    Record a successful migration in the database

    Args:
        migration_name (str): Name of the migration to record

    Returns:
        bool: True if recording was successful, False otherwise
    """
    try:
        # Import here to avoid circular imports
        from db_initializer import record_migration

        # Record the migration
        success = record_migration(migration_name)
        return success
    except Exception as e:
        logger.error(f"Error recording migration {migration_name}: {e}")
        return False

if __name__ == "__main__":
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Run database migrations for Who What Where")
    parser.add_argument("--migration", help="Specific migration to run (omit to run all)")
    parser.add_argument("--record", action="store_true", help="Record successful migrations in the database")

    args = parser.parse_args()

    # Run migrations
    if args.migration:
        # Run specific migration
        success = run_specific_migration(args.migration)

        # Record the migration if requested
        if success and args.record:
            record_success = record_migration_in_db(args.migration)
            if not record_success:
                logger.warning(f"Migration {args.migration} was successful but could not be recorded in the database")
    else:
        # Run all migrations
        success = run_all_migrations()

    # Exit with appropriate status code
    if success:
        logger.info("Migration process completed successfully")
        sys.exit(0)
    else:
        logger.error("Migration process failed")
        sys.exit(1)
