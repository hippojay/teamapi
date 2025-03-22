"""
Database initialization module for Who What Where.

This module checks if the database is initialized, and if not, sets up the initial 
database schema and creates the admin user.
"""

import os
import json
import string
import random
import secrets
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import inspect
from sqlalchemy.exc import SQLAlchemyError, OperationalError
import logging
from pathlib import Path

from database import SessionLocal, engine, Base
import models
from auth import get_password_hash
from models import UserRole

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Current application version
CURRENT_VERSION = "1.0.0"

def check_database_initialized() -> bool:
    """
    Check if the database has been initialized by looking for the SystemInfo table
    and checking the initialized flag.
    
    Returns:
        bool: True if database is already initialized, False otherwise
    """
    try:
        db = SessionLocal()
        try:
            # Check if SystemInfo table exists
            inspector = inspect(engine)
            if not inspector.has_table("system_info"):
                logger.info("SystemInfo table does not exist. Database needs initialization.")
                return False
                
            # Check if there's at least one record in SystemInfo
            system_info = db.query(models.SystemInfo).first()
            if not system_info:
                logger.info("No system info record found. Database needs initialization.")
                return False
                
            # Check if the initialized flag is set to True
            if not system_info.initialized:
                logger.info("Database exists but is not marked as initialized.")
                return False
                
            logger.info(f"Database is initialized (version: {system_info.version})")
            return True
        except OperationalError:
            logger.info("Database tables don't exist yet. Database needs initialization.")
            return False
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error checking database initialization: {str(e)}")
        return False

def initialize_database(admin_username="admin", admin_email="admin@example.com", admin_password=None):
    """
    Initialize the database:
    1. Create all tables if they don't exist
    2. Create a SystemInfo record
    3. Create the initial admin user
    4. Initialize allowed email domains
    
    Note: This function does NOT load any sample data. Data loading should be 
    performed as a separate operation.
    
    Args:
        admin_username (str): Username for the initial admin user
        admin_email (str): Email for the initial admin user
        admin_password (str, optional): Password for the initial admin user. If None, a random password is generated.
    
    Returns:
        bool: True if initialization was successful, False otherwise
    """
    try:
        # Create all tables defined in models
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        
        db = SessionLocal()
        try:
            # Check if SystemInfo already exists
            system_info = db.query(models.SystemInfo).first()
            if not system_info:
                # Create a new SystemInfo record
                system_info = models.SystemInfo(
                    version=CURRENT_VERSION,
                    initialized=True,
                    initialized_at=datetime.now(),
                    schema_version=1,
                    migrations_applied=json.dumps(["initial"])
                )
                db.add(system_info)
                db.commit()
                db.refresh(system_info)
                logger.info("Created SystemInfo record")
            else:
                # Update existing record
                system_info.version = CURRENT_VERSION
                system_info.initialized = True
                system_info.initialized_at = datetime.now()
                db.commit()
                logger.info("Updated existing SystemInfo record")
            
            # Create admin user if it doesn't exist
            existing_admin = db.query(models.User).filter(
                (models.User.username == admin_username) | 
                (models.User.email == admin_email)
            ).first()
            
            if not existing_admin:
                # Generate a secure random password if none provided
                if not admin_password:
                    admin_password = generate_secure_password()
                    save_admin_credentials(admin_username, admin_email, admin_password)
                
                # Create admin user
                hashed_password = get_password_hash(admin_password)
                admin_user = models.User(
                    username=admin_username,
                    email=admin_email,
                    first_name="Admin",
                    last_name="User",
                    hashed_password=hashed_password,
                    is_admin=True,
                    is_active=True,
                    role=UserRole.admin
                )
                db.add(admin_user)
                db.commit()
                db.refresh(admin_user)
                logger.info(f"Created admin user: {admin_username} with randomly generated password")
            else:
                logger.info(f"Admin user already exists: {existing_admin.username}")
            
            # Initialize allowed email domains if needed
            try:
                from initialize_email_domains import initialize_email_domains
                initialize_email_domains()
                logger.info("Initialized allowed email domains")
            except Exception as e:
                logger.error(f"Error initializing email domains: {str(e)}")
                
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error during database initialization: {str(e)}")
            return False
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error creating database tables: {str(e)}")
        return False

def get_db_version() -> str:
    """
    Get the current database version from SystemInfo
    
    Returns:
        str: The current database version, or None if not found
    """
    try:
        db = SessionLocal()
        try:
            system_info = db.query(models.SystemInfo).first()
            return system_info.version if system_info else None
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error getting database version: {str(e)}")
        return None

def update_db_version(new_version: str) -> bool:
    """
    Update the database version in SystemInfo
    
    Args:
        new_version (str): The new version to set
        
    Returns:
        bool: True if update was successful, False otherwise
    """
    try:
        db = SessionLocal()
        try:
            system_info = db.query(models.SystemInfo).first()
            if system_info:
                system_info.version = new_version
                system_info.updated_at = datetime.now()
                db.commit()
                logger.info(f"Updated database version to {new_version}")
                return True
            else:
                logger.error("No system_info record found. Cannot update version.")
                return False
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error updating database version: {str(e)}")
        return False

