import sys
import os
import pytest

# Add the parent directory to the path so we can import the backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from schemas import SquadBase, DependencyBase, TeamType, InteractionMode

def test_squad_schema():
    """Test creating a SquadBase schema object."""
    squad_data = {
        "name": "Test Squad",
        "description": "A test squad",
        "status": "Active",
        "timezone": "UTC",
        "team_type": TeamType.STREAM_ALIGNED.value,
        "member_count": 5,
        "core_count": 3,
        "subcon_count": 2,
        "total_capacity": 4.5,
        "core_capacity": 3.0,
        "subcon_capacity": 1.5
    }
    
    squad = SquadBase(**squad_data)
    assert squad.name == "Test Squad"
    assert squad.description == "A test squad"
    assert squad.status == "Active"
    assert squad.timezone == "UTC"
    assert squad.team_type == TeamType.STREAM_ALIGNED.value
    assert squad.member_count == 5
    assert squad.total_capacity == 4.5

def test_dependency_schema():
    """Test creating a DependencyBase schema object."""
    dependency_data = {
        "dependency_name": "API Integration",
        "interaction_mode": InteractionMode.X_AS_A_SERVICE.value,
        "interaction_frequency": "Daily"
    }
    
    dependency = DependencyBase(**dependency_data)
    assert dependency.dependency_name == "API Integration"
    assert dependency.interaction_mode == InteractionMode.X_AS_A_SERVICE.value
    assert dependency.interaction_frequency == "Daily"
