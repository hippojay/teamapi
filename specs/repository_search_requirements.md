# Repository Search Feature Requirements

## Overview
This feature allows users to search and add code repositories to the "owned services" section of a squad's detail page. It provides a convenient way to discover and select repositories from GitLab and potentially other sources.

## User Requirements

1. Users should be able to search for repositories directly from the SquadDetailPage when adding services
2. The search should only activate after at least 3 characters are entered
3. Search results should update automatically as more characters are added
4. Users should be able to clearly distinguish between groups and actual repositories
5. Users should be able to select repositories by checking checkboxes
6. Users should be able to add selected repositories to a staging area before finalizing
7. Users should be able to add multiple repositories at once
8. Repository details should be automatically populated when added to a service
9. The feature should complement, not replace, the existing manual entry method

## Administrative Requirements

1. Administrators should be able to configure GitLab API settings through the admin panel
2. API URL and token settings should be securely stored
3. Configuration should support self-hosted GitLab instances (GitLab 16+)
4. The configuration interface should clearly indicate the required settings
5. Token information should be partially masked for security reasons
6. Both configuration items (API URL and token) must be provided for the feature to work

## Technical Requirements

1. The backend should provide API endpoints for repository search
2. Search functionality should be debounced to prevent excessive API calls
3. The system should handle errors gracefully, including network errors and API limits
4. Repository data should be cached appropriately to minimize API usage
5. The UI should provide clear feedback during search and selection processes
6. All API calls should use secure authentication
7. The system should be extensible to support additional repository sources in the future

## Implementation Notes

- The feature utilizes a split-screen modal interface for search and selection
- GitLab API v4 is used for searching repositories and groups
- Personal access tokens with API scope are required for authentication
- The feature supports both GitLab Cloud and self-hosted instances
- Both repositories and groups are searchable, allowing for efficient discovery