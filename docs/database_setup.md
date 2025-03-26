# Database Setup for Who What Where

This guide explains how to configure and use the database systems supported by Who What Where.

## Supported Database Systems

Who What Where supports two database systems:

1. **SQLite** (default) - Great for development and small deployments
2. **PostgreSQL** - Recommended for production use

## Automatic Database Initialization

Who What Where automatically checks if the required database tables exist:

- If tables don't exist, they will be created automatically
- No manual initialization is required for a new database
- The application will never reinitialize an existing database unless explicitly forced

## Database Configuration

### SQLite Configuration

SQLite is the default and requires minimal configuration:

```
# In .env file
DB_TYPE=sqlite
DB_PATH=./team_portal.db
```

### PostgreSQL Configuration

To use PostgreSQL, you need to specify the connection details:

```
# In .env file
DB_TYPE=postgresql
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
DATABASE_SCHEMA=schema_name
```

You can also specify individual connection parameters:

```
# In .env file
DB_TYPE=postgresql
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=your_password
PG_DBNAME=who_what_where
DATABASE_SCHEMA=who
```

## Command-Line Configuration

You can also override database settings via command-line arguments:

```bash
python backend/main.py --db-type postgresql --connection-string "postgresql://username:password@localhost:5432/database_name" --schema schema_name
```

## Reinitializing a Database (Use with Caution)

To reinitialize an existing database (will delete all data):

```bash
python backend/main.py --force-initdb
```

This is helpful when:
- Your schema has been corrupted
- You want to completely reset your data
- You're setting up a new schema in an existing PostgreSQL database

## Schema Support for PostgreSQL

For PostgreSQL, we recommend using a dedicated schema:

1. This keeps your Who What Where tables organized
2. Avoids conflicts with other applications using the same database
3. Simplifies permissions management

You can specify the schema in two ways:
- In the DATABASE_SCHEMA environment variable 
- Using the --schema command-line argument

## Best Practices

1. **Development**: Use SQLite for simplicity
2. **Testing**: Use a dedicated PostgreSQL schema
3. **Production**: Use PostgreSQL with proper backup procedures
4. **Never use --force-initdb** on a production database unless you intend to delete all data
5. Store database credentials securely, never in version control
