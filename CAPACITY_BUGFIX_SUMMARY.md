# Capacity Calculation Bug Fix Summary

## Problem
The Userpage and UserDetailPage were showing "NaN" for capacity percentages after the database model was updated to remove the direct `capacity` field from the TeamMember model and only store capacities in the squad_members association table.

## Solution Steps

### Backend Changes

1. Updated `get_team_members` function in `crud.py` to:
   - Fetch all squad memberships for each team member
   - Calculate the total capacity by summing capacities from all squad memberships
   - Attach the calculated capacity to each team member object

2. Updated `get_team_members_by_squad` function to:
   - Add squad-specific capacity information
   - Calculate total capacity across all squads
   - Handle cases where users belong to multiple squads

3. Modified the `TeamMember` Pydantic schema in `schemas.py` to:
   - Include a `capacity` field even though it's not in the database model
   - Add `squad_id` field for backward compatibility

### Frontend Changes

1. Fixed `UserDetailPage.jsx`:
   - Updated `calculateTotalCapacity` to properly handle cases with no squads
   - Modified how capacity is displayed to use the calculated totalCapacity
   - Enhanced error handling in the `getCapacityColor` function

2. Fixed `UsersPage.jsx`:
   - Updated capacity display to handle edge cases better
   - Improved the `getCapacityColor` function to handle undefined values
   - Fixed percentage formatting

## Key Details

1. With the updated model, team members can belong to multiple squads with different capacity values in each
2. The total capacity is calculated as the sum of all squad membership capacities
3. The NaN issue occurred because:
   - Frontend was trying to access a direct `capacity` field that no longer exists
   - Pydantic schema was not including the dynamically calculated capacity

## Testing

To fully implement and test the fix:

1. Reset the database: `python reset_db.py`
2. Reload sample data: `python load_data.py`
3. Restart the FastAPI backend: `uvicorn main:app --reload`
4. Test in the React frontend

This ensures capacity is properly calculated for all team members across all their squad memberships.
