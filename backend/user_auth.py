from datetime import datetime, timedelta
from typing import Optional, List
import secrets
import string
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from sqlalchemy import and_, or_
import re
import models
import schemas
from auth import verify_password, get_password_hash, create_access_token
from database import get_db

# Email functions
async def send_verification_email(email: str, token: str):
    """
    Placeholder for sending verification email.
    This would be replaced with an actual email sending mechanism in production.
    """
    # For now, just print the verification link
    print(f"Verification link for {email}: http://localhost:3000/verify-email?token={token}")

async def send_password_reset_email(email: str, token: str):
    """
    Placeholder for sending password reset email.
    This would be replaced with an actual email sending mechanism in production.
    """
    # For now, just print the reset link
    print(f"Password reset link for {email}: http://localhost:3000/reset-password?token={token}")

# User management functions
def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    """Get a user by email address"""
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    """Get a user by username"""
    return db.query(models.User).filter(models.User.username == username).first()

def get_team_member_by_email(db: Session, email: str) -> Optional[models.TeamMember]:
    """Get a team member by email address"""
    return db.query(models.TeamMember).filter(models.TeamMember.email == email).first()

def get_allowed_email_domains(db: Session) -> List[str]:
    """Get list of allowed email domains from admin settings"""
    setting = db.query(models.AdminSetting).filter(models.AdminSetting.key == "allowed_email_domains").first()
    if not setting or not setting.value:
        return ["example.com"]  # Default if not configured
    return [domain.strip() for domain in setting.value.split(",")]

def is_email_allowed(email: str, db: Session) -> bool:
    """Check if email domain is in allowed domains list"""
    allowed_domains = get_allowed_email_domains(db)
    email_domain = email.split("@")[-1].lower()
    return email_domain in allowed_domains

def create_verification_token(db: Session, email: str, user_id: Optional[int] = None) -> str:
    """Create a verification token for email verification"""
    # Generate a secure random token
    token = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
    
    # Set expiration (10 minutes)
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    # Create the token record
    db_token = models.ValidationToken(
        token=token,
        email=email,
        user_id=user_id,
        token_type="email_verification",
        expires_at=expires_at
    )
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    
    return token

def create_password_reset_token(db: Session, email: str, user_id: int) -> str:
    """Create a password reset token"""
    # Generate a secure random token
    token = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
    
    # Set expiration (30 minutes)
    expires_at = datetime.utcnow() + timedelta(minutes=30)
    
    # Create the token record
    db_token = models.ValidationToken(
        token=token,
        email=email,
        user_id=user_id,
        token_type="password_reset",
        expires_at=expires_at
    )
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    
    return token

def verify_token(db: Session, token: str, token_type: str) -> Optional[models.ValidationToken]:
    """Verify a token is valid and not expired"""
    db_token = db.query(models.ValidationToken).filter(
        models.ValidationToken.token == token,
        models.ValidationToken.token_type == token_type
    ).first()
    
    if not db_token:
        return None
    
    # Check if token is expired
    if db_token.expires_at < datetime.utcnow():
        return None
    
    return db_token

