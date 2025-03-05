# Capacity Display Bugfix

## Issue Description
The UserPage was displaying "NaN" for the team member's capacity. This issue occurred after the database model was updated to remove the direct `capacity` field from the TeamMember model and only store capacity in the squad_members association table.

The frontend was still trying to access `user.capacity` directly, which no longer exists in the new database model, causing the NaN display.

## Fix Applied
1. Updated the `calculateTotalCapacity` function to not rely on the non-existent `user.capacity` property when no squads are assigned.
2. Modified all references to `user.capacity` to use the calculated `totalCapacity` value, which properly sums up the capacities from all squad memberships.
3. Added additional safeguards in the `getCapacityColor` function to handle undefined or NaN values.

## Technical Details
In the new database model, team members can belong to multiple squads with different capacity values in each. The capacity is now stored in the squad_members junction table rather than directly on the TeamMember model.

For a team member's total capacity, we now need to sum up all their squad membership capacities. This change aligns with the database model update that allows a team member to have different capacities in different squads.

## Related Changes
This fix is related to the database model updates described in:
- README_DATABASE_UPDATE.md
- The database_model_simplification and database_model_update project changes
