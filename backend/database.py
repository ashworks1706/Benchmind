"""
Database connection and session management
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from contextlib import contextmanager
import os

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://localhost/ai_agent_benchmark')

# Create engine
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Verify connections before using
    echo=os.getenv('SQL_ECHO', 'false').lower() == 'true'  # Set SQL_ECHO=true to debug queries
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Thread-safe session
db_session = scoped_session(SessionLocal)

@contextmanager
def get_db():
    """
    Context manager for database sessions
    Usage:
        with get_db() as db:
            user = db.query(User).first()
    """
    session = db_session()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def init_db():
    """Create all tables"""
    from models import Base
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created")


def drop_db():
    """Drop all tables (use with caution!)"""
    from models import Base
    Base.metadata.drop_all(bind=engine)
    print("⚠️  Database tables dropped")
