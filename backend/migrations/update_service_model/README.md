# Service Model Update

This migration adds the following fields to the Service model:

- `service_type`: An enum field to identify the type of service
  - Options: `api`, `repository`, `platform`, `webpage`, `app_module`
  - Default: `api` (for backward compatibility)
  
- `url`: A generic URL field that can point to any service
  - For API services, the existing `api_docs_url` values will be migrated to this field
  - This field replaces the specific `api_docs_url` field for greater flexibility

## Running the Migration

```bash
cd /home/dave/who/backend
python -m migrations.20250307_update_service_model.migrate
```

## Compatibility

This migration maintains backward compatibility:
- Existing services will be assigned the `api` type by default
- Existing `api_docs_url` values will be copied to the new `url` field

## Schema Changes

```sql
ALTER TABLE services ADD COLUMN service_type VARCHAR(20) DEFAULT 'api';
ALTER TABLE services ADD COLUMN url VARCHAR DEFAULT NULL;
UPDATE services SET url = api_docs_url WHERE url IS NULL AND api_docs_url IS NOT NULL;
```
