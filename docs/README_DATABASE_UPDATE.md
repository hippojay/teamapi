# Database Model Updates for Team Member Squad Assignments

## Overview of Changes

The database model has been updated to support a proper many-to-many relationship between TeamMembers and Squads. This change reflects the real-world scenario where team members can be assigned to multiple squads with different capacities.

## Key Changes

1. **Model Changes**:
   - The `squad_members` association table is now the only way to connect TeamMembers and Squads
   - The legacy `squad_id` and `capacity` fields have been completely removed from the TeamMember model
   - Removed the legacy one-to-many relationships between TeamMember and Squad

2. **Data Loading Changes**:
   - `load_data.py` has been updated to properly handle duplicate team members (same person in multiple squads)
   - When a person appears multiple times in the data with different squad assignments, both are loaded
   - Each assignment captures the correct capacity for that squad in the squad_members table

3. **CRUD Operations**:
   - Updated `get_team_members_by_squad()` to use the many-to-many relationship
   - Updated `get_team_member()` to capture all squad memberships for a team member
   - Supervisor relationships are now established based on squad memberships rather than the old squad_id field

4. **Schema Changes**:
   - Removed `squad_id` from `TeamMember` schema 
   - Updated SquadDetail to use `team_members` instead of the legacy `members` field

## How to Use

1. **Update the Code**:
   - Replace the updated files with the new versions

2. **Recreate the Database**:
   - Delete the existing `team_portal.db` file
   - Run the updated `load_data.py` script to create a fresh database with the new schema

## Data Format

The Excel data file can now include:
- The same person (with the same email) in multiple rows
- Different squad assignments for each occurrence
- Different capacities for each assignment

Example:
```
Name, Email, Squad, Capacity
John Smith, john@example.com, Squad A, 0.5
John Smith, john@example.com, Squad B, 0.5
```

In this example, John Smith will be created once in the database but will have two entries in the `squad_members` table, one for Squad A with 50% capacity and another for Squad B with 50% capacity.
