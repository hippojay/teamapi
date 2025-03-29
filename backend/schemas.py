from pydantic import BaseModel, ConfigDict, EmailStr
from typing import List, Optional
from enum import Enum

from datetime import datetime

# Enums
class ServiceStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    DOWN = "down"

class ServiceType(str, Enum):
    API = "api"
    REPO = "repo"
    PLATFORM = "platform"
    WEBPAGE = "webpage"
    APP_MODULE = "app_module"

# Removed DependencyType enum as per requirement

class InteractionMode(str, Enum):
    COLLABORATION = "collaboration"
    X_AS_A_SERVICE = "x_as_a_service"
    FACILITATING = "facilitating"

class TeamType(str, Enum):
    STREAM_ALIGNED = "stream_aligned"
    PLATFORM = "platform"
    ENABLING = "enabling"
    COMPLICATED_SUBSYSTEM = "complicated_subsystem"

class AreaLabel(str, Enum):
    CFU_ALIGNED = "CFU_ALIGNED"
    PLATFORM_GROUP = "PLATFORM_GROUP"
    DIGITAL = "DIGITAL"

class TribeLabel(str, Enum):
    CFU_ALIGNED = "CFU_ALIGNED"
    PLATFORM_GROUP = "PLATFORM_GROUP"
    DIGITAL = "DIGITAL"

# Base models
class TeamMemberBase(BaseModel):
    name: str
    email: Optional[str] = None
    role: str
    function: Optional[str] = None  # Function/capability (Engineering, Design, Product, etc.)
    location: Optional[str] = None
    geography: Optional[str] = None
    employment_type: Optional[str] = None
    vendor_name: Optional[str] = None  # Vendor name for contractors
    is_external: bool = False  # Flag for external supervisors
    is_vacancy: bool = False  # Flag for vacancy positions

class TeamMember(TeamMemberBase):
    id: int
    supervisor_id: Optional[int] = None
    image_url: Optional[str] = None
    capacity: Optional[float] = None  # Added capacity field for total capacity
    squad_id: Optional[int] = None  # For backwards compatibility

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
    service_type: ServiceType = ServiceType.API
    url: Optional[str] = None

class Service(ServiceBase):
    id: int
    squad_id: int

    model_config = ConfigDict(from_attributes=True)

class ServiceDetail(Service):
    pass

class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    status: ServiceStatus = ServiceStatus.HEALTHY
    uptime: float = 99.9
    version: str = "1.0.0"
    service_type: ServiceType = ServiceType.API
    url: Optional[str] = None
    squad_id: int

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ServiceStatus] = None
    uptime: Optional[float] = None
    version: Optional[str] = None
    service_type: Optional[ServiceType] = None
    url: Optional[str] = None

class DependencyBase(BaseModel):
    dependency_name: str
    interaction_mode: InteractionMode = InteractionMode.X_AS_A_SERVICE
    interaction_frequency: Optional[str] = None

class Dependency(DependencyBase):
    id: int
    dependent_squad_id: int
    dependency_squad_id: int
    dependency_squad_name: Optional[str] = None

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
    team_type: TeamType = TeamType.STREAM_ALIGNED
    member_count: int
    core_count: int = 0
    subcon_count: int = 0
    total_capacity: float
    core_capacity: float = 0.0
    subcon_capacity: float = 0.0
    # Communication channels
    teams_channel: Optional[str] = None
    slack_channel: Optional[str] = None
    email_contact: Optional[str] = None
    # Documentation links
    documentation_url: Optional[str] = None
    jira_board_url: Optional[str] = None

class Squad(SquadBase):
    id: int
    tribe_id: int

    model_config = ConfigDict(from_attributes=True)

class TeamMemberWithCapacity(TeamMember):
    capacity: float = 1.0
    squad_role: Optional[str] = None
    is_vacancy: bool = False

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

                # Preserve the is_vacancy flag
                member_dict['is_vacancy'] = getattr(member, 'is_vacancy', False)

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
    label: Optional[TribeLabel] = None

class Tribe(TribeBase):
    id: int
    area_id: int
    label_str: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class TribeDetail(Tribe):
    squads: List[Squad] = []
    label_str: Optional[str] = None

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
    label: Optional[AreaLabel] = None

class Area(AreaBase):
    id: int
    label_str: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class AreaDetail(Area):
    tribes: List[Tribe] = []
    label_str: Optional[str] = None


# User role enum - names match database values
class UserRole(str, Enum):
    ADMIN = "admin"
    GUEST = "guest"
    TEAM_MEMBER = "team_member"

# User and Authentication schemas
class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: UserRole = UserRole.GUEST
    is_admin: bool = False  # Deprecated, use role instead

class UserCreate(UserBase):
    password: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class UserUpdate(BaseModel):
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None  # For password changes

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Description Edit schemas
class DescriptionUpdate(BaseModel):
    description: str

class DescriptionEdit(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    description: str
    edited_by: int
    edited_at: datetime
    editor: User

    model_config = ConfigDict(from_attributes=True)

# Admin Settings schemas
class AdminSettingBase(BaseModel):
    key: str
    value: str
    description: Optional[str] = None

class AdminSetting(AdminSettingBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AdminSettingCreate(AdminSettingBase):
    pass

class AdminSettingUpdate(BaseModel):
    value: str
    description: Optional[str] = None

# Validation Token schemas
class ValidationTokenBase(BaseModel):
    token: str
    email: EmailStr
    token_type: str = "email_verification"
    expires_at: datetime

class ValidationToken(ValidationTokenBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Audit Log schemas
class AuditLogBase(BaseModel):
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    details: Optional[str] = None

class AuditLog(AuditLogBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    user: Optional[User] = None

    model_config = ConfigDict(from_attributes=True)

# Email verification schemas
class EmailVerification(BaseModel):
    email: EmailStr
    token: str

# Password reset schemas
class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str

# OKR schemas
class KeyResultBase(BaseModel):
    content: str
    current_value: float = 0.0
    target_value: float = 100.0
    position: int = 1

class KeyResultCreate(KeyResultBase):
    objective_id: int

class KeyResultUpdate(BaseModel):
    content: Optional[str] = None
    current_value: Optional[float] = None
    target_value: Optional[float] = None
    position: Optional[int] = None

class KeyResult(KeyResultBase):
    id: int
    objective_id: int
    created_at: datetime
    updated_at: datetime

    @property
    def progress(self) -> float:
        if self.target_value == 0:
            return 0
        return (self.current_value / self.target_value) * 100

    model_config = ConfigDict(from_attributes=True)

class ObjectiveBase(BaseModel):
    content: str
    cascade: bool = False

class ObjectiveCreate(ObjectiveBase):
    area_id: Optional[int] = None
    tribe_id: Optional[int] = None
    squad_id: Optional[int] = None

class ObjectiveUpdate(BaseModel):
    content: Optional[str] = None
    cascade: Optional[bool] = None

class Objective(ObjectiveBase):
    id: int
    area_id: Optional[int] = None
    tribe_id: Optional[int] = None
    squad_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    key_results: List[KeyResult] = []

    model_config = ConfigDict(from_attributes=True)

# System information schemas
class SystemInfoBase(BaseModel):
    version: str
    initialized: bool = True
    schema_version: int = 1

class SystemInfo(SystemInfoBase):
    id: int
    initialized_at: Optional[datetime] = None
    last_migration: Optional[str] = None
    migrations_applied: Optional[str] = None  # JSON string
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
