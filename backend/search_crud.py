from sqlalchemy.orm import Session
from sqlalchemy import or_, func
import models
from search_schemas import SearchResultItem

def search_all(db: Session, query: str, limit: int = 20):
    """
    Search across all entity types: areas, tribes, squads, people, services
    """
    if len(query) < 3:
        return []
    
    # Make the query case-insensitive and add wildcards
    search_query = f"%{query}%"
    
    results = []
    
    # Search Areas
    areas = db.query(models.Area).filter(
        models.Area.name.ilike(search_query)
    ).limit(limit).all()
    
    for area in areas:
        results.append(
            SearchResultItem(
                id=area.id,
                name=area.name,
                type="area",
                description=area.description,
                url=f"/areas/{area.id}"
            )
        )
    
    # Search Tribes
    tribes_query = db.query(
        models.Tribe, 
        models.Area.name.label("area_name")
    ).join(
        models.Area, 
        models.Tribe.area_id == models.Area.id
    ).filter(
        models.Tribe.name.ilike(search_query)
    ).limit(limit)
    
    for tribe, area_name in tribes_query:
        results.append(
            SearchResultItem(
                id=tribe.id,
                name=tribe.name,
                type="tribe",
                description=tribe.description,
                parent_name=area_name,
                url=f"/tribes/{tribe.id}"
            )
        )
    
    # Search Squads
    squads_query = db.query(
        models.Squad, 
        models.Tribe.name.label("tribe_name")
    ).join(
        models.Tribe, 
        models.Squad.tribe_id == models.Tribe.id
    ).filter(
        models.Squad.name.ilike(search_query)
    ).limit(limit)
    
    for squad, tribe_name in squads_query:
        results.append(
            SearchResultItem(
                id=squad.id,
                name=squad.name,
                type="squad",
                description=squad.description,
                parent_name=tribe_name,
                url=f"/squads/{squad.id}"
            )
        )
    
    # Search People
    people_query = db.query(
        models.TeamMember, 
        models.Squad.name.label("squad_name")
    ).join(
        models.Squad, 
        models.TeamMember.squad_id == models.Squad.id
    ).filter(
        or_(
            models.TeamMember.name.ilike(search_query),
            models.TeamMember.email.ilike(search_query),
            models.TeamMember.role.ilike(search_query)
        )
    ).limit(limit)
    
    for person, squad_name in people_query:
        results.append(
            SearchResultItem(
                id=person.id,
                name=person.name,
                type="person",
                description=person.role,
                parent_name=squad_name,
                url=f"/squads/{person.squad_id}#member-{person.id}"
            )
        )
    
    # Search Services
    services_query = db.query(
        models.Service, 
        models.Squad.name.label("squad_name")
    ).join(
        models.Squad, 
        models.Service.squad_id == models.Squad.id
    ).filter(
        or_(
            models.Service.name.ilike(search_query),
            models.Service.description.ilike(search_query)
        )
    ).limit(limit)
    
    for service, squad_name in services_query:
        results.append(
            SearchResultItem(
                id=service.id,
                name=service.name,
                type="service",
                description=service.description,
                parent_name=squad_name,
                url=f"/services/{service.id}"
            )
        )
    
    return results
