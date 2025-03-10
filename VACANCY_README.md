# Vacancy Feature Implementation

This feature allows the system to represent vacant positions within squads. These are displayed as special team members marked with a yellow background, and they don't count toward the squad's headcount or capacity metrics.

## How to Fix Existing Vacancies

If you've loaded data with vacancies but they're not showing up correctly, follow these steps:

1. Run the fix script:
   ```
   ./run_fix_vacancies.sh
   ```

   This script will:
   - Add the `is_vacancy` column if it doesn't exist
   - Find all team members with the name "Vacancy" and mark them correctly
   - Fix squad member counts to exclude vacancies
   - Recalculate area and tribe counts

2. Check that vacancies are properly marked:
   ```
   ./run_check_vacancies.sh
   ```

3. To verify the database schema:
   ```
   ./run_all_checks.sh
   ```

## Loading New Data with Vacancies

When loading new data, rows with "Vacancy" in the Name field will be automatically marked as vacancies. They will be:

1. Added to the squad but won't count in member or capacity counts
2. Marked with a yellow highlight in the UI
3. Not clickable (no user detail page)
4. Will be shown in a separate vacancy count in the UI

The scripts in this project handle this automatically in both `load_data.py` and `load_prod_data.py`.

## Handling Missing Email Addresses

The system now supports team members with missing email addresses. For these members:

1. A unique email is automatically generated based on the member's name and squad
2. They appear normally in the UI (not as vacancies)
3. They're counted in member and capacity totals

This is particularly useful for entering placeholder data where the exact email is not yet known.

## Technical Implementation

- Added `is_vacancy` Boolean field to the TeamMember model
- Modified data loading to detect and process vacancies separately
- Updated UI components to display vacancies with distinctive styling
- Added vacancy count to the UI separate from regular member count
