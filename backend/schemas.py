from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from enum import Enum

# Enums
class ServiceStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    DOWN = "down"

class DependencyType(str, Enum):
    REQUIRED = "required"
    OPTIONAL = "optional"

# Base models
class TeamMemberBase(BaseModel):
    name: str
    email: str
    role: str
    location: Optional[str] = None
    geography: Optional[str] = None
    capacity: float = 1.0

class TeamMember(TeamMemberBase):
    id: int
    squad_id: int
    supervisor_id: Optional[int] = None
    image_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# This represents a user's membership in a squad with specific capacity
class SquadMembership(BaseModel):
    squad_id: int
    squad_name: str
    capacity: float
    role: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)
        
class TeamMemberDetail(TeamMember):
    squads: List[SquadMembership] = []
    
    # Custom constructor to handle squad_memberships property from the DB object
    @classmethod
    def from_orm(cls, obj):
        # Create a regular TeamMemberDetail from the DB object
        instance = super().from_orm(obj)
        
        # Check if the DB object has squad_memberships property (from our custom function)
        if hasattr(obj, 'squad_memberships'):
            # Convert the squad_memberships dictionary items to SquadMembership objects
            instance.squads = [SquadMembership(**sm) for sm in obj.squad_memberships]
            
        return instance

class ServiceBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: ServiceStatus
    uptime: float
    version: str
    api_docs_url: Optional[str] = None

class Service(ServiceBase):
    id: int
    squad_id: int

    model_config = ConfigDict(from_attributes=True)

class ServiceDetail(Service):
    pass

class DependencyBase(BaseModel):
    dependency_name: str
    dependency_type: DependencyType

class Dependency(DependencyBase):
    id: int
    dependent_squad_id: int
    dependency_squad_id: int

    model_config = ConfigDict(from_attributes=True)

class OnCallRosterBase(BaseModel):
    primary_name: str
    primary_contact: Optional[str] = None
    secondary_name: str
    secondary_contact: Optional[str] = None

class OnCallRoster(OnCallRosterBase):
    id: int
    squad_id: int

    model_config = ConfigDict(from_attributes=True)

# Squad models
class SquadBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: str
    timezone: str
    member_count: int
    total_capacity: float

class Squad(SquadBase):
    id: int
    tribe_id: int

    model_config = ConfigDict(from_attributes=True)

class SquadDetail(Squad):
    members: List[TeamMember] = []
    services: List[Service] = []
    on_call: Optional[OnCallRoster] = None

# Tribe models
class TribeBase(BaseModel):
    name: str
    description: Optional[str] = None
    member_count: int = 0
    total_capacity: float = 0.0

class Tribe(TribeBase):
    id: int
    area_id: int

    model_config = ConfigDict(from_attributes=True)

class TribeDetail(Tribe):
    squads: List[Squad] = []

# Area models
class AreaBase(BaseModel):
    name: str
    description: Optional[str] = None
    member_count: int = 0
    total_capacity: float = 0.0

class Area(AreaBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class AreaDetail(Area):
    tribes: List[Tribe] = []