def record_migration(migration_name: str) -> bool:
    """
    Record that a migration has been applied
    
    Args:
        migration_name (str): The name of the migration
        
    Returns:
        bool: True if recording was successful, False otherwise
    """
    try:
        db = SessionLocal()
        try:
            system_info = db.query(models.SystemInfo).first()
            if system_info:
                # Parse current migrations list
                migrations = json.loads(system_info.migrations_applied) if system_info.migrations_applied else []
                
                # Add new migration if not already present
                if migration_name not in migrations:
                    migrations.append(migration_name)
                    system_info.migrations_applied = json.dumps(migrations)
                    system_info.last_migration = migration_name
                    system_info.updated_at = datetime.now()
                    db.commit()
                    logger.info(f"Recorded migration: {migration_name}")
                return True
            else:
                logger.error("No system_info record found. Cannot record migration.")
                return False
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error recording migration: {str(e)}")
        return False

def run_migrations():
    """
    Run any pending database migrations
    
    This function should be expanded as new migrations are added.
    
    Returns:
        bool: True if all migrations were successful, False otherwise
    """
    try:
        # Get already applied migrations
        db = SessionLocal()
        try:
            system_info = db.query(models.SystemInfo).first()
            if not system_info:
                logger.error("No system_info record found. Cannot run migrations.")
                return False
                
            applied_migrations = json.loads(system_info.migrations_applied) if system_info.migrations_applied else []
            
            # Define migrations to run
            # Format: (migration_name, migration_function)
            migrations = [
                # Add future migrations here
                # ("add_new_table", add_new_table_migration),
            ]
            
            # Run each migration that hasn't been applied yet
            for name, func in migrations:
                if name not in applied_migrations:
                    logger.info(f"Running migration: {name}")
                    success = func()
                    if success:
                        record_migration(name)
                    else:
                        logger.error(f"Migration failed: {name}")
                        return False
            
            return True
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error running migrations: {str(e)}")
        return False

def generate_secure_password(length=16):
    """
    Generate a secure random password
    
    The password will include uppercase letters, lowercase letters,
    digits, and special characters for maximum security.
    
    Args:
        length (int): Length of the password to generate (default 16)
        
    Returns:
        str: A secure random password
    """
    # Define character sets
    uppercase = string.ascii_uppercase
    lowercase = string.ascii_lowercase
    digits = string.digits
    special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"  # Safe special characters
    
    # Ensure at least one of each type
    password = [
        secrets.choice(uppercase),
        secrets.choice(lowercase),
        secrets.choice(digits),
        secrets.choice(special_chars)
    ]
    
    # Fill up the rest of the password length with a mix of all characters
    all_chars = uppercase + lowercase + digits + special_chars
    password.extend(secrets.choice(all_chars) for _ in range(length - 4))
    
    # Shuffle the password to avoid predictable pattern
    random.shuffle(password)
    
    return ''.join(password)

def save_admin_credentials(username, email, password):
    """
    Save generated admin credentials to a secure file
    
    Args:
        username (str): Admin username
        email (str): Admin email
        password (str): Generated admin password
    """
    try:
        # Create credentials directory if it doesn't exist
        creds_dir = Path("../credentials")
        creds_dir.mkdir(exist_ok=True, mode=0o700)  # Secure permissions
        
        # Create credentials file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        creds_file = creds_dir / f"admin_credentials_{timestamp}.txt"
        
        with open(creds_file, "w") as f:
            f.write("WHO WHAT WHERE PORTAL - ADMIN CREDENTIALS\n")
            f.write("===========================================\n\n")
            f.write(f"Initial setup completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write(f"Username: {username}\n")
            f.write(f"Email: {email}\n")
            f.write(f"Password: {password}\n\n")
            f.write("IMPORTANT: This file contains sensitive information.\n")
            f.write("Keep it secure and delete it after first login.\n")
        
        # Set secure file permissions
        os.chmod(creds_file, 0o600)  # Only the owner can read/write
        
        console_file_path = os.path.abspath(creds_file)
        logger.info(f"Admin credentials saved to: {console_file_path}")
        print(f"\033[92mAdmin credentials saved to: {console_file_path}\033[0m")
        print(f"\033[93mIMPORTANT: This file contains your admin password. Keep it secure and delete it after first login.\033[0m")
        
    except Exception as e:
        logger.error(f"Error saving admin credentials: {str(e)}")
        print(f"\033[91mCould not save admin credentials to file: {str(e)}\033[0m")
        print(f"\033[93mPlease note your generated password: {password}\033[0m")

# Example migration function
# def add_new_table_migration():
#     """
#     Example migration to add a new table
#     """
#     try:
#         # Implementation here
#         return True
#     except Exception as e:
#         logger.error(f"Error in migration: {str(e)}")
#         return False
