# Vendor Information Update for Contractors

This update adds vendor information support for contractors in the Team Portal application. The vendor information is displayed as small pill type labels next to the contractor label in the UI.

## Database Changes

1. Added a new field `vendor_name` to the `TeamMember` model in `models.py`:
   ```python
   vendor_name = Column(String, nullable=True)  # Vendor name for contractors
   ```

2. Updated the `TeamMemberBase` schema in `schemas.py` to include the vendor name:
   ```python
   vendor_name: Optional[str] = None  # Vendor name for contractors
   ```

## Data Loading Changes

1. Modified `load_data.py` to read the "Vendor Name" field from the Excel data:
   - Included 'Vendor Name' in the columns being read from the Excel file
   - Added code to extract vendor name for contractors
   - Set vendor name only for team members with employment_type set to "subcon"

## UI Changes

Updated the following frontend components to display vendor information as pill labels:

1. **UsersPage.jsx**:
   - Added a vendor pill label next to the contractor label
   - Used blue color scheme to distinguish vendor name from employment type

2. **UserDetailPage.jsx**:
   - Added vendor pill label in the user summary section
   - Added vendor information in the Additional Information section

3. **SquadDetailPage.jsx**:
   - Added vendor pill labels next to team member employment types

## How the Vendor Information is Displayed

The vendor information is displayed as a blue pill label next to the amber-colored contractor label. This allows users to quickly identify both the contractor status and the vendor providing the contractor.

## Usage

1. Ensure the Excel data file includes a "Vendor Name" column for contractor records
2. Run the data loader as usual with `python load_data.py`
3. The vendor information will appear in the UI automatically for any contractor with a vendor

## Notes

- No database migration script is needed as we're recreating the database from scratch
- The vendor field is only populated for team members with employment_type set to "subcon"
- If a contractor record doesn't have a vendor name, only the contractor label will be shown (no empty vendor pill)
