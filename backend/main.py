from fastapi import FastAPI, HTTPException, Depends, status, BackgroundTasks, File, UploadFile, Form, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import uvicorn
from datetime import timedelta, datetime
import sys
import argparse

from database import get_db, engine, Base
import models
import schemas
import crud
import entity_crud
import search_crud
import user_crud
import user_auth
import auth
import audit_logger
from logger import get_logger
import shutil
import tempfile
import pandas as pd
import os
from search_schemas import SearchResults
from repository.repository_service import RepositoryService

# Import database initializer
import db_initializer
from database import db_config

# Initialize logger
logger = get_logger('main', log_level='INFO')

# Log database connection type
db_type = db_config.db_type
logger.info(f"Using {db_type.upper()} database")
print(f"\033[94mUsing {db_type.upper()} database\033[0m")

# Always check if database is initialized regardless of database type
initialize_db = not db_initializer.check_database_initialized()

# Log initialization status
if initialize_db:
    if db_type == "postgresql":
        logger.warning("PostgreSQL database tables not found. Performing first-time setup...")
        print("\033[93mPostgreSQL database tables not found. Performing first-time setup...\033[0m")
        # Set Base.metadata.schema here to ensure tables are created in the correct schema
        if db_config.schema:
            Base.metadata.schema = db_config.schema
            logger.info(f"Using schema: {db_config.schema}")
            print(f"\033[94mUsing schema: {db_config.schema}\033[0m")
        else:
            logger.warning("WARNING: No schema specified for PostgreSQL. See docs/postgresql_schemas.md for help.")
            print("\033[91mWARNING: No schema specified for PostgreSQL. See docs/postgresql_schemas.md for help.\033[0m")
    else:
        logger.warning("SQLite database not initialized. Performing first-time setup...")
        print("\033[93mSQLite database not initialized. Performing first-time setup...\033[0m")

# Initialize if needed
if initialize_db:
    logger.info("Initializing database...")
    success = db_initializer.initialize_database()
    if success:
        logger.info("Database initialized successfully!")
        print("\033[92mDatabase initialized successfully!\033[0m")
    else:
        logger.error("Database initialization failed.")
        print("\033[91mDatabase initialization failed. Please check the logs.\033[0m")
# For backward compatibility, ensure all tables exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Team API Portal")

logger.info("FastAPI application initialized")

# Mount static files directory
static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication endpoints
@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    logger.info(f"Login attempt for user: {form_data.username}")
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Use email as the subject if username is None
    subject = user.username if user.username else user.email
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": subject}, expires_delta=access_token_expires
    )

    # Log the login event
    logger.info(f"Successful login for user: {user.username or user.email} (ID: {user.id})")
    audit_logger.log_login(db, user.id, user.username or user.email)

    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: schemas.User = Depends(auth.get_current_active_user)):
    return current_user

@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate,
                db: Session = Depends(get_db),
                current_user: schemas.User = Depends(auth.get_current_active_user)):
    logger.info(f"User creation attempt by admin (ID: {current_user.id}) for email: {user.email}")

    # Only admins can create users directly
    if not user_auth.is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to create users")

    db_user = user_auth.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    if user.username:
        db_user = user_auth.get_user_by_username(db, username=user.username)
        if db_user:
            raise HTTPException(status_code=400, detail="Username already registered")

    # Validate email domain
    if not user_auth.is_email_allowed(user.email, db):
        raise HTTPException(status_code=403, detail="Email domain not allowed for registration")

    # Determine the role value (use uppercase enum name but lowercase string value)
    role_value = "guest"  # Default
    if user.role:
        # Convert to uppercase for lookup
        role_upper = user.role.upper() if isinstance(user.role, str) else user.role
        if role_upper == "ADMIN":
            role_value = "admin"
        elif role_upper == "TEAM_MEMBER":
            role_value = "team_member"
        elif role_upper == "GUEST":
            role_value = "guest"

    # Create user with full details (use email as username if not provided)
    username = user.username if user.username else user.email
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        username=username,
        email=user.email,
        hashed_password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        role=role_value,  # Use string value directly
        is_active=True,  # Admins can create pre-verified users
        is_admin=user.is_admin
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Log the user creation
    logger.info(f"User created successfully: {user.email} (ID: {db_user.id}) by admin: {current_user.username or current_user.email} (ID: {current_user.id})")
    user_auth.log_user_action(db, current_user.id, "CREATE", "User", db_user.id, f"User created by admin: {user.email}")

    return db_user

