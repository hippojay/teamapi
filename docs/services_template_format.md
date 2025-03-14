# Services Template Format

This template shows how to structure your services data for import into the system.

## Required Columns:
- `Service Name`: The name of the service (required)
- `Squad Name`: The name of the owning squad (required)
- `Type`: Service type (api, repository, platform, webpage, app_module)
- `URL`: Link to the service (optional)
- `Description`: Description of the service (optional)
- `Version`: Current version of the service (optional)

## Service Types:
- `api`: REST/GraphQL APIs
- `repository`: Code repositories
- `platform`: Platform services
- `webpage`: Web pages or sections
- `app_module`: Mobile app modules

## Example Rows:

1. API Example
   - Service Name: User Authentication API
   - Squad Name: Identity Squad
   - Type: api
   - Description: REST API for user authentication and authorization
   - URL: https://example.com/api/auth/docs
   - Version: 1.2.0

2. Repository Example
   - Service Name: Frontend Code Repository
   - Squad Name: UI Squad
   - Type: repository
   - Description: Main repository for the web application frontend code
   - URL: https://gitlab.example.com/frontend
   - Version: 3.5.0

3. Platform Service Example
   - Service Name: Data Lake Service
   - Squad Name: Data Platform Squad
   - Type: platform
   - Description: Data storage and processing platform service
   - URL: https://data-platform.example.com
   - Version: 2.0.0

4. Web Page Example
   - Service Name: Customer Dashboard
   - Squad Name: UX Squad
   - Type: webpage
   - Description: Main customer dashboard web page
   - URL: https://example.com/dashboard
   - Version: 1.8.4

5. App Module Example
   - Service Name: Mobile Payment Module
   - Squad Name: Mobile Apps Squad
   - Type: app_module
   - Description: Payment processing module for the mobile application
   - URL: https://app.example.com/module/payments
   - Version: 4.2.1

## Loading Data

To load data from this template, use the following command:

```bash
python load_prod_data.py --file services_template.xlsx --services
```

Make sure the Squad Names exist in the system before loading services data.
