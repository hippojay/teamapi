#!/bin/bash

# Initialize the database
echo "Initializing database..."
cd backend
python reset_db.py

# Load test data
echo "Loading test data..."
python load_data.py

# Create admin user
echo "Creating admin user..."
python create_admin.py admin admin@example.com admin123

echo "Database initialization complete!"
echo "Admin user created with:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "You can now start the backend and frontend:"
echo "  Backend: cd backend && python main.py"
echo "  Frontend: cd frontend && npm start"
