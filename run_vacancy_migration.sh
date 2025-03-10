#!/bin/bash
cd /home/dave/who/backend
source venv/bin/activate || source venv/Scripts/activate
python run_vacancy_migration.py
echo "Vacancy flag migration completed"
