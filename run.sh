#!/bin/bash
# Make this script executable with: chmod +x run.sh

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed. Please install Python 3 and try again."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js and try again."
    exit 1
fi

# Backend setup
cd backend

# Create a virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate the virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing backend dependencies..."
pip install -r requirements.txt

# Load data if database doesn't exist
if [ ! -f "team_portal.db" ]; then
    echo "Database not found. Loading initial data..."
    python load_data.py
fi

# Start the backend server in the background
echo "Starting backend server..."
python main.py &
BACKEND_PID=$!
echo "Backend running with PID $BACKEND_PID"

# Wait for the backend to start
echo "Waiting for backend to start..."
sleep 5

# Frontend setup
cd ../frontend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Start the frontend in development mode
echo "Starting frontend development server..."
npm start &
FRONTEND_PID=$!
echo "Frontend running with PID $FRONTEND_PID"

# Function to handle script termination
function cleanup {
    echo "Stopping services..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit 0
}

# Register the cleanup function for termination signals
trap cleanup SIGINT SIGTERM

# Keep the script running
echo "Services started. Press Ctrl+C to stop."
wait
