# User Role Case Sensitivity Fix

This document explains the solution to the case sensitivity issues with user roles in the Who What Where Portal.

## The Issue

The application had a mismatch between how user roles were defined in the SQLAlchemy models and how they were stored in the database:

- **Models**: The `UserRole` enum in `models.py` used uppercase values (`"GUEST"`, `"TEAM_MEMBER"`, `"ADMIN"`)
- **Database**: The actual values stored in the database were lowercase (`"guest"`, `"team_member"`, `"admin"`)
- **Frontend**: The frontend code in `roleUtils.js` expects lowercase values

This mismatch caused errors during authentication and role checking, with error messages like:

```
LookupError: 'admin' is not among the defined enum values. Enum name: userrole. Possible values: GUEST, TEAM_MEMBER, ADMIN
```

## The Solution

The fix involves ensuring consistent use of lowercase values throughout the system:

1. **Updated models.py**: Changed the `UserRole` enum values to lowercase
   ```python
   class UserRole(enum.Enum):
       GUEST = "guest"
       TEAM_MEMBER = "team_member"
       ADMIN = "admin"
   ```

2. **Updated schemas.py**: Changed the Pydantic `UserRole` enum values to lowercase
   ```python
   class UserRole(str, Enum):
       GUEST = "guest"
       TEAM_MEMBER = "team_member"
       ADMIN = "admin"
   ```

3. **Fixed auth handling**: Removed uppercase conversions in code that handles user roles:
   - Removed `.upper()` conversion in `main.py` for user creation
   - Updated `user_auth.py` to handle roles without case conversion
   - Improved the `is_admin` function to properly check for lowercase roles

4. **Database consistency**: Enhanced the `role_fix.py` script to ensure all database values are lowercase

## How to Apply the Fix

Run the `fix_roles_and_restart.py` script which will:

1. Update the code files with the correct lowercase enum values
2. Update the database to ensure all role values are lowercase
3. Restart the application server

```bash
python fix_roles_and_restart.py
```

## Verification

After applying the fix, you should be able to:

1. Log in with existing user accounts
2. Create new user accounts
3. Update user roles
4. See proper role-based access controls applied

## Future Role Changes

When working with user roles in the future:

1. Always use lowercase values for roles in the database and API
2. Use the enum values directly without case conversion
3. When comparing roles, use case-insensitive comparison or ensure lowercase values

## Technical Implementation Details

The fix addressed several key areas:

1. **Enum definitions**: Updated both SQLAlchemy and Pydantic enum definitions to use lowercase values
2. **Authentication**: Fixed the authentication flow to accept lowercase role values
3. **Role updates**: Ensured that role updates work properly with lowercase values
4. **API endpoints**: Updated endpoints that handle roles to work with lowercase values
5. **Database migration**: Enhanced the role fixing script to ensure database consistency

This comprehensive approach ensures roles work consistently throughout the application.
