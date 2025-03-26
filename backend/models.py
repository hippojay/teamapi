from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, Text, Enum, Table, DateTime, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.schema import MetaData
import enum
import os

from database import Base, db_config

# Define naming convention for constraints to ensure compatibility across databases
metadata = MetaData(naming_convention={
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
})

# Set schema for all tables if PostgreSQL is used with a schema
schema = None
if db_config.is_postgres and db_config.schema:
    schema = db_config.schema
    
# Update Base to use our metadata
Base.metadata = metadata

# Determine if we should use native PostgreSQL ENUMs (with schema) or use string-based ENUMs
# For PostgreSQL 17+ compatibility, we'll use string-based ENUMs to avoid schema permission issues
USE_NATIVE_ENUMS = False  # Disable native PostgreSQL ENUMs

# Use uppercase enum values since PostgreSQL uses uppercase for enum values

# OKR classes
class Objective(Base):
    __tablename__ = "objectives"
    __table_args__ = {'schema': schema} if schema else {}

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    area_id = Column(Integer, ForeignKey("areas.id" if not schema else f"{schema}.areas.id"), nullable=True)
    tribe_id = Column(Integer, ForeignKey("tribes.id" if not schema else f"{schema}.tribes.id"), nullable=True)
    squad_id = Column(Integer, ForeignKey("squads.id" if not schema else f"{schema}.squads.id"), nullable=True)
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
    __table_args__ = {'schema': schema} if schema else {}

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    objective_id = Column(Integer, ForeignKey("objectives.id" if not schema else f"{schema}.objectives.id"))
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
    __table_args__ = {'schema': schema} if schema else {}

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
    Column('member_id', Integer, ForeignKey('team_members.id' if not schema else f"{schema}.team_members.id")),
    Column('squad_id', Integer, ForeignKey('squads.id' if not schema else f"{schema}.squads.id")),
    Column('capacity', Float, default=1.0),
    Column('role', String, nullable=True),
    schema=schema
)

# Define our enum classes
class ServiceStatus(enum.Enum):
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    DOWN = "DOWN"

class InteractionMode(enum.Enum):
    COLLABORATION = "COLLABORATION"
    X_AS_A_SERVICE = "X_AS_A_SERVICE"
    FACILITATING = "FACILITATING"

class TeamType(enum.Enum):
    STREAM_ALIGNED = "STREAM_ALIGNED"
    PLATFORM = "PLATFORM"
    ENABLING = "ENABLING"
    COMPLICATED_SUBSYSTEM = "COMPLICATED_SUBSYSTEM"

class UserRole(enum.Enum):
    ADMIN = "admin"
    GUEST = "guest"
    TEAM_MEMBER = "team_member"

class User(Base):
    __tablename__ = "users"
    __table_args__ = {'schema': schema} if schema else {}

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=True)  # Can be null for new registrations
    email = Column(String, unique=True, index=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    hashed_password = Column(String)
    # Use string enum instead of native enum
    role = Column(String, default="guest")
    is_active = Column(Boolean, default=False)  # Only active after email verification
    is_admin = Column(Boolean, default=False)  # Deprecated, use role instead
    created_at = Column(DateTime, default=func.now())
    last_login = Column(DateTime, nullable=True)

class DescriptionEdit(Base):
    __tablename__ = "description_edits"
    __table_args__ = {'schema': schema} if schema else {}

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String)  # 'area', 'tribe', 'squad'
    entity_id = Column(Integer)
    description = Column(Text)
    edited_by = Column(Integer, ForeignKey("users.id" if not schema else f"{schema}.users.id"))
    edited_at = Column(DateTime, default=func.now())

    # Relationship to the user who made the edit
    editor = relationship("User")

class ValidationToken(Base):
    __tablename__ = "validation_tokens"
    __table_args__ = {'schema': schema} if schema else {}

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True)
    email = Column(String, index=True)
    user_id = Column(Integer, ForeignKey("users.id" if not schema else f"{schema}.users.id"), nullable=True)
    token_type = Column(String, default="email_verification")  # email_verification, password_reset, etc.
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    user = relationship("User")

class AdminSetting(Base):
    __tablename__ = "admin_settings"
    __table_args__ = {'schema': schema} if schema else {}

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(String)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class AuditLog(Base):
    __tablename__ = "audit_logs"
    __table_args__ = {'schema': schema} if schema else {}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id" if not schema else f"{schema}.users.id"), nullable=True)
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
    __table_args__ = {'schema': schema} if schema else {}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text, nullable=True)
    member_count = Column(Integer, default=0)
    core_count = Column(Integer, default=0)  # Count of regular employees
    subcon_count = Column(Integer, default=0)  # Count of contractors
    total_capacity = Column(Float, default=0.0)
    core_capacity = Column(Float, default=0.0)  # Capacity of regular employees
    subcon_capacity = Column(Float, default=0.0)  # Capacity of contractors
    # Use string enum instead of native enum
    label = Column(String, nullable=True)  # Area classification label

    # Relationships
    tribes = relationship("Tribe", back_populates="area", cascade="all, delete-orphan")
    objectives = relationship("Objective", back_populates="area", cascade="all, delete-orphan")

