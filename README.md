# Who What Where - Team API Portal

A prototype of a "Who What Where" team API portal that shows organizational structure, teams, services, and dependencies.

## Setup and Installation

### Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- npm or yarn

### Quick Start

1. Make the run script executable:
   ```bash
   chmod +x run.sh
   ```

2. Run the script:
   ```bash
   ./run.sh
   ```

This will:
- Create virtual environments
- Install dependencies
- Load sample data
- Start both the backend and frontend servers

## Accessing the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## Features

- **Organizational Structure**: Browse through Areas, Tribes, and Squads
- **Search**: Search across all entity types (areas, tribes, squads, people, services)
- **Team Capacity**: View team member allocations and total team capacity
- **Service Information**: Browse services with status and version information
- **Dependency Management**: See how teams depend on each other
- **On-Call Information**: View who's on call for each team

## Project Structure

- `backend/`: FastAPI Python backend with SQLite database
- `frontend/`: React frontend with TailwindCSS

## Development

### Backend (FastAPI)

The backend API is built with FastAPI and provides endpoints for:
- Areas, Tribes, Squads
- Team Members
- Services
- Dependencies
- On-Call information
- Search functionality

### Frontend (React)

The frontend is built with React and includes:
- React Router for navigation
- TailwindCSS for styling
- Lucide icons
- Advanced search component
- Responsive layout with sidebar navigation

## Data Model

The application uses a hierarchical data model:
- Areas contain Tribes
- Tribes contain Squads
- Squads contain Team Members and Services
- Squads have Dependencies on other Squads
- Squads have On-Call rosters

## License

This project is for demonstration purposes only.
