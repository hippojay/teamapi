"""
Script to add an admin user to an existing database.
This script allows adding an admin without resetting the database.
"""

import sys
import getpass
from sqlalchemy.orm import Session
from database import SessionLocal, Base, engine
import models
from auth import get_password_hash

def add_admin_user(username: str, email: str, password: str = None):
    """Add an admin user to the database"""
    
    # If password is not provided, prompt for it
    if not password:
        password = getpass.getpass("Enter password for admin user: ")
        confirm_password = getpass.getpass("Confirm password: ")
        
        # Check if passwords match
        if password != confirm_password:
            print("Passwords do not match!")
            return False
        
        # Check password complexity
        if (len(password) < 8 or not any(c.isupper() for c in password) or 
            not any(c.islower() for c in password) or not any(c.isdigit() for c in password) or
            not any(c in "!@#$%^&*(),.?\":{}|<>" for c in password)):
            print("Password must be at least 8 characters long and include uppercase, lowercase, digit, and special character!")
            return False
    
    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = db.query(models.User).filter(models.User.username == username).first()
        if existing_user:
            print(f"User '{username}' already exists.")
            
            # Check if user is already an admin
            if existing_user.role == models.UserRole.admin or existing_user.is_admin:
                print(f"User '{username}' is already an admin.")
                return True
                
            # Make existing user an admin
            existing_user.role = models.UserRole.admin
            existing_user.is_admin = True
            db.commit()
            print(f"User '{username}' has been promoted to admin.")
            return True
        
        # Check if email already exists
        existing_email = db.query(models.User).filter(models.User.email == email).first()
        if existing_email:
            print(f"A user with email '{email}' already exists.")
            return False
        
        # Create a new admin user
        try:
            hashed_password = get_password_hash(password)
            
            # Create new user
            db_user = models.User(
                username=username,
                email=email,
                first_name="Admin",
                last_name="User",
                hashed_password=hashed_password,
                is_admin=True,
                is_active=True,
                role=models.UserRole.admin
            )
            
            db.add(db_user)
            db.commit()
            
            print(f"Admin user '{username}' created successfully!")
            return True
            
        except Exception as e:
            print(f"Error creating admin user: {e}")
            return False
            
    finally:
        db.close()

if __name__ == "__main__":
    # Check arguments
    if len(sys.argv) < 3:
        print("Usage: python add_admin.py <username> <email> [password]")
        print("If password is not provided, you will be prompted to enter it.")
        sys.exit(1)
    
    username = sys.argv[1]
    email = sys.argv[2]
    
    # Get password from arguments or prompt
    password = None
    if len(sys.argv) >= 4:
        password = sys.argv[3]
    
    success = add_admin_user(username, email, password)
    if success:
        if len(sys.argv) >= 4:
            print(f"Admin user created with username '{username}' and the provided password.")
        else:
            print(f"Admin user created with username '{username}' and the password you entered.")
    else:
        print("Failed to create or update admin user.")
