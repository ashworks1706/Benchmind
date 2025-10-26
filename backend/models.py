"""
Database models for AI Agent Benchmark platform
"""
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = 'users'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    github_id = Column(String(50), unique=True, nullable=False, index=True)
    username = Column(String(255), nullable=False)
    email = Column(String(255))
    avatar_url = Column(String(500))
    github_access_token_encrypted = Column(Text)  # Encrypted token
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    projects = relationship('Project', back_populates='user', cascade='all, delete-orphan')
    
    def to_dict(self, include_token=False):
        data = {
            'id': self.id,
            'githubId': self.github_id,
            'username': self.username,
            'email': self.email,
            'avatarUrl': self.avatar_url,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_token and self.github_access_token_encrypted:
            # Will decrypt in service layer
            data['accessToken'] = self.github_access_token_encrypted
        return data


class Project(Base):
    __tablename__ = 'projects'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False, index=True)
    
    name = Column(String(255), nullable=False)
    description = Column(Text)
    repo_url = Column(String(500), nullable=False)
    repo_name = Column(String(255))
    repo_owner = Column(String(255))
    
    # Configuration stored as JSON
    config = Column(JSON, default={})
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_analyzed_at = Column(DateTime)
    
    # Computed stats
    total_analyses = Column(Integer, default=0)
    total_tests = Column(Integer, default=0)
    average_score = Column(Float)
    
    # Relationships
    user = relationship('User', back_populates='projects')
    analyses = relationship('Analysis', back_populates='project', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'name': self.name,
            'description': self.description,
            'repoUrl': self.repo_url,
            'repoName': self.repo_name,
            'repoOwner': self.repo_owner,
            'config': self.config or {},
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
            'lastAnalyzedAt': self.last_analyzed_at.isoformat() if self.last_analyzed_at else None,
            'totalAnalyses': self.total_analyses or 0,
            'totalTests': self.total_tests or 0,
            'averageScore': self.average_score,
        }


class Analysis(Base):
    __tablename__ = 'analyses'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey('projects.id'), nullable=False, index=True)
    
    # Agent data stored as JSON (full AgentData structure)
    agent_data = Column(JSON)
    
    # Test cases stored as JSON array
    test_cases = Column(JSON)
    
    # Status tracking
    status = Column(String(50), default='queued', nullable=False)  # queued, processing, completed, failed
    progress = Column(Integer, default=0)
    error_message = Column(Text)
    
    # Results
    test_report = Column(JSON)
    overall_score = Column(Float)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime)
    duration_ms = Column(Integer)
    
    # Track if loaded from cache
    from_cache = Column(Boolean, default=False)
    
    # Relationships
    project = relationship('Project', back_populates='analyses')
    test_sessions = relationship('TestSession', back_populates='analysis', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'projectId': self.project_id,
            'agentData': self.agent_data,
            'testCases': self.test_cases,
            'status': self.status,
            'progress': self.progress,
            'errorMessage': self.error_message,
            'testReport': self.test_report,
            'overallScore': self.overall_score,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'completedAt': self.completed_at.isoformat() if self.completed_at else None,
            'durationMs': self.duration_ms,
            'fromCache': self.from_cache,
        }


class TestSession(Base):
    """Stores individual test sessions with their results and fixes"""
    __tablename__ = 'test_sessions'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    analysis_id = Column(String(36), ForeignKey('analyses.id'), nullable=True, index=True)  # Nullable for standalone sessions
    project_id = Column(String(36), ForeignKey('projects.id'), nullable=True, index=True)  # Nullable for standalone sessions
    
    name = Column(String(255), nullable=False)
    color = Column(String(20))  # Gradient color for visualization
    
    # Test data stored as JSON
    test_cases = Column(JSON)  # Array of test case IDs
    test_report = Column(JSON)  # Full test report
    fixes = Column(JSON)  # Array of fixes with status (pending/accepted/rejected)
    
    # Metadata
    total_tests = Column(Integer, default=0)
    passed_tests = Column(Integer, default=0)
    failed_tests = Column(Integer, default=0)
    warning_tests = Column(Integer, default=0)
    success_rate = Column(Float, default=0.0)
    
    total_fixes = Column(Integer, default=0)
    pending_fixes = Column(Integer, default=0)
    accepted_fixes = Column(Integer, default=0)
    rejected_fixes = Column(Integer, default=0)
    
    fixes_locked = Column(Boolean, default=False)  # True when user must review fixes
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime)
    
    # Relationships
    analysis = relationship('Analysis', back_populates='test_sessions')
    project = relationship('Project')
    
    def to_dict(self):
        return {
            'id': self.id,
            'analysisId': self.analysis_id,
            'projectId': self.project_id,
            'name': self.name,
            'color': self.color,
            'testCases': self.test_cases or [],
            'testReport': self.test_report,
            'fixes': self.fixes or [],
            'metadata': {
                'totalTests': self.total_tests or 0,
                'passedTests': self.passed_tests or 0,
                'failedTests': self.failed_tests or 0,
                'warningTests': self.warning_tests or 0,
                'successRate': self.success_rate or 0.0,
                'totalFixes': self.total_fixes or 0,
                'pendingFixes': self.pending_fixes or 0,
                'acceptedFixes': self.accepted_fixes or 0,
                'rejectedFixes': self.rejected_fixes or 0,
            },
            'fixesLocked': self.fixes_locked,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'completedAt': self.completed_at.isoformat() if self.completed_at else None,
        }


class GitHubRepositoryCache(Base):
    """Cache GitHub repository data to reduce API calls"""
    __tablename__ = 'github_repo_cache'
    
    id = Column(Integer, primary_key=True)  # GitHub repo ID
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False, index=True)
    
    name = Column(String(255), nullable=False)
    full_name = Column(String(500), nullable=False)
    description = Column(Text)
    html_url = Column(String(500))
    private = Column(Boolean, default=False)
    language = Column(String(100))
    stargazers_count = Column(Integer, default=0)
    
    updated_at = Column(DateTime)  # Last updated on GitHub
    cached_at = Column(DateTime, default=datetime.utcnow, nullable=False)  # When we cached it
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'full_name': self.full_name,
            'description': self.description,
            'html_url': self.html_url,
            'private': self.private,
            'language': self.language,
            'stargazers_count': self.stargazers_count,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
