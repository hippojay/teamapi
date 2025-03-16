from fastapi import FastAPI, HTTPException, Depends, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional, Union, Dict, Any
import uvicorn
from datetime import timedelta, datetime

from database import get_db, engine, Base
import models
import schemas
import crud
import search_crud
import user_crud
import user_auth
import auth
import audit_logger
from search_schemas import SearchResults, SearchResultItem

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize allowed email domains setting if it doesn't exist
from initialize_email_domains import initialize_email_domains
initialize_email_domains()

app = FastAPI(title="Team API Portal")

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
    audit_logger.log_login(db, user.id, user.username or user.email)
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: schemas.User = Depends(auth.get_current_active_user)):
    return current_user

@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(auth.get_current_active_user)):
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
    
    # Create user with full details (use email as username if not provided)
    username = user.username if user.username else user.email
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        username=username,
        email=user.email,
        hashed_password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        role=models.UserRole[user.role] if user.role else models.UserRole.guest,
        is_active=True,  # Admins can create pre-verified users
        is_admin=user.is_admin
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Log the user creation
    user_auth.log_user_action(db, current_user.id, "CREATE", "User", db_user.id, f"User created by admin: {user.email}")
    
    return db_user

@app.post("/register", response_model=Dict[str, Any])
def register_user(user: schemas.UserRegister, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
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
    if user_auth.verify_email(db, verification):
        return {"message": "Email verified successfully. You can now log in."}
    else:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

@app.post("/reset-password-request", response_model=Dict[str, str])
def request_password_reset(request: schemas.PasswordResetRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Always return success even if email doesn't exist (security best practice)
    user = user_auth.get_user_by_email(db, request.email)
    if user:
        token = user_auth.create_password_reset_token(db, request.email, user.id)
        background_tasks.add_task(user_auth.send_password_reset_email, request.email, token)
    
    return {"message": "If your email is registered, you will receive password reset instructions."}

@app.post("/reset-password", response_model=Dict[str, str])
def reset_password(reset: schemas.PasswordReset, db: Session = Depends(get_db)):
    # Validate password complexity
    if not user_auth.validate_password(reset.new_password):
        raise HTTPException(
            status_code=400, 
            detail="Password must be at least 8 characters and include uppercase, lowercase, digit, and special character"
        )
    
    if user_auth.reset_password(db, reset):
        return {"message": "Password reset successful. You can now log in with your new password."}
    else:
        raise HTTPException(status_code=400, detail="Invalid or expired password reset token")

# User profile management
@app.get("/profile", response_model=schemas.User)
def get_user_profile(current_user: schemas.User = Depends(auth.get_current_active_user)):
    return current_user

@app.put("/profile", response_model=schemas.User)
def update_user_profile(user_update: schemas.UserUpdate, current_user: schemas.User = Depends(auth.get_current_active_user), db: Session = Depends(get_db)):
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
def get_all_users(skip: int = 0, limit: int = 100, current_user: schemas.User = Depends(auth.get_current_active_user), db: Session = Depends(get_db)):
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
def admin_update_user(user_id: int, user_update: schemas.UserUpdate, current_user: schemas.User = Depends(auth.get_current_active_user), db: Session = Depends(get_db)):
    if not user_auth.is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to update users")
    
    updated_user = user_auth.update_user(db, user_id, user_update)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return updated_user

# Admin settings endpoints
@app.get("/admin/settings", response_model=List[schemas.AdminSetting])
def get_admin_settings(current_user: schemas.User = Depends(auth.get_current_active_user), db: Session = Depends(get_db)):
    if not user_auth.is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to access admin settings")
    
    settings = user_auth.get_admin_settings(db)
    return settings

@app.get("/admin/settings/{key}", response_model=schemas.AdminSetting)
def get_admin_setting(key: str, current_user: schemas.User = Depends(auth.get_current_active_user), db: Session = Depends(get_db)):
    if not user_auth.is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to access admin settings")
    
    setting = user_auth.get_admin_setting(db, key)
    if not setting:
        raise HTTPException(status_code=404, detail=f"Setting with key '{key}' not found")
    
    return setting

@app.put("/admin/settings/{key}", response_model=schemas.AdminSetting)
def update_admin_setting(key: str, setting: schemas.AdminSettingUpdate, current_user: schemas.User = Depends(auth.get_current_active_user), db: Session = Depends(get_db)):
    if not user_auth.is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to update admin settings")
    
    updated_setting = user_auth.update_admin_setting(db, setting, key, current_user.id)
    return updated_setting

# Audit log endpoints
@app.get("/admin/audit-logs", response_model=List[schemas.AuditLog])
def get_audit_logs(skip: int = 0, limit: int = 100, current_user: schemas.User = Depends(auth.get_current_active_user), db: Session = Depends(get_db)):
    if not user_auth.is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to access audit logs")
    
    logs = user_auth.get_audit_logs(db, skip, limit)
    return logs

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Team API Portal Backend"}

# Squad team type endpoints
@app.put("/squads/{squad_id}/team-type")
def update_squad_team_type(
    squad_id: int,
    team_type: str,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a squad's team type classification"""
    squad = user_crud.update_squad_team_type(db, squad_id, team_type, current_user.id)
    if not squad:
        raise HTTPException(status_code=404, detail="Squad not found")
    return {"message": f"Team type updated to {team_type}", "team_type": team_type}

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
        try:
            # Use lowercase labels now
            area.label = models.AreaLabel[label]
        except KeyError:
            valid_labels = [l.name for l in models.AreaLabel]
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid label. Valid options are: {', '.join(valid_labels)}"
            )
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
        try:
            # Use lowercase labels now
            tribe.label = models.TribeLabel[label]
        except KeyError:
            valid_labels = [l.name for l in models.TribeLabel]
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid label. Valid options are: {', '.join(valid_labels)}"
            )
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
        print("No area label found in database")
    
    return area

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

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
