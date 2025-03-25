import pandas as pd
import os
import argparse
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import models
from models import InteractionMode

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

def load_dependencies_from_csv(file_path: str, db: Session, append_mode: bool = False):
    """
    Load dependency data from CSV file into the database

    Parameters:
    - file_path: Path to the CSV file
    - db: Database session
    - append_mode: If True, will update existing records rather than creating duplicates
    """
    print(f"Loading dependency data from {file_path}")

    # Read the CSV file
    try:
        df = pd.read_csv(file_path)
        print(f"Successfully read CSV file with {len(df)} rows")
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        return

    # Get existing squads by name for reference
    squads_by_name = {squad.name: squad for squad in db.query(models.Squad).all()}

    # Get existing dependencies if in append mode
    existing_dependencies = {}
    if append_mode:
        for dependency in db.query(models.Dependency).all():
            dependent_squad = db.query(models.Squad).filter(models.Squad.id == dependency.dependent_squad_id).first()
            dependency_squad = db.query(models.Squad).filter(models.Squad.id == dependency.dependency_squad_id).first()
            if dependent_squad and dependency_squad:
                key = f"{dependent_squad.name}_{dependency_squad.name}"
                existing_dependencies[key] = dependency

    # Validate required columns
    required_columns = ['Dependent Squad', 'Dependency Squad', 'Dependency Name', 'Interaction Mode']
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        print(f"Error: CSV is missing required columns: {', '.join(missing_columns)}")
        return

    # Process each dependency
    dependencies_created = 0
    dependencies_updated = 0
    dependencies_skipped = 0

    for _, row in df.iterrows():
        # Skip rows with missing required fields
        if (pd.isna(row['Dependent Squad']) or pd.isna(row['Dependency Squad'])
                or pd.isna(row['Dependency Name']) or pd.isna(row['Interaction Mode'])):
            print(f"Skipping row with missing required fields: {row}")
            dependencies_skipped += 1
            continue

        # Get the squad IDs from names
        dependent_squad_name = row['Dependent Squad']
        dependency_squad_name = row['Dependency Squad']

        if dependent_squad_name not in squads_by_name:
            print(f"Warning: Dependent squad '{dependent_squad_name}' not found. Skipping.")
            dependencies_skipped += 1
            continue

        if dependency_squad_name not in squads_by_name:
            print(f"Warning: Dependency squad '{dependency_squad_name}' not found. Skipping.")
            dependencies_skipped += 1
            continue

        dependent_squad_id = squads_by_name[dependent_squad_name].id
        dependency_squad_id = squads_by_name[dependency_squad_name].id

        # Determine interaction mode
        interaction_mode_str = row['Interaction Mode'].lower() if not pd.isna(row['Interaction Mode']) else "x_as_a_service"

        # Map interaction mode strings to enum values
        interaction_mode_mapping = {
            'x_as_a_service': InteractionMode.X_AS_A_SERVICE,
            'collaboration': InteractionMode.COLLABORATION,
            'facilitating': InteractionMode.FACILITATING
        }

        # Use the mapped value or default to X_AS_A_SERVICE
        interaction_mode = interaction_mode_mapping.get(interaction_mode_str, InteractionMode.X_AS_A_SERVICE)

        # Get interaction frequency if present
        interaction_frequency = row['Interaction Frequency'] if 'Interaction Frequency' in row and not pd.isna(row['Interaction Frequency']) else None

        # Check if this dependency already exists
        dependency_key = f"{dependent_squad_name}_{dependency_squad_name}"
        if append_mode and dependency_key in existing_dependencies:
            # Update existing dependency
            dependency = existing_dependencies[dependency_key]
            dependency.dependency_name = row['Dependency Name']
            dependency.interaction_mode = interaction_mode
            dependency.interaction_frequency = interaction_frequency

            print(f"Updated existing dependency: {dependent_squad_name} -> {dependency_squad_name}")
            dependencies_updated += 1
        else:
            # Create new dependency
            dependency = models.Dependency(
                dependent_squad_id=dependent_squad_id,
                dependency_squad_id=dependency_squad_id,
                dependency_name=row['Dependency Name'],
                interaction_mode=interaction_mode,
                interaction_frequency=interaction_frequency
            )
            db.add(dependency)
            print(f"Created new dependency: {dependent_squad_name} -> {dependency_squad_name}")
            dependencies_created += 1

    # Commit all changes
    db.commit()
    print(f"Dependency data successfully loaded from {file_path}!")
    print(f"Summary: {dependencies_created} created, {dependencies_updated} updated, {dependencies_skipped} skipped")

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Load dependency data from CSV file into the database')
    parser.add_argument('--file', '-f', type=str, help='Path to the CSV file to load')
    parser.add_argument('--append', '-a', action='store_true', help='Append to existing data instead of replacing')

    return parser.parse_args()

if __name__ == "__main__":
    args = parse_args()

    # Check if file is specified
    if not args.file:
        print("Error: No file specified. Please use --file option.")
        exit(1)

    # Check if file exists
    if not os.path.exists(args.file):
        print(f"Error: File not found: {args.file}")
        exit(1)

    # Get DB session
    db = SessionLocal()
    try:
        load_dependencies_from_csv(args.file, db, append_mode=args.append)
    finally:
        db.close()
