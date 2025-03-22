from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, Text, Enum, Table, DateTime, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from database import Base

# OKR classes
class Objective(Base):
    __tablename__ = "objectives"
    
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    area_id = Column(Integer, ForeignKey("areas.id"), nullable=True)
    tribe_id = Column(Integer, ForeignKey("tribes.id"), nullable=True)
    squad_id = Column(Integer, ForeignKey("squads.id"), nullable=True)
    cascade = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    area = relationship("Area", back_populates="objectives")
    tribe = relationship("Tribe", back_populates="objectives")
    squad = relationship("Squad", back_populates="objectives")
    key_results = relationship("KeyResult", back_populates="objective", cascade="all, delete-orphan")

class KeyResult(Base):
    __tablename__ = "key_results"
    
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    objective_id = Column(Integer, ForeignKey("objectives.id"))
    current_value = Column(Float, default=0.0)
    target_value = Column(Float, default=100.0)
    position = Column(Integer, default=1)  # For ordering KR1, KR2, etc.
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    objective = relationship("Objective", back_populates="key_results")

# System information table for tracking database version and initialization status
class SystemInfo(Base):
    __tablename__ = "system_info"
    
    id = Column(Integer, primary_key=True, index=True)
    version = Column(String, nullable=False)
    initialized = Column(Boolean, default=False)
    initialized_at = Column(DateTime, nullable=True)
    last_migration = Column(String, nullable=True)
    schema_version = Column(Integer, default=1)
    migrations_applied = Column(JSON, nullable=True)  # Track which migrations have been applied
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

# Association table for many-to-many relationship between squads and team members
squad_members = Table(
    'squad_members',
    Base.metadata,
    Column('id', Integer, primary_key=True),
    Column('member_id', Integer, ForeignKey('team_members.id')),
    Column('squad_id', Integer, ForeignKey('squads.id')),
    Column('capacity', Float, default=1.0),
    Column('role', String, nullable=True)
)

class ServiceStatus(enum.Enum):
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    DOWN = "DOWN"

# Removed DependencyType enum as per requirement

class InteractionMode(enum.Enum):
    COLLABORATION = "collaboration"
    X_AS_A_SERVICE = "x_as_a_service"
    FACILITATING = "facilitating"

class TeamType(enum.Enum):
    STREAM_ALIGNED = "stream_aligned"
    PLATFORM = "platform"
    ENABLING = "enabling"
    COMPLICATED_SUBSYSTEM = "complicated_subsystem"


class UserRole(enum.Enum):
    admin = "admin"
    guest = "guest"
    team_member = "team_member"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=True)  # Can be null for new registrations
    email = Column(String, unique=True, index=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    hashed_password = Column(String)
    role = Column(Enum(UserRole), default=UserRole.guest)
    is_active = Column(Boolean, default=False)  # Only active after email verification
    is_admin = Column(Boolean, default=False)  # Deprecated, use role instead
    created_at = Column(DateTime, default=func.now())
    last_login = Column(DateTime, nullable=True)

class DescriptionEdit(Base):
    __tablename__ = "description_edits"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String)  # 'area', 'tribe', 'squad'
    entity_id = Column(Integer)
    description = Column(Text)
    edited_by = Column(Integer, ForeignKey("users.id"))
    edited_at = Column(DateTime, default=func.now())
    
    # Relationship to the user who made the edit
    editor = relationship("User")

