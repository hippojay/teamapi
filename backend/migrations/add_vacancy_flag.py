import os
import sys
from sqlalchemy import Boolean, Column, create_engine, MetaData, Table, text
from alembic import op
import sqlalchemy as sa

# Add parent directory to path to import database configuration
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import Base, SQLALCHEMY_DATABASE_URL

def upgrade():
    """Add is_vacancy column to team_members table"""
    # Create a database connection
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    # Create a connection for executing raw SQL
    with engine.connect() as conn:
        # Check if column already exists
        inspector = sa.inspect(engine)
        columns = [column['name'] for column in inspector.get_columns('team_members')]
        
        if 'is_vacancy' not in columns:
            print("Adding is_vacancy column to team_members table...")
            conn.execute(text("ALTER TABLE team_members ADD COLUMN is_vacancy BOOLEAN DEFAULT FALSE"))
            
            # Update existing records where name is 'Vacancy'
            conn.execute(text("UPDATE team_members SET is_vacancy = TRUE WHERE name = 'Vacancy'"))
            conn.commit()
            print("Migration completed successfully!")
        else:
            print("Column is_vacancy already exists in team_members table")

def downgrade():
    """Remove is_vacancy column from team_members table"""
    # Create a database connection
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    # Create a connection for executing raw SQL
    with engine.connect() as conn:
        # Check if column exists
        inspector = sa.inspect(engine)
        columns = [column['name'] for column in inspector.get_columns('team_members')]
        
        if 'is_vacancy' in columns:
            print("Removing is_vacancy column from team_members table...")
            conn.execute(text("ALTER TABLE team_members DROP COLUMN is_vacancy"))
            conn.commit()
            print("Downgrade completed successfully!")
        else:
            print("Column is_vacancy does not exist in team_members table")

def migrate():
    """Run the migration"""
    upgrade()

if __name__ == "__main__":
    # If script is run directly, perform the upgrade
    migrate()
