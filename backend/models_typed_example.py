"""
Example file showing how to add type annotations to models.py
This is a template for adding type annotations to the Who What Where models.

IMPORTANT: This file is for documentation/example purposes only.
It is not used in production and is excluded from flake8 checks.
"""
from typing import List, Optional
from sqlalchemy import Boolean, Column, ForeignKey, Integer, Float, Text, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Mapped
from datetime import datetime

from backend.schemas import Area, Tribe, Squad
from database import Base

# OKR classes with type annotations
class Objective(Base):
    __tablename__ = "objectives"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    content: Mapped[str] = Column(Text, nullable=False)
    area_id: Mapped[Optional[int]] = Column(Integer, ForeignKey("areas.id"), nullable=True)
    tribe_id: Mapped[Optional[int]] = Column(Integer, ForeignKey("tribes.id"), nullable=True)
    squad_id: Mapped[Optional[int]] = Column(Integer, ForeignKey("squads.id"), nullable=True)
    cascade: Mapped[bool] = Column(Boolean, default=False)
    created_at: Mapped[datetime] = Column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships with forward references using string literals
    area: Mapped[Optional["Area"]] = relationship("Area", back_populates="objectives")
    tribe: Mapped[Optional["Tribe"]] = relationship("Tribe", back_populates="objectives")
    squad: Mapped[Optional["Squad"]] = relationship("Squad", back_populates="objectives")
    key_results: Mapped[List["KeyResult"]] = relationship(
        "KeyResult", back_populates="objective", cascade="all, delete-orphan"
    )

class KeyResult(Base):
    __tablename__ = "key_results"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    content: Mapped[str] = Column(Text, nullable=False)
    objective_id: Mapped[int] = Column(Integer, ForeignKey("objectives.id"))
    current_value: Mapped[float] = Column(Float, default=0.0)
    target_value: Mapped[float] = Column(Float, default=100.0)
    position: Mapped[int] = Column(Integer, default=1)  # For ordering KR1, KR2, etc.
    created_at: Mapped[datetime] = Column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    objective: Mapped["Objective"] = relationship("Objective", back_populates="key_results")
