from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, Text, Enum, Table
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
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    DOWN = "down"

class DependencyType(enum.Enum):
    REQUIRED = "required"
    OPTIONAL = "optional"

class Area(Base):
    __tablename__ = "areas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text, nullable=True)
    member_count = Column(Integer, default=0)
    total_capacity = Column(Float, default=0.0)
    
    # Relationships
    tribes = relationship("Tribe", back_populates="area", cascade="all, delete-orphan")

class Tribe(Base):
    __tablename__ = "tribes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    area_id = Column(Integer, ForeignKey("areas.id"))
    member_count = Column(Integer, default=0)
    total_capacity = Column(Float, default=0.0)
    
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
    member_count = Column(Integer, default=0)
    total_capacity = Column(Float, default=0.0)  # Sum of all member capacities
    tribe_id = Column(Integer, ForeignKey("tribes.id"))
    
    # Relationships
    tribe = relationship("Tribe", back_populates="squads")
    # Legacy one-to-many relationship (to be deprecated)
    members = relationship("TeamMember", back_populates="squad", cascade="all, delete-orphan")
    # New many-to-many relationship through squad_members association table
    team_members = relationship("TeamMember", secondary=squad_members, 
                              back_populates="squads", 
                              overlaps="members")
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
    squad_id = Column(Integer, ForeignKey("squads.id"), nullable=True)  # Legacy column for backwards compatibility
    supervisor_id = Column(Integer, ForeignKey("team_members.id"), nullable=True)
    location = Column(String, nullable=True)
    geography = Column(String, nullable=True)  # Work Geography (Europe, UK, AMEA)
    capacity = Column(Float, default=1.0)  # Default capacity for primary squad
    image_url = Column(String, nullable=True)  # Profile picture URL
    
    # Relationships
    # Legacy one-to-many relationship (to be deprecated)
    squad = relationship("Squad", back_populates="members")
    # New many-to-many relationship through squad_members association table
    squads = relationship("Squad", secondary=squad_members, 
                        back_populates="team_members",
                        overlaps="squad")
    direct_reports = relationship("TeamMember", 
                                foreign_keys=[supervisor_id],
                                backref="supervisor",
                                remote_side=[id])

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
    
    # Relationships
    squad = relationship("Squad", back_populates="services")

class Dependency(Base):
    __tablename__ = "dependencies"

    id = Column(Integer, primary_key=True, index=True)
    dependent_squad_id = Column(Integer, ForeignKey("squads.id"))
    dependency_squad_id = Column(Integer, ForeignKey("squads.id"))
    dependency_name = Column(String)
    dependency_type = Column(Enum(DependencyType), default=DependencyType.REQUIRED)
    
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
