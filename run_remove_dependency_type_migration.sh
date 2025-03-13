#!/bin/bash

# Make sure we're in the backend directory
cd "$(dirname "$0")/backend"

# Create migrations directory if it doesn't exist
mkdir -p migrations

# Run the migration script
python migrations/remove_dependency_type.py

echo "Dependency Type removal migration completed."
