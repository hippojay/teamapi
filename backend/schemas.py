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
    employment_type: Optional[str] = "core"  # 'core' or 'subcon'
    vendor_name: Optional[str] = None  # Vendor name for contractors
    is_external: bool = False  # Flag for external supervisors

class TeamMember(TeamMemberBase):
    id: int
    supervisor_id: Optional[int] = None
    image_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# This represents a user's membership in a squad with specific capacity
class SquadMembership(BaseModel):
    squad_id: int
    squad_name: str
    capacity: Optional[float] = 1.0
    role: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)
        
class TeamMemberDetail(TeamMember):
    squads: List[SquadMembership] = []
    
    # Completely override the model_from_orm method
    # This ensures we don't try to convert Squad objects directly
    @classmethod
    def from_orm(cls, obj):
        # Extract all the attributes from the object that match our model
        obj_data = {}
        for field in cls.__fields__:
            if field != "squads" and hasattr(obj, field):
                obj_data[field] = getattr(obj, field)
        
        # Create instance without squads first
        instance = cls(**obj_data)
        
        # Handle squad memberships separately
        if hasattr(obj, 'squad_memberships'):
            # Convert the squad_memberships dictionary items to SquadMembership objects
            instance.squads = [SquadMembership(**sm) for sm in obj.squad_memberships]
        else:
            # If squad_memberships is not available, ensure we have an empty list
            instance.squads = []
            
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
    core_count: int = 0
    subcon_count: int = 0
    total_capacity: float
    core_capacity: float = 0.0
    subcon_capacity: float = 0.0

class Squad(SquadBase):
    id: int
    tribe_id: int

    model_config = ConfigDict(from_attributes=True)

class TeamMemberWithCapacity(TeamMember):
    capacity: float = 1.0
    squad_role: Optional[str] = None

class SquadDetail(Squad):
    team_members: List[TeamMemberWithCapacity] = []
    services: List[Service] = []
    on_call: Optional[OnCallRoster] = None
    
    # Override the model_from_orm method to handle team members with capacity
    @classmethod
    def from_orm(cls, obj):
        # Extract all the attributes from the object that match our model
        obj_data = {}
        for field in cls.__fields__:
            if field != "team_members" and hasattr(obj, field):
                obj_data[field] = getattr(obj, field)
        
        # Create instance without team_members first
        instance = cls(**obj_data)
        
        # Process team members with their capacity information
        member_metadata = getattr(obj, 'member_metadata', {})
        
        if hasattr(obj, 'team_members'):
            enhanced_members = []
            
            for member in obj.team_members:
                # Create a base team member from the model
                member_dict = {}
                for key, value in member.__dict__.items():
                    if not key.startswith('_'):
                        member_dict[key] = value
                
                # Add capacity and role from metadata if available
                if member.id in member_metadata:
                    member_dict['capacity'] = member_metadata[member.id]['capacity']
                    if member_metadata[member.id]['squad_role']:
                        member_dict['squad_role'] = member_metadata[member.id]['squad_role']
                        member_dict['role'] = member_metadata[member.id]['squad_role']
                
                enhanced_members.append(TeamMemberWithCapacity(**member_dict))
            
            instance.team_members = enhanced_members
        
        return instance

# Tribe models
class TribeBase(BaseModel):
    name: str
    description: Optional[str] = None
    member_count: int = 0
    core_count: int = 0
    subcon_count: int = 0
    total_capacity: float = 0.0
    core_capacity: float = 0.0
    subcon_capacity: float = 0.0

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
    core_count: int = 0
    subcon_count: int = 0
    total_capacity: float = 0.0
    core_capacity: float = 0.0
    subcon_capacity: float = 0.0

class Area(AreaBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class AreaDetail(Area):
    tribes: List[Tribe] = []
