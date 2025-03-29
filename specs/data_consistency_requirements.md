# Data Consistency Requirements

This document outlines requirements for maintaining consistent data formats and values in the Who What Where application.

## Case Sensitivity

1. All enum values stored in the database MUST BE lowercase to ensure consistency
2. All enum values MUST BE normalized to lowercase before being stored
3. Frontend components MUST validate and normalize input values to lowercase when appropriate
4. API endpoints MUST validate and normalize enum parameters before processing
5. All data loading scripts MUST ensure enum values are lowercase
6. Database model defaults MUST use lowercase values

## Enum Values

1. Team types must be one of: stream_aligned, platform, enabling, complicated_subsystem
2. Interaction modes must be one of: collaboration, x_as_a_service, facilitating
3. Service types must be one of: api, repo, platform, webpage, app_module
4. Service status must be one of: healthy, degraded, down
5. Area and tribe labels must be one of: cfu_aligned, platform_group, digital

## Validation Rules

1. API endpoints must validate enum values against predefined lists of acceptable values
2. Frontend components should prevent users from submitting invalid enum values
3. Error messages for invalid enums should clearly list the acceptable values
4. If an invalid value is received, the system should either:
   - Return a 400 Bad Request response with a helpful error message
   - Default to a predefined value when appropriate (with logging)
