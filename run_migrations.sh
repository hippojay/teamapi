#!/bin/bash
cd /home/dave/who/backend
source venv/bin/activate || source venv/Scripts/activate
python run_migrations.py
echo "Database migrations completed"