def register_user(db: Session, user_data: schemas.UserRegister) -> models.User:
    """Register a new user (not verified yet)"""
    # Check if email is allowed
    if not is_email_allowed(user_data.email, db):
        raise HTTPException(status_code=403, detail="Email domain not allowed for registration")
    
    # Check if email already exists
    existing_user = get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create the user with inactive status
    hashed_password = get_password_hash(user_data.password)
    db_user = models.User(
        email=user_data.email,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        hashed_password=hashed_password,
        is_active=False,
        role=models.UserRole.guest
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Check if the user is also a team member and upgrade role if so
    team_member = get_team_member_by_email(db, user_data.email)
    if team_member:
        db_user.role = models.UserRole.team_member
        db.commit()
        db.refresh(db_user)
    
    # Create a verification token
    token = create_verification_token(db, user_data.email, db_user.id)
    
    # Send verification email
    # This would be an async call in production
    # await send_verification_email(user_data.email, token)
    
    # Log the user creation
    log_user_action(db, db_user.id, "CREATE", "User", db_user.id, f"User registered: {user_data.email}")
    
    return db_user

def verify_email(db: Session, verification: schemas.EmailVerification) -> bool:
    """Verify a user's email address"""
    # Verify the token
    db_token = verify_token(db, verification.token, "email_verification")
    if not db_token:
        return False
    
    # Check if token email matches the provided email
    if db_token.email != verification.email:
        return False
    
    # Get the user
    db_user = get_user_by_email(db, verification.email)
    if not db_user:
        return False
    
    # Activate the user
    db_user.is_active = True
    db.commit()
    
    # Delete the used token
    db.delete(db_token)
    db.commit()
    
    # Log the verification
    log_user_action(db, db_user.id, "UPDATE", "User", db_user.id, "Email verified")
    
    return True

def request_password_reset(db: Session, request: schemas.PasswordResetRequest) -> bool:
    """Request a password reset"""
    # Find the user
    db_user = get_user_by_email(db, request.email)
    if not db_user:
        # Don't reveal that the user doesn't exist
        return False
    
    # Create a password reset token
    token = create_password_reset_token(db, request.email, db_user.id)
    
    # Send password reset email
    # This would be an async call in production
    # await send_password_reset_email(request.email, token)
    
    # Log the request
    log_user_action(db, db_user.id, "REQUEST", "User", db_user.id, "Password reset requested")
    
    return True

def reset_password(db: Session, reset: schemas.PasswordReset) -> bool:
    """Reset a user's password"""
    # Verify the token
    db_token = verify_token(db, reset.token, "password_reset")
    if not db_token:
        return False
    
    # Get the user
    db_user = db.query(models.User).filter(models.User.id == db_token.user_id).first()
    if not db_user:
        return False
    
    # Update the password
    db_user.hashed_password = get_password_hash(reset.new_password)
    db.commit()
    
    # Delete the used token
    db.delete(db_token)
    db.commit()
    
    # Log the reset
    log_user_action(db, db_user.id, "UPDATE", "User", db_user.id, "Password reset completed")
    
    return True

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate) -> Optional[models.User]:
    """Update user information"""
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        return None
    
    # Update fields if provided
    if user_update.username is not None:
        # Check if username is already taken
        existing = get_user_by_username(db, user_update.username)
        if existing and existing.id != user_id:
            raise HTTPException(status_code=400, detail="Username already taken")
        db_user.username = user_update.username
    
    if user_update.email is not None:
        # Check if email is already taken
        existing = get_user_by_email(db, user_update.email)
        if existing and existing.id != user_id:
            raise HTTPException(status_code=400, detail="Email already taken")
        # Check if email domain is allowed
        if not is_email_allowed(user_update.email, db):
            raise HTTPException(status_code=403, detail="Email domain not allowed")
        db_user.email = user_update.email
    
    if user_update.first_name is not None:
        db_user.first_name = user_update.first_name
    
    if user_update.last_name is not None:
        db_user.last_name = user_update.last_name
    
    if user_update.role is not None:
        try:
            # Handle both string and enum values
            if isinstance(user_update.role, str):
                # Use the string directly to match enum values
                db_user.role = models.UserRole[user_update.role]
            else:
                db_user.role = models.UserRole[user_update.role]
        except (KeyError, AttributeError):
            # Fallback to direct assignment if conversion fails
            db_user.role = user_update.role
    
    if user_update.is_active is not None:
        db_user.is_active = user_update.is_active
    
    if user_update.password:
        db_user.hashed_password = get_password_hash(user_update.password)
    
    db.commit()
    db.refresh(db_user)
    
    # Log the update
    log_user_action(db, user_id, "UPDATE", "User", user_id, "User profile updated")
    
    return db_user

def get_all_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    """Get all users with pagination"""
    return db.query(models.User).offset(skip).limit(limit).all()

def validate_password(password: str) -> bool:
    """Validate password complexity requirements"""
    # At least 8 characters long
    if len(password) < 8:
        return False
    
    # At least one digit
    if not re.search(r'\d', password):
        return False
    
    # At least one uppercase letter
    if not re.search(r'[A-Z]', password):
        return False
    
    # At least one lowercase letter
    if not re.search(r'[a-z]', password):
        return False
    
    # At least one special character
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False
    
    return True

def log_user_action(db: Session, user_id: Optional[int], action: str, entity_type: str, entity_id: Optional[int], details: str):
    """Create an audit log entry for user actions"""
    log_entry = models.AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details
    )
    db.add(log_entry)
    db.commit()

def get_audit_logs(db: Session, skip: int = 0, limit: int = 100) -> List[models.AuditLog]:
    """Get audit logs with pagination"""
    return db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).offset(skip).limit(limit).all()

def is_admin(user: schemas.User) -> bool:
    """Check if user is an admin"""
    if hasattr(user, 'role'):
        # Simply check if role is admin
        if isinstance(user.role, str):
            return user.role == "admin" or user.is_admin
        return user.role == schemas.UserRole.admin or user.is_admin
    return user.is_admin

def update_admin_setting(db: Session, setting: schemas.AdminSettingUpdate, key: str, user_id: int) -> models.AdminSetting:
    """Update an admin setting"""
    db_setting = db.query(models.AdminSetting).filter(models.AdminSetting.key == key).first()
    
    if db_setting:
        old_value = db_setting.value
        # Update existing setting
        db_setting.value = setting.value
        if setting.description is not None:
            db_setting.description = setting.description
        db_setting.updated_at = datetime.utcnow()
    else:
        # Create new setting
        db_setting = models.AdminSetting(
            key=key,
            value=setting.value,
            description=setting.description
        )
        old_value = None
        db.add(db_setting)
    
    db.commit()
    db.refresh(db_setting)
    
    # Log the update
    log_user_action(
        db, 
        user_id,
        "UPDATE" if old_value else "CREATE",
        "AdminSetting", 
        db_setting.id,
        f"Changed setting '{key}' from '{old_value}' to '{setting.value}'" if old_value else f"Created setting '{key}' with value '{setting.value}'"
    )
    
    return db_setting

def get_admin_settings(db: Session) -> List[models.AdminSetting]:
    """Get all admin settings"""
    return db.query(models.AdminSetting).all()

def get_admin_setting(db: Session, key: str) -> Optional[models.AdminSetting]:
    """Get a specific admin setting by key"""
    return db.query(models.AdminSetting).filter(models.AdminSetting.key == key).first()
