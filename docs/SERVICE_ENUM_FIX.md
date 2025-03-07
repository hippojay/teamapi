# Service Enum Value Fixes

This document explains the changes made to fix issues with service enum values in the database.

## Issues Fixed

There was a mismatch between enum values stored in the database and what the SQLAlchemy models expected. This was causing errors when retrieving service data.

The following issues were addressed:

1. **ServiceStatus Enum**: Values needed to be UPPERCASE ('HEALTHY') instead of lowercase ('healthy')
2. **ServiceType Enum**: Values needed to be UPPERCASE ('API', 'REPO') and consistent naming

## Changes Made

### 1. Database Model Updates

Updated the enum definitions in `models.py`:

```python
class ServiceStatus(enum.Enum):
    HEALTHY = "HEALTHY"   # Was "healthy"
    DEGRADED = "DEGRADED" # Was "degraded"
    DOWN = "DOWN"         # Was "down"

class ServiceType(enum.Enum):
    API = "API"             # Was "api"
    REPO = "REPO"           # Was "repository"
    PLATFORM = "PLATFORM"   # Was "platform"
    WEBPAGE = "WEBPAGE"     # Was "webpage"
    APP_MODULE = "APP_MODULE" # Was "app_module"
```

### 2. Schema Updates

Made corresponding changes in `schemas.py` to keep them consistent with the model.

### 3. Frontend Updates

- Updated the service icon selection to work with uppercase values
- Modified the service type and status dropdowns to use the new values 
- Ensured that the UI displays lowercase versions for users

### 4. Migration Script

Created a migration script to fix existing data:

```sql
-- Fix service_status values
UPDATE services SET status = 'HEALTHY' WHERE status = 'healthy';
UPDATE services SET status = 'DEGRADED' WHERE status = 'degraded';
UPDATE services SET status = 'DOWN' WHERE status = 'down';

-- Fix service_type values
UPDATE services SET service_type = 'API' WHERE service_type = 'api';
UPDATE services SET service_type = 'REPO' WHERE service_type = 'repository';
UPDATE services SET service_type = 'PLATFORM' WHERE service_type = 'platform';
UPDATE services SET service_type = 'WEBPAGE' WHERE service_type = 'webpage';
UPDATE services SET service_type = 'APP_MODULE' WHERE service_type = 'app_module';
```

## How to Apply the Fix

Run the migration script to update existing data:

```bash
python run_service_migration.py
```

## Restart Application

After applying the migration, restart the application to ensure all changes take effect.
