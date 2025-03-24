import sys
import os
import pytest

# Add the parent directory to the path so we can import the backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import TeamType, InteractionMode

def test_team_type_enum():
    """Test that TeamType enum has all expected values."""
    assert TeamType.STREAM_ALIGNED.value == "stream_aligned"
    assert TeamType.PLATFORM.value == "platform"
    assert TeamType.ENABLING.value == "enabling"
    assert TeamType.COMPLICATED_SUBSYSTEM.value == "complicated_subsystem"
    
def test_interaction_mode_enum():
    """Test that InteractionMode enum has all expected values."""
    assert InteractionMode.COLLABORATION.value == "collaboration"
    assert InteractionMode.X_AS_A_SERVICE.value == "x_as_a_service"
    assert InteractionMode.FACILITATING.value == "facilitating"
