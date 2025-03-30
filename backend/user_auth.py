from datetime import datetime, timedelta
from typing import Optional, List
import secrets
import string
from sqlalchemy.orm import Session
from fastapi import HTTPException
import re
import models
import schemas
from auth import get_password_hash
from logger import get_logger, log_and_handle_exception

# Initialize logger
logger = get_logger('user_auth', log_level='INFO')

# Email functions
async def send_verification_email(email: str, token: str):
    """
    Placeholder for sending verification email.
    This would be replaced with an actual email sending mechanism in production.
    """
    # For now, just print the verification link
    print(f"Verification link for {email}: http://localhost:3000/verify-email?token={token}&email={email}")

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

    # Split by newlines and commas, then strip whitespace
    domains = []
    for line in setting.value.splitlines():
        for domain in line.split(','):
            domain = domain.strip()
            if domain:  # Only add non-empty domains
                domains.append(domain)

    return domains

def is_email_allowed(email: str, db: Session) -> bool:
    """Check if email domain is in allowed domains list"""
    allowed_domains = get_allowed_email_domains(db)
    email_domain = email.split("@")[-1].lower()
    return email_domain in allowed_domains

def create_verification_token(db: Session, email: str, user_id: Optional[int] = None) -> str:
    """Create a verification token for email verification"""
    logger.info(f"Creating email verification token for email: {email}" + (f", user ID: {user_id}" if user_id else ""))

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
    logger.info(f"Creating password reset token for user: {email} (ID: {user_id})")

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
    logger.info(f"Verifying {token_type} token: {token[:5]}***")

    db_token = db.query(models.ValidationToken).filter(
        models.ValidationToken.token == token,
        models.ValidationToken.token_type == token_type
    ).first()

    if not db_token:
        logger.warning(f"Token verification failed: {token_type} token not found: {token[:5]}***")
        return None

    # Check if token is expired
    if db_token.expires_at < datetime.utcnow():
        logger.warning(f"Token verification failed: {token_type} token expired: {token[:5]}*** (expired at {db_token.expires_at})")
        return None

    logger.info(f"Token verified successfully: {token_type} token for {db_token.email}")

    return db_token

def register_user(db: Session, user_data: schemas.UserRegister) -> models.User:
    """Register a new user (not verified yet)"""
    logger.info(f"Attempting to register new user with email: {user_data.email}")

    try:
        # Check if email is allowed
        if not is_email_allowed(user_data.email, db):
            email_domain = user_data.email.split("@")[-1].lower()
            logger.warning(f"Registration rejected: Email domain {email_domain} not in allowed domains list")
            raise HTTPException(status_code=403, detail="Email domain not allowed for registration")

        # Check if email already exists
        existing_user = get_user_by_email(db, user_data.email)
        if existing_user:
            logger.warning(f"Registration rejected: Email {user_data.email} already registered")
            raise HTTPException(status_code=400, detail="Email already registered")

        # Create the user with inactive status and use email as username
        hashed_password = get_password_hash(user_data.password)
        db_user = models.User(
            email=user_data.email,
            username=user_data.email,  # Set username equal to email
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            hashed_password=hashed_password,
            is_active=False,
            role="guest"  # Use string value, ensuring lowercase
        )

        try:
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            logger.info(f"Created new user: {user_data.email} (ID: {db_user.id}) - awaiting verification")
        except Exception as e:
            db.rollback()
            log_and_handle_exception(
                logger,
                f"Database error creating user: {user_data.email}",
                e,
                reraise=True,
                email=user_data.email
            )

        # Check if the user is also a team member and upgrade role if so
        try:
            team_member = get_team_member_by_email(db, user_data.email)
            if team_member:
                db_user.role = "team_member"  # Use string value, ensuring lowercase
                db.commit()
                db.refresh(db_user)
                logger.info(f"Upgraded user {user_data.email} (ID: {db_user.id}) to team_member role due to existing team member record")
        except Exception as e:
            # Log but don't fail the registration if this fails
            log_and_handle_exception(
                logger,
                f"Error checking for team member record for {user_data.email}",
                e,
                reraise=False,
                user_id=db_user.id,
                email=user_data.email
            )

        # Create a verification token
        # try:
        #    token = create_verification_token(db, user_data.email, db_user.id)
        #    logger.info(f"Created verification token for user {user_data.email} (ID: {db_user.id})")
        # except Exception as e:
        #    log_and_handle_exception(
        #        logger,
        #        f"Error creating verification token for {user_data.email}",
        #        e,
        #        reraise=True,
        #        user_id=db_user.id,
        #        email=user_data.email
        #    )

        # Log the user creation
        try:
            log_user_action(db, db_user.id, "CREATE", "User", db_user.id, f"User registered: {user_data.email}")
        except Exception as e:
            # Just log this error, don't fail registration
            logger.error(f"Error logging user action for new registration {user_data.email}: {str(e)}")

        return db_user
    except HTTPException:
        # Re-raise HTTP exceptions directly
        raise
    except Exception as e:
        # Catch and log any other unexpected errors
        log_and_handle_exception(
            logger,
            f"Unexpected error during user registration: {user_data.email}",
            e,
            reraise=True,
            email=user_data.email
        )