@app.post("/register", response_model=Dict[str, Any])
def register_user(user: schemas.UserRegister, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    logger.info(f"User registration attempt for email: {user.email}")
    # Validate password complexity
    if not user_auth.validate_password(user.password):
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters and include uppercase, lowercase, digit, and special character"
        )

    try:
        db_user = user_auth.register_user(db, user)

        # Create verification token
        token = user_auth.create_verification_token(db, user.email, db_user.id)

        # Send verification email asynchronously
        background_tasks.add_task(user_auth.send_verification_email, user.email, token)

        return {
            "message": "Registration successful. Please check your email for verification instructions.",
            "user_id": db_user.id,
            "email": db_user.email
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.get("/token-info/{token}")
def get_token_info(token: str, db: Session = Depends(get_db)):
    """
    Get information about a verification token without verifying it.
    This is used for the email verification page when the email is not in the URL.
    """
    # Look up the token in the database
    db_token = db.query(models.ValidationToken).filter(
        models.ValidationToken.token == token
    ).first()

    if not db_token:
        raise HTTPException(status_code=404, detail="Token not found")

    # Check if the token is expired
    if db_token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Token expired")

    # Return the email associated with the token
    return {"email": db_token.email, "token_type": db_token.token_type}

@app.post("/verify-email", response_model=Dict[str, str])
def verify_email(verification: schemas.EmailVerification, db: Session = Depends(get_db)):
    logger.info(f"Email verification attempt for token: {verification.token}")
    result = user_auth.verify_email(db, verification)
    if result:
        logger.info(f"Email verified successfully for token: {verification.token}")
        return {"message": "Email verified successfully. You can now log in."}
    else:
        logger.warning(f"Email verification failed for token: {verification.token}")
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

@app.post("/reset-password-request", response_model=Dict[str, str])
def request_password_reset(request: schemas.PasswordResetRequest,
                           background_tasks: BackgroundTasks,
                           db: Session = Depends(get_db)):
    logger.info(f"Password reset request for email: {request.email}")
    # Always return success even if email doesn't exist (security best practice)
    user = user_auth.get_user_by_email(db, request.email)
    if user:
        logger.info(f"Creating password reset token for user: {request.email} (ID: {user.id})")
        token = user_auth.create_password_reset_token(db, request.email, user.id)
        background_tasks.add_task(user_auth.send_password_reset_email, request.email, token)
    else:
        logger.info(f"Password reset requested for non-existent email: {request.email}")

    return {"message": "If your email is registered, you will receive password reset instructions."}

@app.post("/reset-password", response_model=Dict[str, str])
def reset_password(reset: schemas.PasswordReset, db: Session = Depends(get_db)):
    logger.info(f"Password reset attempt with token: {reset.token}")
    # Validate password complexity
    if not user_auth.validate_password(reset.new_password):
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters and include uppercase, lowercase, digit, and special character"
        )

    result = user_auth.reset_password(db, reset)
    if result:
        logger.info(f"Password reset successful for token: {reset.token}")
        return {"message": "Password reset successful. You can now log in with your new password."}
    else:
        logger.warning(f"Password reset failed for token: {reset.token}")
        raise HTTPException(status_code=400, detail="Invalid or expired password reset token")

# User profile management
@app.get("/profile", response_model=schemas.User)
def get_user_profile(current_user: schemas.User = Depends(auth.get_current_active_user)):
    return current_user

@app.put("/profile", response_model=schemas.User)
def update_user_profile(user_update: schemas.UserUpdate,
                        current_user: schemas.User = Depends(auth.get_current_active_user),
                        db: Session = Depends(get_db)):
    # Users can't update their own role or active status
    if user_update.role is not None or user_update.is_active is not None:
        if not user_auth.is_admin(current_user):
            raise HTTPException(status_code=403, detail="Not authorized to change role or active status")

    # Update the user profile
    updated_user = user_auth.update_user(db, current_user.id, user_update)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")

    return updated_user

# Admin-only user management endpoints
@app.get("/admin/users", response_model=List[schemas.User])
def get_all_users(skip: int = 0,
                  limit: int = 100,
                  current_user: schemas.User = Depends(auth.get_current_active_user),
                  db: Session = Depends(get_db)):
    if not user_auth.is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to access user management")

    users = user_auth.get_all_users(db, skip, limit)
    return users

@app.get("/admin/users/{user_id}", response_model=schemas.User)
def get_user(user_id: int, current_user: schemas.User = Depends(auth.get_current_active_user), db: Session = Depends(get_db)):
    if not user_auth.is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to access user management")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user

@app.put("/admin/users/{user_id}", response_model=schemas.User)
def admin_update_user(user_id: int,
                      user_update: schemas.UserUpdate,
                      current_user: schemas.User = Depends(auth.get_current_active_user),
                      db: Session = Depends(get_db)):
    if not user_auth.is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to update users")

    updated_user = user_auth.update_user(db, user_id, user_update)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")

    return updated_user

