#!/usr/bin/env python3
"""
Populate RAG database with existing data from SQL database.
This script indexes all analyses, test sessions, and reports into ChromaDB for searchability.
"""

import sys
import os
from datetime import datetime

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import get_db
from models import Analysis, TestSession, Project
from services.rag_service import get_rag_service
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def populate_rag_from_database():
    """
    Populate RAG database with all existing data from SQL database.
    """
    logger.info("Starting RAG population from existing database...")
    
    try:
        rag = get_rag_service()
    except Exception as e:
        logger.error(f"Failed to initialize RAG service: {str(e)}", exc_info=True)
        raise
    
    stats = {
        'analyses_indexed': 0,
        'test_sessions_indexed': 0,
        'total_agent_items': 0,
        'total_report_items': 0,
        'errors': 0,
        'skipped': 0
    }
    
    with get_db() as db:
        # Get all analyses
        analyses = db.query(Analysis).all()
        logger.info(f"Found {len(analyses)} analyses to index")
        
        for analysis in analyses:
            try:
                if not analysis.agent_data:
                    logger.debug(f"Skipping analysis {analysis.id} - no agent data")
                    continue
                
                logger.info(f"Indexing analysis {analysis.id}")
                counts = rag.index_agent_data(analysis.id, analysis.agent_data)
                
                stats['analyses_indexed'] += 1
                stats['total_agent_items'] += sum(counts.values())
                
                logger.info(f"  ✓ Indexed: {counts}")
                
            except Exception as e:
                logger.error(f"Failed to index analysis {analysis.id}: {str(e)}", exc_info=True)
                stats['errors'] += 1
        
        # Get all test sessions
        test_sessions = db.query(TestSession).all()
        logger.info(f"Found {len(test_sessions)} test sessions to index")
        
        for session in test_sessions:
            try:
                if not session.test_report:
                    logger.debug(f"Skipping test session {session.id} - no test report")
                    continue
                
                logger.info(f"Indexing test session {session.id}")
                count = rag.index_test_report(
                    project_id=session.project_id or 'unknown',
                    session_id=session.id,
                    report=session.test_report,
                    test_cases=session.test_cases or []
                )
                
                stats['test_sessions_indexed'] += 1
                stats['total_report_items'] += count
                
                logger.info(f"  ✓ Indexed {count} report documents")
                
            except Exception as e:
                logger.error(f"Failed to index test session {session.id}: {str(e)}", exc_info=True)
                stats['errors'] += 1
    
    # Get RAG stats
    rag_stats = rag.get_stats()
    
    logger.info("\n" + "="*60)
    logger.info("RAG POPULATION COMPLETE")
    logger.info("="*60)
    logger.info(f"Analyses indexed:      {stats['analyses_indexed']}")
    logger.info(f"Test sessions indexed: {stats['test_sessions_indexed']}")
    logger.info(f"Total agent items:     {stats['total_agent_items']}")
    logger.info(f"Total report items:    {stats['total_report_items']}")
    logger.info(f"Items skipped:         {stats['skipped']}")
    logger.info(f"Errors encountered:    {stats['errors']}")
    logger.info("\nRAG Collection Stats:")
    for collection, count in rag_stats.items():
        logger.info(f"  {collection:20s}: {count:5d} documents")
    logger.info("="*60)
    
    return stats


def clear_rag_database():
    """
    Clear all data from RAG database.
    Use with caution!
    """
    logger.warning("CLEARING RAG DATABASE...")
    
    rag = get_rag_service()
    
    try:
        # Get stats before clearing
        before_stats = rag.get_stats()
        logger.info(f"Before: {before_stats}")
        
        # Reset the client (clears all collections)
        rag.client.reset()
        
        # Reinitialize collections
        rag.__init__()
        
        after_stats = rag.get_stats()
        logger.info(f"After: {after_stats}")
        
        logger.info("✓ RAG database cleared successfully")
        
    except Exception as e:
        logger.error(f"Failed to clear RAG database: {str(e)}", exc_info=True)
        raise


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Populate RAG database with existing data from SQL database'
    )
    parser.add_argument(
        '--clear',
        action='store_true',
        help='Clear RAG database before populating (use with caution!)'
    )
    parser.add_argument(
        '--stats-only',
        action='store_true',
        help='Only show RAG database statistics without populating'
    )
    
    args = parser.parse_args()
    
    try:
        if args.stats_only:
            rag = get_rag_service()
            stats = rag.get_stats()
            print("\nRAG Database Statistics:")
            print("="*40)
            for collection, count in stats.items():
                print(f"{collection:20s}: {count:5d} documents")
            print("="*40)
        
        else:
            if args.clear:
                response = input("⚠️  Are you sure you want to CLEAR the RAG database? (yes/no): ")
                if response.lower() == 'yes':
                    clear_rag_database()
                else:
                    print("Cancelled.")
                    sys.exit(0)
            
            populate_rag_from_database()
        
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}", exc_info=True)
        sys.exit(1)
