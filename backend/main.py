from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn

from database import get_db, engine, Base
import models
import schemas
import crud
import search_crud
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

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Team API Portal Backend"}

# Areas
@app.get("/areas", response_model=List[schemas.Area])
def get_areas(db: Session = Depends(get_db)):
    areas = crud.get_areas(db)
    return areas

@app.get("/areas/{area_id}", response_model=schemas.AreaDetail)
def get_area(area_id: int, db: Session = Depends(get_db)):
    area = crud.get_area(db, area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")
    return area

# Tribes
@app.get("/tribes", response_model=List[schemas.Tribe])
def get_tribes(area_id: Optional[int] = None, db: Session = Depends(get_db)):
    if area_id:
        tribes = crud.get_tribes_by_area(db, area_id)
    else:
        tribes = crud.get_tribes(db)
    return tribes

@app.get("/tribes/{tribe_id}", response_model=schemas.TribeDetail)
def get_tribe(tribe_id: int, db: Session = Depends(get_db)):
    tribe = crud.get_tribe(db, tribe_id)
    if not tribe:
        raise HTTPException(status_code=404, detail="Tribe not found")
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
    return squad

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
    return member

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

# Dependencies
@app.get("/dependencies/{squad_id}", response_model=List[schemas.Dependency])
def get_dependencies(squad_id: int, db: Session = Depends(get_db)):
    dependencies = crud.get_dependencies(db, squad_id)
    return dependencies

@app.get("/dependencies", response_model=List[schemas.Dependency])
def get_all_dependencies(db: Session = Depends(get_db)):
    dependencies = crud.get_all_dependencies(db)
    return dependencies

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
