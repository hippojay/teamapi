"""
This script runs all database migrations in the migrations directory.
"""
import os
import sys
import importlib.util
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def run_migrations():
    """Run all migrations in the migrations directory"""
    logger.info("Starting database migrations...")
    
    # Get the migrations directory path
    migrations_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'migrations')
    
    if not os.path.exists(migrations_dir):
        logger.error(f"Migrations directory not found: {migrations_dir}")
        return False
    
    # Get all Python files in the migrations directory
    migration_files = [f for f in os.listdir(migrations_dir) if f.endswith('.py')]
    
    if not migration_files:
        logger.info("No migration files found.")
        return True
    
    logger.info(f"Found {len(migration_files)} migration files")
    
    # Run each migration file
    for file_name in sorted(migration_files):
        logger.info(f"Running migration: {file_name}")
        
        try:
            # Load the module
            file_path = os.path.join(migrations_dir, file_name)
            spec = importlib.util.spec_from_file_location("migration", file_path)
            migration_module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(migration_module)
            
            # Run the migrate function if it exists
            if hasattr(migration_module, 'migrate'):
                migration_module.migrate()
                logger.info(f"Migration {file_name} completed successfully")
            else:
                logger.warning(f"Migration {file_name} does not have a migrate function")
        except Exception as e:
            logger.error(f"Error running migration {file_name}: {e}")
            return False
    
    logger.info("All migrations completed successfully")
    return True

if __name__ == "__main__":
    success = run_migrations()
    sys.exit(0 if success else 1)