def verify_email(db: Session, verification: schemas.EmailVerification) -> bool:
    """Verify a user's email address"""
    logger.info(f"Email verification attempt for token: {verification.token[:5]}***")

    try:
        # Verify the token
        db_token = verify_token(db, verification.token, "email_verification")
        if not db_token:
            logger.warning(f"Email verification failed: Invalid or expired token: {verification.token[:5]}***")
            return False

        # Check if token email matches the provided email
        if db_token.email != verification.email:
            logger.warning(f"Email verification failed: Token email mismatch. Token: {verification.token[:5]}***, Email: {verification.email}")
            return False

        # Get the user
        db_user = get_user_by_email(db, verification.email)
        if not db_user:
            logger.warning(f"Email verification failed: User not found for email: {verification.email}")
            return False

        # Activate the user
        try:
            db_user.is_active = True
            # Record verification timestamp
            db_user.verified_at = datetime.utcnow()
            db.commit()
            logger.info(f"User activated successfully: {db_user.email} (ID: {db_user.id})")
        except Exception as e:
            db.rollback()
            log_and_handle_exception(
                logger,
                f"Database error activating user: {db_user.email} (ID: {db_user.id})",
                e,
                reraise=True,
                user_id=db_user.id,
                email=db_user.email
            )

        # Delete the used token
        try:
            db.delete(db_token)
            db.commit()
            logger.debug(f"Deleted used verification token: {verification.token[:5]}***")
        except Exception as e:
            # Don't fail if token deletion fails
            log_and_handle_exception(
                logger,
                f"Error deleting used verification token: {verification.token[:5]}***",
                e,
                reraise=False,
                user_id=db_user.id,
                email=db_user.email
            )

        # Log the verification
        try:
            log_user_action(db, db_user.id, "UPDATE", "User", db_user.id, "Email verified")
        except Exception as e:
            # Don't fail if action logging fails
            logger.error(f"Error logging email verification for user {db_user.id}: {str(e)}")

        # All steps succeeded
        logger.info(f"Email verification completed successfully for: {db_user.email} (ID: {db_user.id})")
        return True
    except Exception as e:
        log_and_handle_exception(
            logger,
            f"Unexpected error during email verification for token: {verification.token[:5]}***",
            e,
            reraise=True,
            token_prefix=verification.token[:5],
            email=verification.email
        )
        return False

def request_password_reset(db: Session, request: schemas.PasswordResetRequest) -> bool:
    """Request a password reset"""
    # Find the user
    db_user = get_user_by_email(db, request.email)
    if not db_user:
        # Don't reveal that the user doesn't exist
        return False

    # Create a password reset token
    create_password_reset_token(db, request.email, db_user.id)

    # Send password reset email
    # This would be an async call in production
    # await send_password_reset_email(request.email, token)

    # Log the request
    log_user_action(db, db_user.id, "REQUEST", "User", db_user.id, "Password reset requested")

    return True

