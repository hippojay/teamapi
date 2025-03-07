# Service Model Update

This document explains the changes made to the services model to support different types of services that a squad can own.

## New Service Types

The Service model has been updated to support the following types of services:

- **API**: REST/GraphQL APIs and web services
- **Repository**: Code repositories (e.g., GitLab, GitHub)
- **Platform**: Platform services provided for people to consume
- **Webpage**: Parts of the website
- **App Module**: Distinct parts of mobile applications

## Schema Changes

The following changes have been made to the Service model:

1. Added `service_type` enum field with the following options:
   - `api` (default for backward compatibility)
   - `repository`
   - `platform`
   - `webpage`
   - `app_module`

2. Added `url` field to provide a generic link to any service type
   - For API services, this replaces the previous `api_docs_url` field
   - For other service types, this links to the relevant resource

## Applying the Migration

To update your database with these changes, run:

```bash
python run_service_migration.py
```

To check if the migration has been applied:

```bash
python run_service_migration.py --check
```

## Loading Service Data

A new template for service data has been created: `services_template.xlsx`

To load services data from this template:

```bash
python load_prod_data.py --file services_template.xlsx --services
```

This will load data from the "Services" sheet of the Excel file. Make sure the squads referenced in the services data already exist in the database.

## Service Data Format

The services data Excel file should contain the following columns:

- `Service Name`: The name of the service (required)
- `Squad Name`: The name of the owning squad (required)
- `Type`: Service type - one of: api, repository, platform, webpage, app_module
- `URL`: Link to the service (optional)
- `Description`: Description of the service (optional)
- `Version`: Current version of the service (optional)

See `services_template_format.md` for more detailed examples.

## UI Updates

The UI has been updated to display different icons and labels based on the service type:

- API services: `<Code />` icon
- Repository services: `<GitBranch />` icon
- Platform services: `<Server />` icon
- Web page services: `<Globe />` icon
- App module services: `<Smartphone />` icon

The service detail page also displays the service type and provides appropriate labels for the URL.
