# Capacity Calculation Update

## Background
After moving from a direct capacity field on TeamMember to storing capacities in the squad_members association table, we needed to update the API endpoints and frontend to properly calculate and display capacity information.

## Changes Made

### Backend
1. Updated the `get_team_members` function in `crud.py` to:
   - Fetch all squad memberships for each team member
   - Calculate the total capacity across all squad memberships
   - Attach the total capacity and squad memberships to each team member as properties
   - Set a primary squad_id (first one found) for backward compatibility

2. Enhanced the `get_team_members_by_squad` function to:
   - Include squad-specific capacity for each member
   - Calculate and include the total capacity across all squads
   - Add squad_memberships with details for all squads a member belongs to

### Frontend
1. Updated `UserDetailPage.jsx` to:
   - Calculate total capacity from squad memberships
   - Display the appropriate percentage based on all squad memberships
   - Handle edge cases like users with no squad memberships

2. Updated `UsersPage.jsx` to:
   - Use the provided capacity value from the API
   - Handle undefined/NaN capacity values
   - Display proper formatting even when capacity is zero or not defined

## How It Works Now
- Each team member's capacity is calculated as the sum of all their squad memberships
- A member with 0.3 capacity in one squad and 0.5 in another will now show 80% total capacity
- The capacity is calculated in the backend and provided to the frontend
- Both the main Users page and the User Detail page now show the correct capacity information

## Data Structure
- The `squad_members` table stores the specific capacity for each team member in each squad
- When the API returns team members, it now includes:
  - `capacity`: Total capacity across all squads
  - `squad_id`: Primary squad ID (for backward compatibility)
  - `squad_memberships`: Detailed information about all squad memberships
