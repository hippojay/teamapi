# Database Migrations

This directory contains database migration scripts for the What Where How team portal.

## Running Migrations

To apply a migration, navigate to the backend directory and run the migration script with Python:

```bash
cd /home/dave/who/backend
python -m migrations.add_user_details
```

To rollback a migration (if needed):

```bash
cd /home/dave/who/backend
python -m migrations.add_user_details downgrade
```

## Migration Files

- `add_user_details.py`: Adds supervisor relationship and profile image support to team members

## New Database Features

After running the migrations, the following features will be available:

1. **Team Member Enhancements**:
   - `supervisor_id`: Link to another team member as supervisor
   - `image_url`: URL to user profile image

2. **Multi-Squad Memberships**:
   - New `squad_members` table for many-to-many relationship
   - Supports different capacity allocations per squad

## Updating Existing Data

After running the migration, you may want to refresh the sample data with the enhanced model:

```bash
cd /home/dave/who/backend
python load_data.py
```

This will repopulate the database with sample data that includes the new features.

## Notes

- Make sure to backup your database before running migrations in a production environment
- Migrations are not automatically applied - they must be run manually
- If you encounter errors related to database schema changes, try running the migration again