# Data Upload endpoints
@app.post("/admin/get-excel-sheets")
async def get_excel_sheets(
    file: UploadFile = File(...),
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get the list of sheet names from an Excel file"""
    # Check if the user is an admin
    if not user_auth.is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to upload data")

    # Check file extension
    file_extension = os.path.splitext(file.filename)[1].lower()
    is_csv = file_extension == '.csv'
    is_excel = file_extension in ('.xlsx', '.xlsb', '.xlsm', '.xls')

    if not (is_csv or is_excel):
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Please upload an Excel file (.xlsx, .xlsb, .xlsm, .xls) or CSV file (.csv)"
        )

    # Create a temporary file to save the uploaded content
    try:
        suffix = '.csv' if is_csv else '.xlsx'
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            # Read the uploaded file and save it to a temporary file
            shutil.copyfileobj(file.file, temp_file)
            temp_file_path = temp_file.name

        # Get the sheet names
        try:
            if is_csv:
                # CSV files only have one "sheet"
                sheet_names = ["data"]
            else:
                # Use pandas to read Excel file and get sheet names
                excel_file = pd.ExcelFile(temp_file_path)
                sheet_names = excel_file.sheet_names
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error reading Excel file: {str(e)}")

        # Clean up temporary file
        os.unlink(temp_file_path)

        return {"sheets": sheet_names}

    except Exception as e:
        # Ensure temp file is cleaned up even if an error occurs
        if 'temp_file_path' in locals():
            os.unlink(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.post("/admin/upload-data")
async def upload_data(
    file: UploadFile = File(...),
    data_type: str = Form(...),
    sheet_name: str = Form(None),
    dry_run: bool = Form(False),
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    logger.info(f"Data upload initiated: type={data_type}, file={file.filename}, sheet={sheet_name}, dry_run={dry_run}, user_id={current_user.id}")
    """Upload organizational data from Excel file"""
    # Check if the user is an admin
    if not user_auth.is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to upload data")

    # Check file extension
    file_extension = os.path.splitext(file.filename)[1].lower()
    is_csv = file_extension == '.csv'
    is_excel = file_extension in ('.xlsx', '.xlsb', '.xlsm', '.xls')

    if not (is_csv or is_excel):
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Please upload an Excel file (.xlsx, .xlsb, .xlsm, .xls) or CSV file (.csv)"
        )

    # Create a temporary file to save the uploaded content
    try:
        suffix = '.csv' if is_csv else '.xlsx'
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            # Read the uploaded file and save it to a temporary file
            shutil.copyfileobj(file.file, temp_file)
            temp_file_path = temp_file.name

        # Process the Excel file based on data_type
        summary = {}
        if data_type == "organization":
            # For organization structure (areas, tribes, squads, team members)
            try:
                from load_prod_data import load_data_from_excel

                db_session = db
                # Use the provided sheet_name or default to "Sheet1"
                selected_sheet = sheet_name or "Sheet1"
                # Process the file with append_mode=True to update existing data
                load_data_from_excel(temp_file_path, db_session, append_mode=True,
                                     sheet_name=selected_sheet, run_compatibility_check=False)
                sheet_info = f" from sheet '{selected_sheet}'" if not is_csv else ""
                summary = {"message": f"Organization data processed successfully{sheet_info}."}
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error processing organization data: {str(e)}")
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error processing organization data: {str(e)}")
        elif data_type == "services":
            # For services data
            try:
                from load_prod_data import load_services_data

                db_session = db
                # Use the provided sheet_name or default to "Services"
                selected_sheet = sheet_name or "Services"
                # Process the file with append_mode=True to update existing data
                load_services_data(temp_file_path, db_session, append_mode=True,
                                   sheet_name=selected_sheet, run_compatibility_check=False)
                sheet_info = f" from sheet '{selected_sheet}'" if not is_csv else ""
                summary = {"message": f"Services data processed successfully{sheet_info}."}
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error processing services data: {str(e)}")
        elif data_type == "dependencies":
            # For dependencies data (only supported in CSV format)
            if not is_csv:
                raise HTTPException(status_code=400, detail="Dependencies data must be uploaded in CSV format")
            try:
                from load_dependencies_data import load_dependencies_from_csv

                db_session = db
                # Process the file with append_mode=True to update existing data
                load_dependencies_from_csv(temp_file_path, db_session, append_mode=True)
                summary = {"message": "Dependencies data processed successfully."}
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error processing dependencies data: {str(e)}")
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported data type: {data_type}")

        # Log the data upload action
        audit_logger.log_data_upload(
            db=db,
            user_id=current_user.id,
            data_type=data_type,
            is_dry_run=dry_run,
            sheet_name=sheet_name
        )

        # Clean up temporary file
        os.unlink(temp_file_path)

        return {"success": True, "summary": summary}

    except Exception as e:
        # Ensure temp file is cleaned up even if an error occurs
        if 'temp_file_path' in locals():
            os.unlink(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Error processing upload: {str(e)}")

# Admin settings endpoints
@app.get("/admin/settings", response_model=List[schemas.AdminSetting])
def get_admin_settings(current_user: schemas.User = Depends(auth.get_current_active_user), db: Session = Depends(get_db)):
    if not user_auth.is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to access admin settings")

    settings = user_auth.get_admin_settings(db)
    return settings

@app.get("/admin/settings/{key}", response_model=schemas.AdminSetting)
def get_admin_setting(key: str,
                      current_user: schemas.User = Depends(auth.get_current_active_user),
                      db: Session = Depends(get_db)):
    if not user_auth.is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to access admin settings")

    setting = user_auth.get_admin_setting(db, key)
    if not setting:
        raise HTTPException(status_code=404, detail=f"Setting with key '{key}' not found")

    return setting

@app.put("/admin/settings/{key}", response_model=schemas.AdminSetting)
def update_admin_setting(key: str,
                         setting: schemas.AdminSettingUpdate,
                         current_user: schemas.User = Depends(auth.get_current_active_user),
                         db: Session = Depends(get_db)):
    if not user_auth.is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to update admin settings")

    updated_setting = user_auth.update_admin_setting(db, setting, key, current_user.id)
    return updated_setting

# Audit log endpoints
@app.get("/admin/audit-logs", response_model=List[schemas.AuditLog])
def get_audit_logs(skip: int = 0,
                   limit: int = 100,
                   current_user: schemas.User = Depends(auth.get_current_active_user),
                   db: Session = Depends(get_db)):
    if not user_auth.is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to access audit logs")

    logs = user_auth.get_audit_logs(db, skip, limit)
    return logs

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Team API Portal Backend"}

# Serve template CSV files directly
@app.get("/dependencies_template.csv")
async def get_dependencies_template():
    # Read the template file
    template_path = os.path.join(os.path.dirname(__file__), "dependencies_template.csv")
    with open(template_path, "r") as f:
        content = f.read()
    # Return with appropriate headers
    return Response(
        content=content,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=dependencies_template.csv"
        }
    )

@app.get("/organization_template.csv")
async def get_organization_template():
    # Read the template file
    template_path = os.path.join(os.path.dirname(__file__), "organization_template.csv")
    with open(template_path, "r") as f:
        content = f.read()
    # Return with appropriate headers
    return Response(
        content=content,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=organization_template.csv"
        }
    )

@app.get("/services_template.csv")
async def get_services_template():
    # Read the template file
    template_path = os.path.join(os.path.dirname(__file__), "services_template.csv")
    with open(template_path, "r") as f:
        content = f.read()
    # Return with appropriate headers
    return Response(
        content=content,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=services_template.csv"
        }
    )

# System information endpoint
@app.get("/system/info", response_model=schemas.SystemInfo)
def get_system_info(current_user: schemas.User = Depends(auth.get_current_active_user), db: Session = Depends(get_db)):
    """Get system information including database version and initialization status"""
    if not user_auth.is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to access system information")

    system_info = db.query(models.SystemInfo).first()
    if not system_info:
        raise HTTPException(status_code=404, detail="System information not found")

    return system_info

# Squad team type endpoints
@app.put("/squads/{squad_id}/team-type")
def update_squad_team_type(
    squad_id: int,
    team_type: str,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a squad's team type classification"""
    # Normalize team_type to lowercase to ensure consistent values
    normalized_team_type = team_type.lower() if team_type else "stream_aligned"
    # Validate it against allowed values
    valid_types = ["stream_aligned", "platform", "enabling", "complicated_subsystem"]
    if normalized_team_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid team_type. Input should be one of: {', '.join(valid_types)}"
        )

    squad = user_crud.update_squad_team_type(db, squad_id, normalized_team_type, current_user.id)
    if not squad:
        raise HTTPException(status_code=404, detail="Squad not found")
    return {"message": f"Team type updated to {normalized_team_type}", "team_type": normalized_team_type}

