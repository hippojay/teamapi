from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn
from datetime import timedelta

from database import get_db, engine, Base
import models
import schemas
import crud
import search_crud
import user_crud
import auth
from search_schemas import SearchResults, SearchResultItem

# Create database tables
Base.metadata.create_all(bind=engine)

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
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: schemas.User = Depends(auth.get_current_active_user)):
    return current_user

@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = user_crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    db_user = user_crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return user_crud.create_user(db=db, user=user)

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
    
    if label:
        try:
            # Convert string to enum value if provided
            area.label = models.AreaLabel[label.upper()]
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
    
    if label:
        try:
            # Convert string to enum value if provided
            tribe.label = models.TribeLabel[label.upper()]
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
