from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, Text, Enum, Table, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from database import Base

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

class DependencyType(enum.Enum):
    REQUIRED = "required"
    OPTIONAL = "optional"

class InteractionMode(enum.Enum):
    COLLABORATION = "collaboration"
    X_AS_A_SERVICE = "x_as_a_service"
    FACILITATING = "facilitating"

class TeamType(enum.Enum):
    STREAM_ALIGNED = "stream_aligned"
    PLATFORM = "platform"
    ENABLING = "enabling"
    COMPLICATED_SUBSYSTEM = "complicated_subsystem"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
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
    
    # Relationships
    tribes = relationship("Tribe", back_populates="area", cascade="all, delete-orphan")

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
    
    # Relationships
    area = relationship("Area", back_populates="tribes")
    squads = relationship("Squad", back_populates="tribe", cascade="all, delete-orphan")

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

class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    role = Column(String)
    supervisor_id = Column(Integer, ForeignKey("team_members.id"), nullable=True)
    location = Column(String, nullable=True)
    geography = Column(String, nullable=True)  # Work Geography (Europe, UK, AMEA)
    image_url = Column(String, nullable=True)  # Profile picture URL
    employment_type = Column(String, default="core", nullable=True)  # 'core' for regular employees, 'subcon' for contractors
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
    dependency_type = Column(Enum(DependencyType), default=DependencyType.REQUIRED)
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
