#!/usr/bin/env python3
"""
Migration script to add test_cases column to analyses table
"""
import sys
import os
from dotenv import load_dotenv
from sqlalchemy import text

# Load environment variables
load_dotenv()

from database import engine

def add_test_cases_column():
    """Add test_cases JSON column to analyses table"""
    try:
        with engine.connect() as conn:
            # Check if column exists
            check_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='analyses' AND column_name='test_cases'
            """)
            result = conn.execute(check_query)
            
            if result.fetchone():
                print("✓ test_cases column already exists")
                return True
            
            # Add the column
            print("Adding test_cases column to analyses table...")
            alter_query = text("""
                ALTER TABLE analyses 
                ADD COLUMN test_cases JSON
            """)
            conn.execute(alter_query)
            conn.commit()
            
            print("✓ Successfully added test_cases column")
            return True
            
    except Exception as e:
        print(f"✗ Error adding test_cases column: {e}")
        return False

if __name__ == "__main__":
    success = add_test_cases_column()
    sys.exit(0 if success else 1)
