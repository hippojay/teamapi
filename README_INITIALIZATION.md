# Who What Where Portal - Database Initialization Guide

This guide explains how to initialize the database and set up the admin user for the Who What Where Portal.

## Automatic Initialization

The application automatically checks if the database is initialized on startup. If not, it performs first-time setup:

1. Creates all required database tables
2. Sets up a system information record to track database version
3. Creates an admin user with a secure random password
4. Saves the admin credentials to a secure file in the `credentials` directory

## Manual Initialization

You can manually initialize or reinitialize the database using the command-line interface:

### Using run.sh (Recommended)

The simplest way to initialize the database is using the `run.sh` script with the `--init` flag:

```bash
# Basic initialization
./run.sh --init

# Initialize with custom admin details
./run.sh --init --admin-username=myadmin --admin-email=admin@mycompany.com
```

### Loading Sample Data

Loading sample data is a separate operation that uses dedicated scripts:

```bash
# Load sample data
python backend/load_data.py

# Load production data
python backend/load_prod_data.py
```

**Note:** Data loading is never performed during initialization or startup. It must be explicitly initiated using the dedicated scripts.

### Using main.py Directly

You can also use the Python script directly:

```bash
# Basic initialization
python backend/main.py --force-initdb

# Initialize with custom admin details
python backend/main.py --force-initdb --admin-username=myadmin --admin-email=admin@mycompany.com
```

## Admin Credentials

When initializing the database, a random secure password is generated for the admin user. This password is saved to a file in the `credentials` directory with secure permissions (readable only by the owner).

The credentials file will have a name like `admin_credentials_20250322_120130.txt` with a timestamp to ensure uniqueness.

**Important:** For security, you should:
1. Log in using these credentials as soon as possible
2. Change the password to one you'll remember
3. Delete the credentials file once you've logged in

## Starting the Application

To start the application without initialization:

```bash
# Using the run script
./run.sh

# Or directly
cd backend
python main.py
```

## Command Line Options

The application supports the following command-line options:

| Option | Description |
|--------|-------------|
| `--force-initdb` | Force database initialization |
| `--admin-username=NAME` | Set custom admin username (default: admin) |
| `--admin-email=EMAIL` | Set custom admin email (default: admin@example.com) |
| `--host=HOST` | Specify host to bind server (default: 0.0.0.0) |
| `--port=PORT` | Specify port to bind server (default: 8000) |
| `--help` | Show help information |

## System Information

The system information is stored in the `system_info` table in the database. This tracks:

- Current application version
- Database schema version
- Initialization status and timestamp
- Applied migrations

Admin users can view this information through the `/system/info` API endpoint.