# Area label endpoint
@app.put("/areas/{area_id}/label")
def update_area_label(
    area_id: int,
    label: Optional[str] = None,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update an area's classification label"""
    area = crud.get_area(db, area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")

    # Get the current label for logging
    old_label = area.label.name if area.label else None

    if label:
        # Normalize to uppercase
        label_upper = label.upper()
        # Validate against known values
        if label_upper not in ["CFU_ALIGNED", "PLATFORM_GROUP", "DIGITAL"]:
            valid_labels = ["CFU_ALIGNED", "PLATFORM_GROUP", "DIGITAL"]
            raise HTTPException(
                status_code=400,
                detail=f"Invalid label. Valid options are: {', '.join(valid_labels)}"
            )

        # Set the label as a string
        area.label = label_upper
    else:
        # If label is None or empty string, remove the current label
        area.label = None

    db.commit()
    db.refresh(area)

    # Log the label update
    new_label = area.label.name if area.label else None
    audit_logger.log_label_update(db, current_user.id, "area", area_id, old_label, new_label)

    return {"message": f"Area label updated to {label if label else 'None'}", "label": label}

# Tribe label endpoint
@app.put("/tribes/{tribe_id}/label")
def update_tribe_label(
    tribe_id: int,
    label: Optional[str] = None,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a tribe's classification label"""
    tribe = crud.get_tribe(db, tribe_id)
    if not tribe:
        raise HTTPException(status_code=404, detail="Tribe not found")

    # Get the current label for logging
    old_label = tribe.label.name if tribe.label else None

    if label:
        # Normalize to uppercase
        label_upper = label.upper()
        # Validate against known values
        if label_upper not in ["CFU_ALIGNED", "PLATFORM_GROUP", "DIGITAL"]:
            valid_labels = ["CFU_ALIGNED", "PLATFORM_GROUP", "DIGITAL"]
            raise HTTPException(
                status_code=400,
                detail=f"Invalid label. Valid options are: {', '.join(valid_labels)}"
            )

        # Set the label as a string
        tribe.label = label_upper
    else:
        # If label is None or empty string, remove the current label
        tribe.label = None

    db.commit()
    db.refresh(tribe)

    # Log the label update
    new_label = tribe.label.name if tribe.label else None
    audit_logger.log_label_update(db, current_user.id, "tribe", tribe_id, old_label, new_label)

    return {"message": f"Tribe label updated to {label if label else 'None'}", "label": label}

# Squad contact info and documentation links endpoint
@app.put("/squads/{squad_id}/contact-info", response_model=schemas.Squad)
def update_squad_contact_info(
    squad_id: int,
    contact_info: schemas.SquadBase,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a squad's contact information and documentation links"""
    squad = crud.get_squad(db, squad_id)
    if not squad:
        raise HTTPException(status_code=404, detail="Squad not found")

    # Update only contact and documentation fields
    squad.teams_channel = contact_info.teams_channel
    squad.slack_channel = contact_info.slack_channel
    squad.email_contact = contact_info.email_contact
    squad.documentation_url = contact_info.documentation_url
    squad.jira_board_url = contact_info.jira_board_url

    db.commit()
    db.refresh(squad)

    return squad

# Description editing endpoints
@app.get("/descriptions/{entity_type}/{entity_id}")
def get_description(entity_type: str, entity_id: int, db: Session = Depends(get_db)):
    if entity_type not in ["area", "tribe", "squad"]:
        raise HTTPException(status_code=400, detail="Invalid entity type")

    description = user_crud.get_entity_description(db, entity_type, entity_id)
    if description is None:
        raise HTTPException(status_code=404, detail=f"{entity_type.capitalize()} not found")

    return {"description": description}

@app.put("/descriptions/{entity_type}/{entity_id}", response_model=schemas.DescriptionEdit)
def update_description(
    entity_type: str,
    entity_id: int,
    description_update: schemas.DescriptionUpdate,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if entity_type not in ["area", "tribe", "squad"]:
        raise HTTPException(status_code=400, detail="Invalid entity type")

    # Update the description
    edit = user_crud.update_entity_description(
        db,
        entity_type,
        entity_id,
        description_update.description,
        current_user.id
    )

    if edit is None:
        raise HTTPException(status_code=404, detail=f"{entity_type.capitalize()} not found")

    # Log the description update
    audit_logger.log_description_update(db, current_user.id, entity_type, entity_id)

    return edit

@app.get("/descriptions/{entity_type}/{entity_id}/history", response_model=List[schemas.DescriptionEdit])
def get_description_history(
    entity_type: str,
    entity_id: int,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if entity_type not in ["area", "tribe", "squad"]:
        raise HTTPException(status_code=400, detail="Invalid entity type")

    history = user_crud.get_description_edit_history(db, entity_type, entity_id)
    return history

# Areas Admin endpoints
@app.post("/admin/areas", response_model=schemas.Area, status_code=201)
def create_area(
    area: schemas.AreaBase,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if user is admin
    if not user_auth.is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to create areas")

    try:
        return entity_crud.create_area(db, area, current_user.id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating area: {str(e)}")

@app.put("/admin/areas/{area_id}", response_model=schemas.Area)
def update_area(
    area_id: int,
    area: schemas.AreaBase,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if user is admin
    if not user_auth.is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to update areas")

    # Update the area
    updated_area = entity_crud.update_area(db, area_id, area, current_user.id)
    if not updated_area:
        raise HTTPException(status_code=404, detail="Area not found")

    return updated_area

# Areas
@app.get("/areas", response_model=List[schemas.Area])
def get_areas(db: Session = Depends(get_db)):
    areas = crud.get_areas(db)

    # Convert enum values to strings for all areas
    for area in areas:
        if area.label:
            if hasattr(area.label, 'name'):
                area.label_str = area.label.name
        else:
            area.label_str = None

    return areas

@app.get("/areas/{area_id}", response_model=schemas.AreaDetail)
def get_area(area_id: int, db: Session = Depends(get_db)):
    area = crud.get_area(db, area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")

    # Manually convert area.label to string if it's an enum
    if area.label:
        print(f"Area label in database: {area.label} (type: {type(area.label)})")
        # Store the label value for the schema
        if hasattr(area.label, 'name'):
            area.label_str = area.label.name
    else:
        area.label_str = None

    return area

# Tribes Admin endpoints
@app.post("/admin/tribes", response_model=schemas.Tribe, status_code=201)
def create_tribe(
    tribe: schemas.TribeBase,
    area_id: int,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if user is admin
    if not user_auth.is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to create tribes")

    # Check if the area exists
    area = crud.get_area(db, area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")

    try:
        return entity_crud.create_tribe(db, tribe, area_id, current_user.id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating tribe: {str(e)}")

@app.put("/admin/tribes/{tribe_id}", response_model=schemas.Tribe)
def update_tribe(
    tribe_id: int,
    tribe: schemas.TribeBase,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if user is admin
    if not user_auth.is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to update tribes")

    # Update the tribe
    updated_tribe = entity_crud.update_tribe(db, tribe_id, tribe, current_user.id)
    if not updated_tribe:
        raise HTTPException(status_code=404, detail="Tribe not found")

    return updated_tribe

@app.put("/admin/tribes/{tribe_id}/area", response_model=schemas.Tribe)
def update_tribe_area(
    tribe_id: int,
    area_id: int,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if user is admin
    if not user_auth.is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to update tribes")

    # Check if the area exists
    area = crud.get_area(db, area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")

    # Move the tribe to the new area
    updated_tribe = entity_crud.update_tribe_area(db, tribe_id, area_id, current_user.id)
    if not updated_tribe:
        raise HTTPException(status_code=404, detail="Tribe not found")

    return updated_tribe

# Tribes
@app.get("/tribes", response_model=List[schemas.Tribe])
def get_tribes(area_id: Optional[int] = None, db: Session = Depends(get_db)):
    if area_id:
        tribes = crud.get_tribes_by_area(db, area_id)
    else:
        tribes = crud.get_tribes(db)

    # Convert enum values to strings for all tribes
    for tribe in tribes:
        if tribe.label:
            if hasattr(tribe.label, 'name'):
                tribe.label_str = tribe.label.name
        else:
            tribe.label_str = None

    return tribes

@app.get("/tribes/{tribe_id}", response_model=schemas.TribeDetail)
def get_tribe(tribe_id: int, db: Session = Depends(get_db)):
    tribe = crud.get_tribe(db, tribe_id)
    if not tribe:
        raise HTTPException(status_code=404, detail="Tribe not found")

    # Manually convert tribe.label to string if it's an enum
    if tribe.label:
        print(f"Tribe label in database: {tribe.label} (type: {type(tribe.label)})")
        # Store the label value for the schema
        if hasattr(tribe.label, 'name'):
            tribe.label_str = tribe.label.name
    else:
        tribe.label_str = None
        print("No tribe label found in database")

    return tribe

# Squads Admin endpoints
@app.post("/admin/squads", response_model=schemas.Squad, status_code=201)
def create_squad(
    squad: schemas.SquadBase,
    tribe_id: int,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if user is admin
    if not user_auth.is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to create squads")

    # Check if the tribe exists
    tribe = crud.get_tribe(db, tribe_id)
    if not tribe:
        raise HTTPException(status_code=404, detail="Tribe not found")

    try:
        return entity_crud.create_squad(db, squad, tribe_id, current_user.id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating squad: {str(e)}")

@app.put("/admin/squads/{squad_id}", response_model=schemas.Squad)
def update_squad(
    squad_id: int,
    squad: schemas.SquadBase,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if user is admin
    if not user_auth.is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to update squads")

    # Update the squad
    updated_squad = entity_crud.update_squad(db, squad_id, squad, current_user.id)
    if not updated_squad:
        raise HTTPException(status_code=404, detail="Squad not found")

    return updated_squad

@app.put("/admin/squads/{squad_id}/tribe", response_model=schemas.Squad)
def update_squad_tribe(
    squad_id: int,
    tribe_id: int,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if user is admin
    if not user_auth.is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to update squads")

    # Check if the tribe exists
    tribe = crud.get_tribe(db, tribe_id)
    if not tribe:
        raise HTTPException(status_code=404, detail="Tribe not found")

    # Move the squad to the new tribe
    updated_squad = entity_crud.update_squad_tribe(db, squad_id, tribe_id, current_user.id)
    if not updated_squad:
        raise HTTPException(status_code=404, detail="Squad not found")

    return updated_squad

# Squads
@app.get("/squads", response_model=List[schemas.Squad])
def get_squads(tribe_id: Optional[int] = None, db: Session = Depends(get_db)):
    if tribe_id:
        squads = crud.get_squads_by_tribe(db, tribe_id)
    else:
        squads = crud.get_squads(db)
    return squads

@app.get("/squads/{squad_id}", response_model=schemas.SquadDetail)
def get_squad(squad_id: int, db: Session = Depends(get_db)):
    squad = crud.get_squad(db, squad_id)
    if not squad:
        raise HTTPException(status_code=404, detail="Squad not found")
    # Use from_orm method to convert model to response schema
    return schemas.SquadDetail.from_orm(squad)

# Team Members
@app.get("/team-members", response_model=List[schemas.TeamMember])
def get_team_members(squad_id: Optional[int] = None, db: Session = Depends(get_db)):
    if squad_id:
        members = crud.get_team_members_by_squad(db, squad_id)
    else:
        members = crud.get_team_members(db)
    return members

@app.get("/team-members/{member_id}", response_model=schemas.TeamMemberDetail)
def get_team_member(member_id: int, db: Session = Depends(get_db)):
    member = crud.get_team_member(db, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")

    # Create a response model with explicit model conversion to avoid validation errors
    return schemas.TeamMemberDetail.from_orm(member)

# Services
@app.get("/services", response_model=List[schemas.Service])
def get_services(squad_id: Optional[int] = None, db: Session = Depends(get_db)):
    if squad_id:
        services = crud.get_services_by_squad(db, squad_id)
    else:
        services = crud.get_services(db)
    return services

@app.get("/services/{service_id}", response_model=schemas.ServiceDetail)
def get_service(service_id: int, db: Session = Depends(get_db)):
    service = crud.get_service(db, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service

@app.post("/services", response_model=schemas.Service, status_code=201)
def create_service(
    service: schemas.ServiceCreate,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verify the squad exists
    squad = crud.get_squad(db, service.squad_id)
    if not squad:
        raise HTTPException(status_code=404, detail="Squad not found")

    return crud.create_service(db, service)

@app.put("/services/{service_id}", response_model=schemas.Service)
def update_service(
    service_id: int,
    service_update: schemas.ServiceUpdate,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    updated_service = crud.update_service(db, service_id, service_update)
    if not updated_service:
        raise HTTPException(status_code=404, detail="Service not found")
    return updated_service

@app.delete("/services/{service_id}", status_code=204)
def delete_service(
    service_id: int,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    success = crud.delete_service(db, service_id)
    if not success:
        raise HTTPException(status_code=404, detail="Service not found")
    return None

# Dependencies
@app.get("/dependencies/{squad_id}", response_model=List[schemas.Dependency])
def get_dependencies(squad_id: int, db: Session = Depends(get_db)):
    dependencies = crud.get_dependencies(db, squad_id)
    return dependencies

@app.get("/dependencies", response_model=List[schemas.Dependency])
def get_all_dependencies(db: Session = Depends(get_db)):
    dependencies = crud.get_all_dependencies(db)
    return dependencies

@app.post("/dependencies", response_model=schemas.Dependency, status_code=201)
def create_dependency(
    dependency: schemas.DependencyBase,
    dependent_id: int,
    dependency_id: int,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verify both squads exist
    dependent_squad = crud.get_squad(db, dependent_id)
    dependency_squad = crud.get_squad(db, dependency_id)

    if not dependent_squad or not dependency_squad:
        raise HTTPException(status_code=404, detail="One or both squads not found")

    return crud.create_dependency(db, dependent_id, dependency_id, dependency)

@app.put("/dependencies/{dependency_id}", response_model=schemas.Dependency)
def update_dependency(
    dependency_id: int,
    dependency_update: schemas.DependencyBase,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    updated_dependency = crud.update_dependency(db, dependency_id, dependency_update)
    if not updated_dependency:
        raise HTTPException(status_code=404, detail="Dependency not found")
    return updated_dependency

@app.delete("/dependencies/{dependency_id}", status_code=204)
def delete_dependency(
    dependency_id: int,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    success = crud.delete_dependency(db, dependency_id)
    if not success:
        raise HTTPException(status_code=404, detail="Dependency not found")
    return None

# On-call roster
@app.get("/on-call/{squad_id}", response_model=schemas.OnCallRoster)
def get_on_call(squad_id: int, db: Session = Depends(get_db)):
    on_call = crud.get_on_call(db, squad_id)
    if not on_call:
        raise HTTPException(status_code=404, detail="On-call roster not found")
    return on_call

# OKR endpoints
@app.get("/objectives", response_model=List[schemas.Objective])
def get_objectives(
    area_id: Optional[int] = None,
    tribe_id: Optional[int] = None,
    squad_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    objectives = crud.get_objectives(db, area_id, tribe_id, squad_id)
    return objectives

@app.get("/objectives/{objective_id}", response_model=schemas.Objective)
def get_objective(objective_id: int, db: Session = Depends(get_db)):
    objective = crud.get_objective(db, objective_id)
    if not objective:
        raise HTTPException(status_code=404, detail="Objective not found")
    return objective

@app.post("/objectives", response_model=schemas.Objective, status_code=201)
def create_objective(
    objective: schemas.ObjectiveCreate,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check that at least one of area_id, tribe_id, or squad_id is provided
    if not any([objective.area_id, objective.tribe_id, objective.squad_id]):
        raise HTTPException(status_code=400, detail="At least one of area_id, tribe_id, or squad_id must be provided")

    # If area_id is provided, verify it exists
    if objective.area_id:
        area = crud.get_area(db, objective.area_id)
        if not area:
            raise HTTPException(status_code=404, detail="Area not found")

    # If tribe_id is provided, verify it exists
    if objective.tribe_id:
        tribe = crud.get_tribe(db, objective.tribe_id)
        if not tribe:
            raise HTTPException(status_code=404, detail="Tribe not found")

    # If squad_id is provided, verify it exists
    if objective.squad_id:
        squad = crud.get_squad(db, objective.squad_id)
        if not squad:
            raise HTTPException(status_code=404, detail="Squad not found")

    # Create the objective
    new_objective = crud.create_objective(db, objective)

    # Log the objective creation
    entity_type = None
    entity_id = None
    if objective.area_id:
        entity_type = "area"
        entity_id = objective.area_id
    elif objective.tribe_id:
        entity_type = "tribe"
        entity_id = objective.tribe_id
    elif objective.squad_id:
        entity_type = "squad"
        entity_id = objective.squad_id

    audit_logger.log_objective_action(
        db=db,
        user_id=current_user.id,
        action="create",
        objective_id=new_objective.id,
        entity_type=entity_type,
        entity_id=entity_id
    )

    return new_objective

@app.put("/objectives/{objective_id}", response_model=schemas.Objective)
def update_objective(
    objective_id: int,
    objective: schemas.ObjectiveUpdate,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    updated_objective = crud.update_objective(db, objective_id, objective)
    if not updated_objective:
        raise HTTPException(status_code=404, detail="Objective not found")

    # Log the objective update
    audit_logger.log_objective_action(
        db=db,
        user_id=current_user.id,
        action="update",
        objective_id=objective_id
    )

    return updated_objective

@app.delete("/objectives/{objective_id}", status_code=204)
def delete_objective(
    objective_id: int,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Get the objective first for logging
    objective = crud.get_objective(db, objective_id)
    if not objective:
        raise HTTPException(status_code=404, detail="Objective not found")

    # Delete the objective
    success = crud.delete_objective(db, objective_id)
    if not success:
        raise HTTPException(status_code=404, detail="Objective not found")

    # Log the objective deletion
    entity_type = None
    entity_id = None
    if objective.area_id:
        entity_type = "area"
        entity_id = objective.area_id
    elif objective.tribe_id:
        entity_type = "tribe"
        entity_id = objective.tribe_id
    elif objective.squad_id:
        entity_type = "squad"
        entity_id = objective.squad_id

    audit_logger.log_objective_action(
        db=db,
        user_id=current_user.id,
        action="delete",
        objective_id=objective_id,
        entity_type=entity_type,
        entity_id=entity_id
    )

    return None

@app.get("/key-results", response_model=List[schemas.KeyResult])
def get_key_results(objective_id: Optional[int] = None, db: Session = Depends(get_db)):
    key_results = crud.get_key_results(db, objective_id)
    return key_results

@app.get("/key-results/{key_result_id}", response_model=schemas.KeyResult)
def get_key_result(key_result_id: int, db: Session = Depends(get_db)):
    key_result = crud.get_key_result(db, key_result_id)
    if not key_result:
        raise HTTPException(status_code=404, detail="Key Result not found")
    return key_result

@app.post("/key-results", response_model=schemas.KeyResult, status_code=201)
def create_key_result(
    key_result: schemas.KeyResultCreate,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verify the objective exists
    objective = crud.get_objective(db, key_result.objective_id)
    if not objective:
        raise HTTPException(status_code=404, detail="Objective not found")

    # Create the key result
    new_key_result = crud.create_key_result(db, key_result)

    # Log the key result creation
    audit_logger.log_key_result_action(
        db=db,
        user_id=current_user.id,
        action="create",
        key_result_id=new_key_result.id,
        objective_id=key_result.objective_id
    )

    return new_key_result

@app.put("/key-results/{key_result_id}", response_model=schemas.KeyResult)
def update_key_result(
    key_result_id: int,
    key_result: schemas.KeyResultUpdate,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    updated_key_result = crud.update_key_result(db, key_result_id, key_result)
    if not updated_key_result:
        raise HTTPException(status_code=404, detail="Key Result not found")

    # Log the key result update
    audit_logger.log_key_result_action(
        db=db,
        user_id=current_user.id,
        action="update",
        key_result_id=key_result_id,
        objective_id=updated_key_result.objective_id
    )

    return updated_key_result

@app.delete("/key-results/{key_result_id}", status_code=204)
def delete_key_result(
    key_result_id: int,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Get the key result first for logging
    key_result = crud.get_key_result(db, key_result_id)
    if not key_result:
        raise HTTPException(status_code=404, detail="Key Result not found")

    # Store the objective_id for logging
    objective_id = key_result.objective_id

    # Delete the key result
    success = crud.delete_key_result(db, key_result_id)
    if not success:
        raise HTTPException(status_code=404, detail="Key Result not found")

    # Log the key result deletion
    audit_logger.log_key_result_action(
        db=db,
        user_id=current_user.id,
        action="delete",
        key_result_id=key_result_id,
        objective_id=objective_id
    )

    return None

# Search
@app.get("/search", response_model=SearchResults)
def search(q: str, limit: int = 20, db: Session = Depends(get_db)):
    """
    Search across all entity types (areas, tribes, squads, people, services)
    Requires at least 3 characters to perform a search
    """
    # Clean and validate the search query
    search_query = q.strip()
    if len(search_query) < 3:
        return SearchResults(results=[], total=0)

    # Execute the search
    results = search_crud.search_all(db, search_query, limit)
    return SearchResults(results=results, total=len(results))

# Repository search endpoints
@app.get("/repositories/search")
def search_repositories(q: str, limit: int = 20, db: Session = Depends(get_db)):
    """
    Search for repositories across configured platforms (GitHub, GitLab, etc.)
    Requires at least 3 characters to perform a search
    """
    # Clean and validate the search query
    search_query = q.strip()
    if len(search_query) < 3:
        return {"results": [], "total": 0}

    # Initialize repository service
    repo_service = RepositoryService(db)

    # Execute the search
    results = repo_service.search_repositories(search_query, limit)
    return {"results": results, "total": len(results)}

@app.get("/repositories/{repo_id}/details")
def get_repository_details(repo_id: int, source: str = "gitlab", db: Session = Depends(get_db)):
    """
    Get detailed information about a specific repository
    """
    # Initialize repository service
    repo_service = RepositoryService(db)

    # Get repository details
    details = repo_service.get_repository_details(repo_id, source)
    if not details:
        raise HTTPException(status_code=404, detail="Repository not found")

    return details

@app.get("/repositories/group/{group_id}/projects")
def get_group_projects(group_id: int, source: str = "gitlab", limit: int = 50, db: Session = Depends(get_db)):
    """
    Get all projects (repositories) in a group/organization
    """
    # Initialize repository service
    repo_service = RepositoryService(db)

    # Get projects in the group
    projects = repo_service.get_group_projects(group_id, source, limit)
    return {"results": projects, "total": len(projects)}

if __name__ == "__main__":
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description="Who What Where Portal Backend")
    parser.add_argument("--force-initdb", action="store_true", help="Force database initialisation (DANGER: Will reset all data)")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind the server to (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind the server to (default: 8000)")
    parser.add_argument("--admin-username", default="admin", help="Admin username (default: admin)")
    parser.add_argument("--admin-email", default="admin@example.com", help="Admin email (default: admin@example.com)")
    parser.add_argument("--db-type", choices=["sqlite", "postgresql"], help="Database type (sqlite or postgresql)")
    parser.add_argument("--connection-string", help="Database connection string")
    parser.add_argument("--schema", help="Database schema name (PostgreSQL only)")
    args = parser.parse_args()

    logger.info(f"Starting server with arguments: host={args.host}, port={args.port}, force_initdb={args.force_initdb}")

    # Set environment variables based on command line arguments
    if args.db_type:
        os.environ["DB_TYPE"] = args.db_type

    if args.connection_string:
        os.environ["DATABASE_URL"] = args.connection_string

    if args.schema:
        os.environ["DATABASE_SCHEMA"] = args.schema

    # Handle force initialization if requested
    if args.force_initdb:
        logger.warning("Forcing database initialization... THIS WILL RESET ALL DATA")
        print("\033[93mForcing database initialization...\033[0m")
        success = db_initializer.initialize_database(
            admin_username=args.admin_username,
            admin_email=args.admin_email
        )
        if success:
            logger.info("Database initialized successfully!")
            print("\033[92mDatabase initialized successfully!\033[0m")
        else:
            logger.error("Database initialization failed.")
            print("\033[91mDatabase initialization failed. Check the logs for details.\033[0m")
            sys.exit(1)

    # Start the server
    logger.info(f"Starting Uvicorn server at {args.host}:{args.port}")
    uvicorn.run("main:app", host=args.host, port=args.port, reload=True)
