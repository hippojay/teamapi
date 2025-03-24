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
        "tribe_id": 1,
        "team_type": TeamType.STREAM_ALIGNED.value
    }
    
    squad = SquadBase(**squad_data)
    assert squad.name == "Test Squad"
    assert squad.description == "A test squad"
    assert squad.tribe_id == 1
    assert squad.team_type == TeamType.STREAM_ALIGNED.value

def test_dependency_schema():
    """Test creating a DependencyBase schema object."""
    dependency_data = {
        "source_id": 1,
        "target_id": 2,
        "dependency_type": "API",
        "interaction_mode": InteractionMode.X_AS_A_SERVICE.value,
        "description": "Test dependency"
    }
    
    dependency = DependencyBase(**dependency_data)
    assert dependency.source_id == 1
    assert dependency.target_id == 2
    assert dependency.dependency_type == "API"
    assert dependency.interaction_mode == InteractionMode.X_AS_A_SERVICE.value
    assert dependency.description == "Test dependency"
