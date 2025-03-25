import os
from database import Base, engine

# Drop all tables and recreate them
def reset_database():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating tables from scratch...")
    Base.metadata.create_all(bind=engine)
    print("Database reset complete!")

if __name__ == "__main__":
    # Check if database file exists
    db_path = "team_portal.db"
    if os.path.exists(db_path):
        print(f"Found existing database: {db_path}")

    # Reset the database
    reset_database()