class ValidationToken(Base):
    __tablename__ = "validation_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True)
    email = Column(String, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    token_type = Column(String, default="email_verification")  # email_verification, password_reset, etc.
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    user = relationship("User")
    
class AdminSetting(Base):
    __tablename__ = "admin_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(String)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String)  # CREATE, UPDATE, DELETE, LOGIN, etc.
    entity_type = Column(String)  # User, Squad, Service, etc.
    entity_id = Column(Integer, nullable=True)
    details = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    user = relationship("User")


class AreaLabel(enum.Enum):
    CFU_ALIGNED = "cfu_aligned"
    PLATFORM_GROUP = "platform_group"
    DIGITAL = "digital"

class Area(Base):
    __tablename__ = "areas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text, nullable=True)
    member_count = Column(Integer, default=0)
    core_count = Column(Integer, default=0)  # Count of regular employees
    subcon_count = Column(Integer, default=0)  # Count of contractors
    total_capacity = Column(Float, default=0.0)
    core_capacity = Column(Float, default=0.0)  # Capacity of regular employees
    subcon_capacity = Column(Float, default=0.0)  # Capacity of contractors
    label = Column(Enum(AreaLabel), nullable=True)  # Area classification label
    
    # Relationships
    tribes = relationship("Tribe", back_populates="area", cascade="all, delete-orphan")
    objectives = relationship("Objective", back_populates="area", cascade="all, delete-orphan")

class TribeLabel(enum.Enum):
    CFU_ALIGNED = "cfu_aligned"
    PLATFORM_GROUP = "platform_group"
    DIGITAL = "digital"

class Tribe(Base):
    __tablename__ = "tribes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    area_id = Column(Integer, ForeignKey("areas.id"))
    member_count = Column(Integer, default=0)
    core_count = Column(Integer, default=0)  # Count of regular employees
    subcon_count = Column(Integer, default=0)  # Count of contractors
    total_capacity = Column(Float, default=0.0)
    core_capacity = Column(Float, default=0.0)  # Capacity of regular employees
    subcon_capacity = Column(Float, default=0.0)  # Capacity of contractors
    label = Column(Enum(TribeLabel), nullable=True)  # Tribe classification label
    
    # Relationships
    area = relationship("Area", back_populates="tribes")
    squads = relationship("Squad", back_populates="tribe", cascade="all, delete-orphan")
    objectives = relationship("Objective", back_populates="tribe", cascade="all, delete-orphan")

class Squad(Base):
    __tablename__ = "squads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    status = Column(String, default="Active")
    timezone = Column(String, default="UTC")
    team_type = Column(Enum(TeamType), default=TeamType.STREAM_ALIGNED)
    member_count = Column(Integer, default=0)
    core_count = Column(Integer, default=0)  # Count of regular employees
    subcon_count = Column(Integer, default=0)  # Count of contractors
    total_capacity = Column(Float, default=0.0)  # Sum of all member capacities
    core_capacity = Column(Float, default=0.0)  # Capacity of regular employees
    subcon_capacity = Column(Float, default=0.0)  # Capacity of contractors
    tribe_id = Column(Integer, ForeignKey("tribes.id"))
    # Communication channels
    teams_channel = Column(String, nullable=True)  # Teams channel name
    slack_channel = Column(String, nullable=True)  # Slack channel name
    email_contact = Column(String, nullable=True)  # Contact email
    # Documentation links
    documentation_url = Column(String, nullable=True)  # Documentation URL
    jira_board_url = Column(String, nullable=True)  # Jira board URL
    
    # Relationships
    tribe = relationship("Tribe", back_populates="squads")
    # Many-to-many relationship through squad_members association table
    team_members = relationship("TeamMember", secondary=squad_members, 
                              back_populates="squads")
    services = relationship("Service", back_populates="squad", cascade="all, delete-orphan")
    dependencies = relationship("Dependency", 
                              foreign_keys="[Dependency.dependent_squad_id]",
                              back_populates="dependent_squad")
    on_call = relationship("OnCallRoster", back_populates="squad", uselist=False, cascade="all, delete-orphan")
    objectives = relationship("Objective", back_populates="squad", cascade="all, delete-orphan")

class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    role = Column(String)
    function = Column(String, nullable=True)  # Function/capability (Engineering, Design, Product, etc.)
    supervisor_id = Column(Integer, ForeignKey("team_members.id"), nullable=True)
    location = Column(String, nullable=True)
    geography = Column(String, nullable=True)  # Work Geography (Europe, UK, AMEA)
    image_url = Column(String, nullable=True)  # Profile picture URL
    employment_type = Column(String, nullable=True)  # 'core' for regular employees, 'subcon' for contractors
    vendor_name = Column(String, nullable=True)  # Vendor name for contractors
    is_external = Column(Boolean, default=False)  # Flag for external supervisors not in the squad setup
    is_vacancy = Column(Boolean, default=False)  # Flag for vacancy positions
    
    # Relationships
    # Many-to-many relationship through squad_members association table
    squads = relationship("Squad", secondary=squad_members, 
                        back_populates="team_members")
    direct_reports = relationship("TeamMember", 
                                foreign_keys=[supervisor_id],
                                backref="supervisor",
                                remote_side=[id])

class ServiceType(enum.Enum):
    API = "API"
    REPO = "REPO"
    PLATFORM = "PLATFORM"
    WEBPAGE = "WEBPAGE"
    APP_MODULE = "APP_MODULE"

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    status = Column(Enum(ServiceStatus), default=ServiceStatus.HEALTHY)
    uptime = Column(Float, default=99.9)
    version = Column(String, default="1.0.0")
    api_docs_url = Column(String, nullable=True)
    squad_id = Column(Integer, ForeignKey("squads.id"))
    service_type = Column(Enum(ServiceType), default=ServiceType.API)
    url = Column(String, nullable=True)  # Generic URL for any service type
    
    # Relationships
    squad = relationship("Squad", back_populates="services")

class Dependency(Base):
    __tablename__ = "dependencies"

    id = Column(Integer, primary_key=True, index=True)
    dependent_squad_id = Column(Integer, ForeignKey("squads.id"))
    dependency_squad_id = Column(Integer, ForeignKey("squads.id"))
    dependency_name = Column(String)
    # Removed dependency_type field as per requirement
    interaction_mode = Column(Enum(InteractionMode), default=InteractionMode.X_AS_A_SERVICE)
    interaction_frequency = Column(String, nullable=True)  # "Regular", "As needed", "Scheduled"
    
    # Relationships
    dependent_squad = relationship("Squad", 
                                 foreign_keys=[dependent_squad_id],
                                 back_populates="dependencies")
    dependency_squad = relationship("Squad", 
                                 foreign_keys=[dependency_squad_id])

class OnCallRoster(Base):
    __tablename__ = "on_call_rosters"

    id = Column(Integer, primary_key=True, index=True)
    squad_id = Column(Integer, ForeignKey("squads.id"), unique=True)
    primary_name = Column(String)
    primary_contact = Column(String, nullable=True)
    secondary_name = Column(String)
    secondary_contact = Column(String, nullable=True)
    
    # Relationships
    squad = relationship("Squad", back_populates="on_call")
