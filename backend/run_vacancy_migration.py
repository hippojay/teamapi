#!/usr/bin/env python3
"""
Script to run the vacancy flag migration to add is_vacancy field to TeamMember model
"""
import os
import sys
from migrations.add_vacancy_flag import upgrade

if __name__ == "__main__":
    print("Running vacancy flag migration...")
    upgrade()
    print("Vacancy flag migration completed.")
