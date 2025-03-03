"""
Migration script to add new fields to team_members table
"""
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Table, MetaData, Float
from sqlalchemy.orm import sessionmaker
import os
import sys
from sqlalchemy import inspect

# Get database URL from environment or use default
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./team_portal.db")

# Create engine and session
engine = create_engine(DATABASE_URL)
Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
session = Session()

# Create metadata object
metadata = MetaData()
metadata.bind = engine

def upgrade():
    # Add supervisor_id and image_url columns to team_members table
    print("Adding supervisor_id and image_url columns to team_members table...")
    
    connection = engine.connect()
    
    # Check if the columns already exist
    inspector = inspect(engine)
    columns = [c['name'] for c in inspector.get_columns('team_members')]
    
    if 'supervisor_id' not in columns:
        print("Adding supervisor_id column...")
        connection.execute('ALTER TABLE team_members ADD COLUMN supervisor_id INTEGER REFERENCES team_members(id)')
    else:
        print("supervisor_id column already exists")
    
    if 'image_url' not in columns:
        print("Adding image_url column...")
        connection.execute('ALTER TABLE team_members ADD COLUMN image_url VARCHAR')
    else:
        print("image_url column already exists")
        
    # Create squad_members table for many-to-many relationship
    if 'squad_members' not in inspector.get_table_names():
        print("Creating squad_members table...")
        squad_members = Table(
            'squad_members',
            metadata,
            Column('id', Integer, primary_key=True),
            Column('member_id', Integer, ForeignKey('team_members.id')),
            Column('squad_id', Integer, ForeignKey('squads.id')),
            Column('capacity', Float, default=1.0),
            Column('role', String, nullable=True)
        )
        squad_members.create(engine)
        
        # Migrate existing data
        print("Migrating existing team member data to squad_members table...")
        result = connection.execute('SELECT id, squad_id, capacity, role FROM team_members WHERE squad_id IS NOT NULL')
        for row in result:
            connection.execute(
                f'INSERT INTO squad_members (member_id, squad_id, capacity, role) '
                f'VALUES ({row[0]}, {row[1]}, {row[2]}, "{row[3]}")'
            )
    else:
        print("squad_members table already exists")
    
    connection.close()
    print("Migration completed successfully!")

def downgrade():
    # Remove the added columns
    print("Removing supervisor_id and image_url columns from team_members table...")
    
    connection = engine.connect()
    inspector = inspect(engine)
    
    columns = [c['name'] for c in inspector.get_columns('team_members')]
    
    if 'supervisor_id' in columns:
        print("Removing supervisor_id column...")
        connection.execute('ALTER TABLE team_members DROP COLUMN supervisor_id')
    
    if 'image_url' in columns:
        print("Removing image_url column...")
        connection.execute('ALTER TABLE team_members DROP COLUMN image_url')
    
    # Drop squad_members table
    if 'squad_members' in inspector.get_table_names():
        print("Dropping squad_members table...")
        connection.execute('DROP TABLE squad_members')
    
    connection.close()
    print("Downgrade completed successfully!")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == 'downgrade':
        downgrade()
    else:
        upgrade()
