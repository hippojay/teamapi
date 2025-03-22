# Who What Where Portal - Database Initialization Requirements

## Overview
This document outlines the requirements for improving the setup and initialization process for new instances of the Who What Where portal. The goal is to ensure that all required database tables are created, and that the initial admin user is created as part of the first run.

## Requirements

### 1. Automatic Database Initialization
- The system should detect if this is the first run by checking for an initialization flag in the database
- If this is the first run, the system should automatically initialize the database
- All required tables should be created during initialization
- The initial admin user should be created during initialization

### 2. Database Version Tracking
- The system should maintain a version number for the database schema
- A dedicated system table should track the current version and initialization status
- The system should support future migrations based on the version number

### 3. Migration Framework
- The system should include a framework for applying database migrations
- Migrations should be tracked to avoid duplicate application
- The system should report the status of migrations

### 4. Admin User Setup
- The admin user should be created with a randomly generated secure password
- This random password should be saved to a secure local file for reference
- The admin user should be created only if it doesn't already exist
- The system should provide feedback about the admin user creation and password location
- The credentials file should have secure permissions (readable only by the owner)

### 5. System Information API
- An API endpoint should be available to check the system status
- The API should return the current database version and initialization status
- Only admin users should have access to the system information

### 6. Command-Line Interface
- Database initialization should be available through command-line arguments to the main application
- The application should support a `--force-initdb` flag to reinitialize the database
- Optional parameters like `--admin-username` and `--admin-email` should be supported
- Data loading should NEVER be performed during initialization or startup
- Data loading should be handled separately using dedicated scripts (load_data.py, load_prod_data.py)
- A wrapper shell script `run.sh` should provide a user-friendly interface for initialization

### 7. Error Handling
- The system should handle initialization errors gracefully
- Clear error messages should be provided if initialization fails
- The system should provide logging of the initialization process

## Implementation Details

### System Information Table
The system information table should contain the following fields:
- `id`: Primary key
- `version`: Current application version
- `initialized`: Flag indicating if the database has been initialized
- `initialized_at`: Timestamp of when the database was initialized
- `last_migration`: Name of the last migration applied
- `schema_version`: Current database schema version
- `migrations_applied`: JSON list of applied migrations
- `created_at`: Timestamp of when the record was created
- `updated_at`: Timestamp of when the record was last updated

### Default Admin User
The default admin user should have the following characteristics:
- Username: `admin`
- Email: `admin@example.com`
- Password: Randomly generated with sufficient complexity (uppercase, lowercase, numbers, special characters)
- Password Length: At least 16 characters
- Role: `admin`

### Credentials Storage
- Credentials should be stored in a `credentials` directory
- The credentials file should include a timestamp in the filename
- The file should be created with secure permissions (0600)
- The file should include a warning about its sensitive nature
- Instructions should be provided to delete the file after first login
