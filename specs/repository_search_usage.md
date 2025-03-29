# Repository Search Feature - Usage Guide

## Overview

The Repository Search feature allows you to easily find and add repository services to your squad without manually entering all the details. This guide explains how to set up and use the feature.

## Administrator Setup

Before using the repository search feature, an administrator must configure it:

1. Navigate to the **Admin Dashboard**
2. Select the **Settings** tab
3. Scroll to the **Repository Search Configuration** section
4. Configure the following settings:
   - **GitLab API URL**: The base URL of your GitLab instance (e.g., `https://gitlab.example.com` or `https://gitlab.com`)
   - **GitLab API Token**: A personal access token with API scope permissions

### Creating a GitLab Personal Access Token

1. In your GitLab account, go to **User Settings** → **Access Tokens**
2. Create a new token with the `api` scope
3. Copy the generated token and paste it into the **GitLab API Token** field in the admin settings

## Using Repository Search

### Adding Repositories to a Squad

1. From the **Squad Detail Page**, scroll to the **Owned Services** section
2. Click the **Add Service** button
3. Select **Code Repository** from the **Service Type** dropdown
4. Click the **Search and Add Repositories** button

### Searching for Repositories

In the repository search modal:

1. Type at least 3 characters in the search box to start searching
2. Results will update automatically as you type
3. Both repositories and groups appear in search results:
   - **Repositories** are marked with a branch icon
   - **Groups** are marked with a folder icon
   
### Adding Repositories to Your Service

1. Select repositories by checking the checkboxes next to them
2. Click **Add Selected** to move them to the right panel
3. Review the repositories in the right panel
4. Click **Done** to add the repositories to your squad's services
   - If you selected one repository, it will populate the current service form
   - If you selected multiple repositories, they will all be added as separate services

### Tips for Effective Repository Search

- Use specific search terms to narrow down results
- Look for groups if you want to find multiple related repositories
- You can add and remove repositories from the selection panel before finalizing
- For large organizations, use department or project prefixes to find relevant repositories

## Troubleshooting

If repository search is not working:

1. Verify that both the GitLab API URL and token are configured correctly in admin settings
2. Ensure the token has not expired and has the correct permissions (api scope)
3. Check that your GitLab instance is accessible from the server
4. For self-hosted GitLab, verify you're using GitLab 16 or newer
5. Contact your administrator if you continue to experience issues