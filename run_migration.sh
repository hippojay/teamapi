#!/bin/bash
cd /home/dave/who/backend
source venv/bin/activate
python migrations/add_team_type.py
echo "Team type migration completed"
