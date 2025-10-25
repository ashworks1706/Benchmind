#!/usr/bin/env python3
"""
Database initialization script
Run this to create all tables
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import init_db, drop_db
from dotenv import load_dotenv

load_dotenv()

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Initialize database')
    parser.add_argument('--drop', action='store_true', help='Drop all tables before creating')
    parser.add_argument('--force', action='store_true', help='Skip confirmation prompt')
    
    args = parser.parse_args()
    
    if args.drop:
        if not args.force:
            confirm = input('⚠️  This will DROP all tables. Are you sure? (yes/no): ')
            if confirm.lower() != 'yes':
                print('Aborted.')
                sys.exit(0)
        
        print('Dropping all tables...')
        drop_db()
    
    print('Creating database tables...')
    init_db()
    print('✅ Database initialized successfully!')
