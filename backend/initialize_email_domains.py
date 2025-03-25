#!/usr/bin/env python3
"""
Script to initialize the allowed email domains setting if it doesn't exist
"""
from database import SessionLocal
import models

def initialize_email_domains():
    """Initialize the allowed_email_domains setting if it doesn't exist"""
    db = SessionLocal()
    try:
        # Check if the setting already exists
        setting = db.query(models.AdminSetting).filter(models.AdminSetting.key == "allowed_email_domains").first()

        if not setting:
            # Create the setting with some default domains
            setting = models.AdminSetting(
                key="allowed_email_domains",
                value="example.com\ngmail.com\nyahoo.com",
                description="List of allowed email domains for user registration. Add one domain per line or separate with commas. Users can only register with email addresses from these domains."
            )
            db.add(setting)
            db.commit()
            print("Initialized allowed_email_domains setting")
        else:
            print("allowed_email_domains setting already exists")

    finally:
        db.close()

if __name__ == "__main__":
    initialize_email_domains()
