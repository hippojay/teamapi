from sqlalchemy.orm import Session
from sqlalchemy import or_, func
import models
from search_schemas import SearchResultItem

def search_all(db: Session, query: str, limit: int = 20):
    """
    Search across all entity types: areas, tribes, squads, people, services
    
    This implementation focuses on matching:
    1. Exact matches
    2. Words that start with the search term
    3. Full text only when specifically needed
    """
    if len(query) < 3:
        return []
    
    results = []
    
    # ===== Search Areas =====
    areas = search_areas(db, query, limit)
    results.extend([
        SearchResultItem(
            id=area.id,
            name=area.name,
            type="area",
            description=area.description,
            url=f"/areas/{area.id}"
        ) for area in areas
    ])
    
    # ===== Search Tribes =====
    tribes = search_tribes(db, query, limit)
    results.extend([
        SearchResultItem(
            id=tribe.id,
            name=tribe.name,
            type="tribe",
            description=tribe.description,
            parent_name=tribe.area.name if tribe.area else None,
            url=f"/tribes/{tribe.id}"
        ) for tribe in tribes
    ])
    
    # ===== Search Squads =====
    squads = search_squads(db, query, limit)
    results.extend([
        SearchResultItem(
            id=squad.id,
            name=squad.name,
            type="squad",
            description=squad.description,
            parent_name=squad.tribe.name if squad.tribe else None,
            url=f"/squads/{squad.id}"
        ) for squad in squads
    ])
    
    # ===== Search People =====
    people = search_people(db, query, limit)
    results.extend([
        SearchResultItem(
            id=person.id,
            name=person.name,
            type="person",
            description=person.role,
            parent_name=person.squad.name if person.squad else None,
            url=f"/users/{person.id}"
        ) for person in people
    ])
    
    # ===== Search Services =====
    services = search_services(db, query, limit)
    results.extend([
        SearchResultItem(
            id=service.id,
            name=service.name,
            type="service",
            description=service.description,
            parent_name=service.squad.name if service.squad else None,
            url=f"/services/{service.id}"
        ) for service in services
    ])
    
    # Limit total results to requested limit
    return results[:limit]

def build_word_match_conditions(model_class, field, query):
    """
    Build a set of search conditions that prioritize:
    1. Exact matches
    2. Words beginning with the search term
    3. Whole word matches within the field
    """
    cleaned_query = query.strip().lower()
    
    # Create a version with '%' prefix and suffix for word boundaries
    word_pattern = f"% {cleaned_query}%"
    
    # Create patterns for beginning-of-word matching
    start_pattern = f"{cleaned_query}%"
    
    # Create patterns for word boundaries within text
    word_boundaries = []
    
    # Split the query into words for multi-word searches
    query_words = cleaned_query.split()
    
    # For each word, create a pattern that matches the beginning of a word
    for word in query_words:
        if len(word) >= 3:  # Only if word is meaningful
            word_boundaries.append(f"% {word}%")
    
    # Create the conditions
    conditions = [
        # Exact match (highest priority)
        func.lower(getattr(model_class, field)) == cleaned_query,
        
        # Starts with the query (high priority)
        getattr(model_class, field).ilike(start_pattern),
    ]
    
    # Add word boundary matches
    conditions.append(getattr(model_class, field).ilike(word_pattern))
    
    # Add individual word matches for multi-word queries
    for pattern in word_boundaries:
        conditions.append(getattr(model_class, field).ilike(pattern))
    
    return conditions

def search_areas(db: Session, query: str, limit: int = 20):
    """Search for areas that match the query"""
    conditions = build_word_match_conditions(models.Area, "name", query)
    
    return db.query(models.Area).filter(or_(*conditions)).limit(limit).all()

def search_tribes(db: Session, query: str, limit: int = 20):
    """Search for tribes that match the query"""
    conditions = build_word_match_conditions(models.Tribe, "name", query)
    
    return db.query(models.Tribe).filter(or_(*conditions)).limit(limit).all()

def search_squads(db: Session, query: str, limit: int = 20):
    """Search for squads that match the query"""
    conditions = build_word_match_conditions(models.Squad, "name", query)
    
    return db.query(models.Squad).filter(or_(*conditions)).limit(limit).all()

def search_people(db: Session, query: str, limit: int = 20):
    """
    Search for people by name, prioritizing exact and word beginning matches
    """
    # For people, we want to match first names, last names, or full names
    name_conditions = build_word_match_conditions(models.TeamMember, "name", query)
    
    # We also want to match email addresses (username part preferably)
    email_conditions = [
        models.TeamMember.email.ilike(f"{query}%@%"),  # Username starts with query
        models.TeamMember.email.ilike(f"%@{query}%"),  # Domain starts with query
    ]
    
    # Create combined conditions
    all_conditions = []
    all_conditions.extend(name_conditions)
    all_conditions.extend(email_conditions)
    
    return db.query(models.TeamMember).filter(or_(*all_conditions)).limit(limit).all()

def search_services(db: Session, query: str, limit: int = 20):
    """Search for services by name or description"""
    name_conditions = build_word_match_conditions(models.Service, "name", query)
    desc_conditions = build_word_match_conditions(models.Service, "description", query)
    
    all_conditions = []
    all_conditions.extend(name_conditions) 
    all_conditions.extend(desc_conditions)
    
    return db.query(models.Service).filter(or_(*all_conditions)).limit(limit).all()
