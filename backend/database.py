import os
import sys
import logging
from pathlib import Path
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.schema import CreateSchema
from typing import Optional, Dict, Any

# Import logger after it's created - will be lazy-loaded to avoid circular imports
logger = None

# Add python-dotenv for environment variable loading
try:
    from dotenv import load_dotenv
    # Try to load .env from the project root directory first
    root_dir = Path(__file__).resolve().parent.parent
    env_file = root_dir / ".env"
    if env_file.exists():
        print(f"Loading environment from {env_file}")
        load_dotenv(dotenv_path=env_file)
    else:
        # Fall back to the current directory
        current_dir = Path(__file__).resolve().parent
        env_file = current_dir / ".env"
        if env_file.exists():
            print(f"Loading environment from {env_file}")
            load_dotenv(dotenv_path=env_file)
        else:
            print("No .env file found, using default or system environment variables")
except ImportError:
    print("Warning: python-dotenv not installed. Install with pip install python-dotenv")
    print("Environment variables must be set manually or .env file won't be loaded.")
    # Continue without dotenv

# Initialize logger after environment is loaded
try:
    from logger import get_logger
    logger = get_logger('database')
except ImportError:
    # Fallback if logger module is not yet available
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    logger = logging.getLogger('database')

# Base declarative for all models
Base = declarative_base()

# Fixed application schema name for PostgreSQL
APP_SCHEMA_NAME = "who_what_where"

class DatabaseConfig:
    """Configuration class for database connection"""
    
    def __init__(self, connection_string: Optional[str] = None, schema: Optional[str] = None):
        # Default to SQLite if no connection string is provided
        self.is_postgres = False
        self.db_type = "sqlite"
        
        # For PostgreSQL, use the provided schema or default to APP_SCHEMA_NAME
        if schema:
            self.schema = schema
        else:
            self.schema = APP_SCHEMA_NAME if connection_string and connection_string.startswith("postgresql") else None
        
        if connection_string is None:
            # Default SQLite configuration
            self.connection_string = "sqlite:///./team_portal.db"
            self.connect_args = {"check_same_thread": False}
        elif connection_string.startswith("postgresql"):
            # PostgreSQL configuration
            self.connection_string = connection_string
            self.connect_args = {}
            self.is_postgres = True
            self.db_type = "postgresql"
            
            # Extract schema from connection string if present and override
            if '?schema=' in self.connection_string:
                self.schema = self.connection_string.split('?schema=')[1].split('&')[0]
                logger.info(f"Extracted schema from connection string: {self.schema}")
                # Remove schema parameter from connection string to avoid SQLAlchemy warnings
                self.connection_string = self.connection_string.split('?schema=')[0]
        else:
            # Assume SQLite if not PostgreSQL
            self.connection_string = connection_string
            self.connect_args = {"check_same_thread": False}
            
        # Log the schema being used
        if self.is_postgres:
            logger.info(f"Using PostgreSQL with schema: {self.schema}")
    
    def create_engine(self) -> Any:
        """Create SQLAlchemy engine based on configuration"""
        # Create engine with database-specific options
        if self.is_postgres:
            # PostgreSQL-specific configuration
            logger.info(f"Connecting to PostgreSQL database: {self.connection_string}")
            try:
                # Handle the case when psycopg2 might not be installed
                import psycopg2
                
                # Create the engine
                engine = create_engine(
                    self.connection_string,
                    connect_args=self.connect_args
                )
                
                # Create schema if specified and set it as the default search path
                if self.schema:
                    try:
                        # Check if schema exists
                        inspector = inspect(engine)
                        if not inspector.has_schema(self.schema):
                            with engine.begin() as conn:
                                conn.execute(CreateSchema(self.schema))
                                logger.info(f"Created schema: {self.schema}")
                        
                        # Set schema as the default search path
                        with engine.begin() as conn:
                            conn.execute(text(f"SET search_path TO {self.schema}"))
                            logger.info(f"Set search path to schema: {self.schema}")
                            
                        # Update the Base metadata with schema info
                        Base.metadata.schema = self.schema
                    except Exception as e:
                        logger.error(f"Error setting up schema: {str(e)}")
                        logger.info("Will attempt to use default schema")
                        
            except ImportError:
                logger.error("psycopg2 is not installed, but PostgreSQL connection was requested")
                raise ImportError("PostgreSQL support requires psycopg2 to be installed. Run 'pip install psycopg2-binary'")
            
        else:
            # SQLite configuration
            engine = create_engine(
                self.connection_string,
                connect_args=self.connect_args
            )
        
        return engine

# Get database configuration from environment or use defaults
def get_db_config() -> DatabaseConfig:
    # Get connection parameters from environment variables
    db_type = os.environ.get("DB_TYPE", "sqlite").lower()
    connection_string = os.environ.get("DATABASE_URL")
    schema = os.environ.get("DATABASE_SCHEMA")
    
    # Use APP_SCHEMA_NAME if schema is not explicitly set and using PostgreSQL
    if db_type == "postgresql" and not schema:
        schema = APP_SCHEMA_NAME
    
    # Database-specific configurations
    if db_type == "postgresql" and not connection_string:
        # Build PostgreSQL connection string if individual parameters are provided
        pg_host = os.environ.get("PG_HOST", "localhost")
        pg_port = os.environ.get("PG_PORT", "5432")
        pg_user = os.environ.get("PG_USER", "postgres")
        pg_password = os.environ.get("PG_PASSWORD", "")
        pg_dbname = os.environ.get("PG_DBNAME", "who_what_where")
        
        # Create connection string
        connection_string = f"postgresql://{pg_user}:{pg_password}@{pg_host}:{pg_port}/{pg_dbname}"
        
    # For SQLite, use DB_PATH if DATABASE_URL is not set
    elif db_type == "sqlite" and not connection_string:
        db_path = os.environ.get("DB_PATH", "./team_portal.db")
        if not db_path.startswith("sqlite://"):
            # Ensure proper SQLite URI format
            connection_string = f"sqlite:///{db_path}"
        else:
            connection_string = db_path
    
    return DatabaseConfig(connection_string, schema)

# Initialize database connection
db_config = get_db_config()
engine = db_config.create_engine()

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
