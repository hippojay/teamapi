"""
Script to create an initial admin user.
Run this script to set up your first admin account.
"""

import sys
from sqlalchemy.orm import Session
from database import SessionLocal, Base, engine
import models
import user_crud
import schemas
from passlib.hash import bcrypt

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

def create_admin_user(username: str, email: str, password: str):
    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = user_crud.get_user_by_username(db, username)
        if existing_user:
            print(f"User '{username}' already exists.")
            return
        
        existing_email = user_crud.get_user_by_email(db, email)
        if existing_email:
            print(f"User with email '{email}' already exists.")
            return
            
        # Create new admin user
        # Handle potential bcrypt version issues
        try:
            from auth import get_password_hash
            hashed_password = get_password_hash(password)
            
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
            db.refresh(db_user)
        except Exception as e:
            print(f"Error using standard method: {e}")
            print("Trying alternative approach...")
            
            # Direct approach without using the auth module
            hashed_password = bcrypt.using(rounds=12).hash(password)
            
            db_user = models.User(
                username=username,
                email=email,
                first_name="Admin",
                last_name="User",
                hashed_password=hashed_password,
                is_admin=True,
                is_active=True,
                role="admin"
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            print(f"Created user with alternative method")
        print(f"Admin user '{username}' created successfully!")
        
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python create_admin.py <username> <email> <password>")
        sys.exit(1)
        
    username = sys.argv[1]
    email = sys.argv[2]
    password = sys.argv[3]
    
    create_admin_user(username, email, password)