class TribeLabel(enum.Enum):
    CFU_ALIGNED = "cfu_aligned"
    PLATFORM_GROUP = "platform_group"
    DIGITAL = "digital"

class Tribe(Base):
    __tablename__ = "tribes"
    __table_args__ = {'schema': schema} if schema else {}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    area_id = Column(Integer, ForeignKey("areas.id" if not schema else f"{schema}.areas.id"))
    member_count = Column(Integer, default=0)
    core_count = Column(Integer, default=0)  # Count of regular employees
    subcon_count = Column(Integer, default=0)  # Count of contractors
    total_capacity = Column(Float, default=0.0)
    core_capacity = Column(Float, default=0.0)  # Capacity of regular employees
    subcon_capacity = Column(Float, default=0.0)  # Capacity of contractors
    # Use string enum instead of native enum
    label = Column(String, nullable=True)  # Tribe classification label

    # Relationships
    area = relationship("Area", back_populates="tribes")
    squads = relationship("Squad", back_populates="tribe", cascade="all, delete-orphan")
    objectives = relationship("Objective", back_populates="tribe", cascade="all, delete-orphan")

class Squad(Base):
    __tablename__ = "squads"
    __table_args__ = {'schema': schema} if schema else {}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    status = Column(String, default="Active")
    timezone = Column(String, default="UTC")
    # Use string enum instead of native enum
    team_type = Column(String, default="stream_aligned")
    member_count = Column(Integer, default=0)
    core_count = Column(Integer, default=0)  # Count of regular employees
    subcon_count = Column(Integer, default=0)  # Count of contractors
    total_capacity = Column(Float, default=0.0)  # Sum of all member capacities
    core_capacity = Column(Float, default=0.0)  # Capacity of regular employees
    subcon_capacity = Column(Float, default=0.0)  # Capacity of contractors
    tribe_id = Column(Integer, ForeignKey("tribes.id" if not schema else f"{schema}.tribes.id"))
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
    __table_args__ = {'schema': schema} if schema else {}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    role = Column(String)
    function = Column(String, nullable=True)  # Function/capability (Engineering, Design, Product, etc.)
    supervisor_id = Column(Integer, ForeignKey("team_members.id" if not schema else f"{schema}.team_members.id"), nullable=True)
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
    __table_args__ = {'schema': schema} if schema else {}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    # Use string enum instead of native enum
    status = Column(String, default="HEALTHY")
    uptime = Column(Float, default=99.9)
    version = Column(String, default="1.0.0")
    api_docs_url = Column(String, nullable=True)
    squad_id = Column(Integer, ForeignKey("squads.id" if not schema else f"{schema}.squads.id"))
    # Use string enum instead of native enum
    service_type = Column(String, default="API")
    url = Column(String, nullable=True)  # Generic URL for any service type

    # Relationships
    squad = relationship("Squad", back_populates="services")

class Dependency(Base):
    __tablename__ = "dependencies"
    __table_args__ = {'schema': schema} if schema else {}

    id = Column(Integer, primary_key=True, index=True)
    dependent_squad_id = Column(Integer, ForeignKey("squads.id" if not schema else f"{schema}.squads.id"))
    dependency_squad_id = Column(Integer, ForeignKey("squads.id" if not schema else f"{schema}.squads.id"))
    dependency_name = Column(String)
    # Use string enum instead of native enum
    interaction_mode = Column(String, default="x_as_a_service")
    interaction_frequency = Column(String, nullable=True)  # "Regular", "As needed", "Scheduled"

    # Relationships
    dependent_squad = relationship("Squad",
                                   foreign_keys=[dependent_squad_id],
                                   back_populates="dependencies")
    dependency_squad = relationship("Squad",
                                    foreign_keys=[dependency_squad_id])

class OnCallRoster(Base):
    __tablename__ = "on_call_rosters"
    __table_args__ = {'schema': schema} if schema else {}

    id = Column(Integer, primary_key=True, index=True)
    squad_id = Column(Integer, ForeignKey("squads.id" if not schema else f"{schema}.squads.id"), unique=True)
    primary_name = Column(String)
    primary_contact = Column(String, nullable=True)
    secondary_name = Column(String)
    secondary_contact = Column(String, nullable=True)

    # Relationships
    squad = relationship("Squad", back_populates="on_call")