def reset_password(db: Session, reset: schemas.PasswordReset) -> bool:
    """Reset a user's password"""
    logger.info(f"Password reset attempt with token: {reset.token[:5]}***")

    try:
        # Verify the token
        db_token = verify_token(db, reset.token, "password_reset")
        if not db_token:
            logger.warning(f"Password reset failed: Invalid or expired token: {reset.token[:5]}***")
            return False

        # Get the user
        db_user = db.query(models.User).filter(models.User.id == db_token.user_id).first()
        if not db_user:
            logger.warning(f"Password reset failed: User not found for ID: {db_token.user_id}, token: {reset.token[:5]}***")
            return False

        # Additional security check - verify email matches token's email
        if db_user.email != db_token.email:
            logger.warning(f"Password reset failed: Email mismatch between token ({db_token.email}) and user ({db_user.email})")
            return False

        # Update the password
        try:
            old_hash = db_user.hashed_password  # Save for logging purposes
            db_user.hashed_password = get_password_hash(reset.new_password)
            db_user.password_changed_at = datetime.utcnow()
            db.commit()
            logger.info(f"Password updated successfully for user: {db_user.email} (ID: {db_user.id})")
        except Exception as e:
            db.rollback()
            log_and_handle_exception(
                logger,
                f"Database error updating password for user ID: {db_user.id}",
                e,
                reraise=True,
                user_id=db_user.id,
                email=db_user.email
            )

        # Delete the used token
        try:
            db.delete(db_token)
            db.commit()
            logger.debug(f"Deleted used password reset token: {reset.token[:5]}***")
        except Exception as e:
            # Don't fail if token deletion fails
            log_and_handle_exception(
                logger,
                f"Error deleting used password reset token: {reset.token[:5]}***",
                e,
                reraise=False,
                user_id=db_user.id,
                email=db_user.email
            )

        # Log the reset - include metadata but not the actual passwords/hashes
        try:
            # Create a hash of the old password hash for comparison only
            # This just helps detect if the same password was reused (same hash would produce same masked hash)
            import hashlib
            old_masked = hashlib.sha256(old_hash.encode()).hexdigest()[:8]
            new_masked = hashlib.sha256(db_user.hashed_password.encode()).hexdigest()[:8]

            # Only log if they're different - don't reveal if they used the same password
            password_reused = old_masked == new_masked
            detail_message = "Password reset completed" + (", similar password detected" if password_reused else "")

            log_user_action(db, db_user.id, "UPDATE", "User", db_user.id, detail_message)
        except Exception as e:
            # Don't fail the reset if logging fails
            logger.error(f"Error logging password reset for user {db_user.id}: {str(e)}")

        # All steps succeeded
        logger.info(f"Password reset completed successfully for: {db_user.email} (ID: {db_user.id})")
        return True
    except Exception as e:
        log_and_handle_exception(
            logger,
            f"Unexpected error during password reset for token: {reset.token[:5]}***",
            e,
            reraise=True,
            token_prefix=reset.token[:5]
        )
        return False

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate) -> Optional[models.User]:
    """Update user information"""
    logger.info(f"Updating user information for user ID: {user_id}")

    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        logger.warning(f"User update failed: User with ID {user_id} not found")
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
            # Handle both string and enum values - ensure lowercase
            if isinstance(user_update.role, str):
                db_user.role = user_update.role.lower()
            else:
                db_user.role = user_update.role.value.lower()
        except (KeyError, AttributeError):
            # Fallback to direct assignment if conversion fails
            db_user.role = str(user_update.role).lower()

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
    # Track reason for rejection for logging purposes
    reason = None

    # At least 8 characters long
    if len(password) < 8:
        reason = "too short (minimum 8 characters)"
        result = False
    # At least one digit
    elif not re.search(r'\d', password):
        reason = "missing digit"
        result = False
    # At least one uppercase letter
    elif not re.search(r'[A-Z]', password):
        reason = "missing uppercase letter"
        result = False
    # At least one lowercase letter
    elif not re.search(r'[a-z]', password):
        reason = "missing lowercase letter"
        result = False
    # At least one special character
    elif not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        reason = "missing special character"
        result = False
    else:
        result = True

    if not result:
        logger.warning(f"Password validation failed: {reason}")
    else:
        logger.info("Password validation successful")

    return result

def log_user_action(db: Session,
                    user_id: Optional[int],
                    action: str,
                    entity_type: str,
                    entity_id: Optional[int],
                    details: str):
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

    # Log to application logs as well
    user_info = f"User ID: {user_id}" if user_id else "Anonymous"
    entity_info = f"{entity_type} ID: {entity_id}" if entity_id else entity_type
    logger.info(f"Audit: {action} - {user_info} - {entity_info} - {details}")

def get_audit_logs(db: Session, skip: int = 0, limit: int = 100) -> List[models.AuditLog]:
    """Get audit logs with pagination"""
    return db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).offset(skip).limit(limit).all()

def is_admin(user: schemas.User) -> bool:
    """Check if user is an admin"""
    if hasattr(user, 'role'):
        # Simply check if role is admin
        if isinstance(user.role, str):
            return user.role.lower() == "admin" or user.is_admin
        return user.role.value.lower() == "admin" or user.is_admin
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
        f"Changed setting '{key}' from '{old_value}' to '{setting.value}'"
        if old_value else f"Created setting '{key}' with value '{setting.value}'"
    )

    return db_setting

def get_admin_settings(db: Session) -> List[models.AdminSetting]:
    """Get all admin settings"""
    return db.query(models.AdminSetting).all()

def get_admin_setting(db: Session, key: str) -> Optional[models.AdminSetting]:
    """Get a specific admin setting by key"""
    return db.query(models.AdminSetting).filter(models.AdminSetting.key == key).first()
