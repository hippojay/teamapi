# Enum Handling in Who What Where

This document explains how enums are handled in the application to ensure consistency across different database types.

## Overview

The application uses several enums for field values such as team types, service statuses, and interaction modes. 
To ensure compatibility across different database backends (SQLite and PostgreSQL) and avoid case-sensitivity issues, 
we use a consistent approach to enum storage and retrieval.

## Implementation Approach

1. **String-Based Enum Storage**: All enum values are stored as strings in the database, rather than using native PostgreSQL ENUM types.
   
2. **Consistent Case**: All enum values are stored in UPPERCASE in the database for consistency.

3. **Case-Insensitive Handling**: When comparing or setting enum values, we first convert to uppercase before processing.

4. **No Runtime Type Conversions**: We avoid runtime type conversions between strings and enums to prevent compatibility issues.

## Enum Types

The application uses these main enum types:

### TeamType (in models.py)
```python
class TeamType(enum.Enum):
    STREAM_ALIGNED = "STREAM_ALIGNED"
    PLATFORM = "PLATFORM"
    ENABLING = "ENABLING"
    COMPLICATED_SUBSYSTEM = "COMPLICATED_SUBSYSTEM"
```

### ServiceStatus (in models.py)
```python
class ServiceStatus(enum.Enum):
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    DOWN = "DOWN"
```

### InteractionMode (in models.py)
```python
class InteractionMode(enum.Enum):
    COLLABORATION = "COLLABORATION"
    X_AS_A_SERVICE = "X_AS_A_SERVICE"
    FACILITATING = "FACILITATING"
```

## Best Practices

When working with enums in the codebase:

1. **Always use string values**: When storing enum values in the database, use the `.value` property of the enum to get the string representation:
   ```python
   squad.team_type = TeamType.STREAM_ALIGNED.value  # Correct: "STREAM_ALIGNED"
   ```

2. **Case normalization**: When retrieving strings from user input, normalize the case:
   ```python
   input_team_type = user_input.upper()  # Convert to uppercase
   if input_team_type in ["STREAM_ALIGNED", "PLATFORM", "ENABLING", "COMPLICATED_SUBSYSTEM"]:
       # Valid team type
   ```

3. **Validation**: Always validate enum values before storing them:
   ```python
   valid_types = [t.value for t in TeamType]
   if team_type not in valid_types:
       team_type = TeamType.STREAM_ALIGNED.value  # Default value
   ```

4. **Avoid migrations**: We've moved away from running migrations to convert enum types. 
   Instead, we handle enum values consistently in the code.

## Migration for Existing Databases

If you have existing data with lowercase enum values, a SQL script is provided to standardize them:

```sql
-- Run this manually on your database
UPDATE squads SET team_type = UPPER(team_type);
UPDATE dependencies SET interaction_mode = UPPER(interaction_mode);
```

The script is available at `backend/migrations/standardize_enums.sql`.

## Troubleshooting

If you encounter enum-related errors:

1. Check that all enum values in the database are in UPPERCASE
2. Ensure your code is using consistent case handling (uppercase for storage, case-insensitive for comparison)
3. Avoid using native PostgreSQL ENUM types if you're using PostgreSQL as your database
