"""
RAG Service using ChromaDB for storing and searching project knowledge.
Stores: agents, tools, reports, docs, test results, and all project context.
"""

import chromadb
from chromadb.config import Settings
from fastembed import TextEmbedding
import json
import hashlib
from typing import List, Dict, Any, Optional
from datetime import datetime
import os

class FastEmbedEmbeddingFunction:
    """Wrapper for FastEmbed to work with ChromaDB."""
    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5"):
        self.model = TextEmbedding(model_name=model_name)
        self._model_name = model_name
    
    def __call__(self, input: List[str]) -> List[List[float]]:
        embeddings = list(self.model.embed(input))
        return embeddings
    
    def embed_query(self, text: str) -> List[float]:
        """Embed a single query text for ChromaDB query operations."""
        embeddings = list(self.model.embed([text]))
        return embeddings[0] if embeddings else []
    
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Embed multiple documents for ChromaDB operations."""
        return self.__call__(texts)
    
    def name(self) -> str:
        """Return the model name for ChromaDB compatibility."""
        return self._model_name

class RAGService:
    def __init__(self):
        """Initialize ChromaDB client and collections."""
        # Use persistent storage
        persist_directory = os.path.join(os.path.dirname(__file__), '..', 'data', 'chromadb')
        os.makedirs(persist_directory, exist_ok=True)
        
        self.client = chromadb.PersistentClient(
            path=persist_directory,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        # Use FastEmbed embeddings (very lightweight, 30MB model)
        self.embedding_fn = FastEmbedEmbeddingFunction(
            model_name="BAAI/bge-small-en-v1.5"  # 33MB, 384 dimensions
        )
        
        # Create collections for different types of knowledge
        self.collections = {
            'agents': self._get_or_create_collection('agents', 'Agent definitions and context'),
            'tools': self._get_or_create_collection('tools', 'Tool definitions and usage'),
            'reports': self._get_or_create_collection('reports', 'Test reports and analysis'),
            'docs': self._get_or_create_collection('docs', 'Documentation pages'),
            'code_context': self._get_or_create_collection('code_context', 'Code snippets and context'),
            'relationships': self._get_or_create_collection('relationships', 'Agent-tool relationships'),
        }
    
    def _get_or_create_collection(self, name: str, description: str):
        """Get or create a collection with embeddings."""
        try:
            # Try to get existing collection
            return self.client.get_collection(
                name=name,
                embedding_function=self.embedding_fn
            )
        except Exception as get_error:
            # Collection doesn't exist, create it
            try:
                return self.client.create_collection(
                    name=name,
                    embedding_function=self.embedding_fn,
                    metadata={"description": description}
                )
            except Exception as create_error:
                # If creation fails because it exists, try to get it again
                # This handles race conditions
                try:
                    return self.client.get_collection(
                        name=name,
                        embedding_function=self.embedding_fn
                    )
                except Exception as final_error:
                    raise Exception(f"Failed to get or create collection {name}: {final_error}")
    
    def _generate_id(self, prefix: str, content: str) -> str:
        """Generate unique ID from content."""
        hash_obj = hashlib.md5(content.encode())
        return f"{prefix}_{hash_obj.hexdigest()[:12]}"
    
    def index_agent_data(self, analysis_id: str, agent_data: Dict[str, Any]) -> Dict[str, int]:
        """
        Index complete agent analysis data.
        Returns counts of indexed items.
        """
        counts = {
            'agents': 0,
            'tools': 0,
            'relationships': 0,
            'code_context': 0
        }
        
        # Index agents
        if agent_data.get('agents'):
            for agent in agent_data['agents']:
                self._index_agent(analysis_id, agent)
                counts['agents'] += 1
        
        # Index tools
        if agent_data.get('tools'):
            for tool in agent_data['tools']:
                self._index_tool(analysis_id, tool)
                counts['tools'] += 1
        
        # Index relationships
        if agent_data.get('relationships'):
            for rel in agent_data['relationships']:
                self._index_relationship(analysis_id, rel)
                counts['relationships'] += 1
        
        # Index code context
        if agent_data.get('code_snippets'):
            for snippet in agent_data['code_snippets']:
                self._index_code_snippet(analysis_id, snippet)
                counts['code_context'] += 1
        
        return counts
    
    def _index_agent(self, analysis_id: str, agent: Dict[str, Any]):
        """Index a single agent with all its context."""
        agent_id = agent.get('id', '')
        
        # Create searchable text combining all agent info
        searchable_text = f"""
Agent: {agent.get('name', 'Unknown')}
Type: {agent.get('type', 'unknown')}
Description: {agent.get('description', 'No description')}
File: {agent.get('file_path', 'Unknown')}
Purpose: {agent.get('purpose', 'No purpose defined')}
Capabilities: {', '.join(agent.get('capabilities', []))}
"""
        
        # Add code snippet if available
        if agent.get('code_snippet'):
            searchable_text += f"\nCode:\n{agent['code_snippet']}"
        
        metadata = {
            'analysis_id': analysis_id,
            'agent_id': agent_id,
            'agent_name': agent.get('name', 'Unknown'),
            'agent_type': agent.get('type', 'unknown'),
            'file_path': agent.get('file_path', ''),
            'page_type': 'project_detail',  # Which page to navigate to
            'section_id': f'agent-{agent_id}',  # Section anchor
            'timestamp': datetime.utcnow().isoformat()
        }
        
        doc_id = self._generate_id('agent', f"{analysis_id}_{agent_id}")
        
        self.collections['agents'].upsert(
            ids=[doc_id],
            documents=[searchable_text],
            metadatas=[metadata]
        )
    
    def _index_tool(self, analysis_id: str, tool: Dict[str, Any]):
        """Index a single tool with all its context."""
        tool_id = tool.get('id', '')
        
        searchable_text = f"""
Tool: {tool.get('name', 'Unknown')}
Type: {tool.get('type', 'unknown')}
Description: {tool.get('description', 'No description')}
File: {tool.get('file_path', 'Unknown')}
Parameters: {json.dumps(tool.get('parameters', {}), indent=2)}
Usage: {tool.get('usage_examples', '')}
"""
        
        if tool.get('code_snippet'):
            searchable_text += f"\nCode:\n{tool['code_snippet']}"
        
        metadata = {
            'analysis_id': analysis_id,
            'tool_id': tool_id,
            'tool_name': tool.get('name', 'Unknown'),
            'tool_type': tool.get('type', 'unknown'),
            'file_path': tool.get('file_path', ''),
            'page_type': 'project_detail',
            'section_id': f'tool-{tool_id}',
            'timestamp': datetime.utcnow().isoformat()
        }
        
        doc_id = self._generate_id('tool', f"{analysis_id}_{tool_id}")
        
        self.collections['tools'].upsert(
            ids=[doc_id],
            documents=[searchable_text],
            metadatas=[metadata]
        )
    
    def _index_relationship(self, analysis_id: str, relationship: Dict[str, Any]):
        """Index agent-tool relationships."""
        source = relationship.get('source', '')
        target = relationship.get('target', '')
        rel_type = relationship.get('type', 'unknown')
        
        searchable_text = f"""
Relationship: {source} {rel_type} {target}
Type: {rel_type}
Context: {relationship.get('context', 'No context')}
"""
        
        metadata = {
            'analysis_id': analysis_id,
            'source': source,
            'target': target,
            'relationship_type': rel_type,
            'page_type': 'project_detail',
            'section_id': f'rel-{source}-{target}',
            'timestamp': datetime.utcnow().isoformat()
        }
        
        doc_id = self._generate_id('rel', f"{analysis_id}_{source}_{target}")
        
        self.collections['relationships'].upsert(
            ids=[doc_id],
            documents=[searchable_text],
            metadatas=[metadata]
        )
    
    def _index_code_snippet(self, analysis_id: str, snippet: Dict[str, Any]):
        """Index code snippets for context."""
        searchable_text = f"""
File: {snippet.get('file_path', 'Unknown')}
Language: {snippet.get('language', 'unknown')}
Code:
{snippet.get('code', '')}
Context: {snippet.get('context', '')}
"""
        
        metadata = {
            'analysis_id': analysis_id,
            'file_path': snippet.get('file_path', ''),
            'language': snippet.get('language', 'unknown'),
            'page_type': 'project_detail',
            'timestamp': datetime.utcnow().isoformat()
        }
        
        doc_id = self._generate_id('code', f"{analysis_id}_{snippet.get('file_path', '')}")
        
        self.collections['code_context'].upsert(
            ids=[doc_id],
            documents=[searchable_text],
            metadatas=[metadata]
        )
    
    def index_test_report(self, project_id: str, session_id: str, report: Dict[str, Any], 
                         test_cases: List[Dict[str, Any]]) -> int:
        """
        Index test report with all its details.
        Chunks report into sections for better search.
        """
        count = 0
        
        # Index summary
        summary_text = f"""
Test Report: {report.get('collection_name', 'Test Report')}
Description: {report.get('collection_description', '')}
Total Tests: {report.get('summary', {}).get('total_tests', 0)}
Passed: {report.get('summary', {}).get('passed', 0)}
Failed: {report.get('summary', {}).get('failed', 0)}
Success Rate: {report.get('summary', {}).get('success_rate', 0)}%
"""
        
        self.collections['reports'].upsert(
            ids=[self._generate_id('report_summary', session_id)],
            documents=[summary_text],
            metadatas=[{
                'project_id': project_id,
                'session_id': session_id,
                'report_type': 'summary',
                'page_type': 'report_detail',
                'page_url': f'/projects/{project_id}/reports/{session_id}',
                'section_id': 'summary',
                'timestamp': datetime.utcnow().isoformat()
            }]
        )
        count += 1
        
        # Index category performance
        if report.get('category_performance'):
            for cat in report['category_performance']:
                cat_text = f"""
Category: {cat.get('category', 'Unknown').replace('_', ' ').title()}
Average Score: {cat.get('average_score', 0)}
Benchmark: {cat.get('benchmark', 0)}
Tests: {cat.get('tests_run', 0)}
"""
                self.collections['reports'].upsert(
                    ids=[self._generate_id('report_cat', f"{session_id}_{cat.get('category')}")],
                    documents=[cat_text],
                    metadatas=[{
                        'project_id': project_id,
                        'session_id': session_id,
                        'report_type': 'category',
                        'category': cat.get('category', 'unknown'),
                        'page_type': 'report_detail',
                        'page_url': f'/projects/{project_id}/reports/{session_id}',
                        'section_id': 'category-performance',
                        'timestamp': datetime.utcnow().isoformat()
                    }]
                )
                count += 1
        
        # Index individual test results
        if report.get('test_results'):
            for test in report['test_results']:
                test_text = f"""
Test: {test.get('test_name', 'Unknown Test')}
Category: {test.get('category', 'General')}
Status: {test.get('status', 'unknown')}
Summary: {test.get('results', {}).get('summary', '')}
Details: {test.get('results', {}).get('details', '')}
"""
                if test.get('metrics'):
                    test_text += "\nMetrics:\n"
                    for metric in test['metrics']:
                        test_text += f"- {metric.get('name')}: {metric.get('value')}{metric.get('unit', '')}\n"
                
                self.collections['reports'].upsert(
                    ids=[self._generate_id('test_result', f"{session_id}_{test.get('test_id')}")],
                    documents=[test_text],
                    metadatas=[{
                        'project_id': project_id,
                        'session_id': session_id,
                        'report_type': 'test_result',
                        'test_id': test.get('test_id', ''),
                        'page_type': 'report_detail',
                        'page_url': f'/projects/{project_id}/reports/{session_id}',
                        'section_id': 'detailed-test-results',
                        'timestamp': datetime.utcnow().isoformat()
                    }]
                )
                count += 1
        
        # Index recommendations
        if report.get('recommendations'):
            for idx, rec in enumerate(report['recommendations']):
                rec_text = f"""
Issue: {rec.get('issue', 'Unknown Issue')}
Severity: {rec.get('severity', 'medium')}
Category: {rec.get('category', 'general')}
Impact: {rec.get('impact', '')}
Fix: {rec.get('fix', {}).get('explanation', '')}
"""
                self.collections['reports'].upsert(
                    ids=[self._generate_id('recommendation', f"{session_id}_{idx}")],
                    documents=[rec_text],
                    metadatas=[{
                        'project_id': project_id,
                        'session_id': session_id,
                        'report_type': 'recommendation',
                        'severity': rec.get('severity', 'medium'),
                        'page_type': 'report_detail',
                        'page_url': f'/projects/{project_id}/reports/{session_id}',
                        'section_id': 'recommendations',
                        'timestamp': datetime.utcnow().isoformat()
                    }]
                )
                count += 1
        
        return count
    
    def index_documentation(self, doc_sections: List[Dict[str, Any]]) -> int:
        """
        Index documentation pages with sections.
        Each section gets indexed separately for precise navigation.
        """
        count = 0
        
        for section in doc_sections:
            searchable_text = f"""
Section: {section.get('title', 'Untitled')}
Content: {section.get('content', '')}
Keywords: {', '.join(section.get('keywords', []))}
"""
            
            self.collections['docs'].upsert(
                ids=[self._generate_id('doc', section.get('id', section.get('title', '')))],
                documents=[searchable_text],
                metadatas=[{
                    'section_id': section.get('id', ''),
                    'title': section.get('title', 'Untitled'),
                    'page_type': 'docs',
                    'page_url': '/docs',
                    'section_anchor': section.get('id', ''),
                    'timestamp': datetime.utcnow().isoformat()
                }]
            )
            count += 1
        
        return count
    
    def search(self, query: str, top_k: int = 10, 
               collections: Optional[List[str]] = None,
               filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Search across all or specific collections.
        Returns results with navigation info.
        """
        if collections is None:
            collections = list(self.collections.keys())
        
        all_results = []
        
        for collection_name in collections:
            if collection_name not in self.collections:
                continue
            
            collection = self.collections[collection_name]
            
            try:
                results = collection.query(
                    query_texts=[query],
                    n_results=min(top_k, 10),  # Limit per collection
                    where=filters if filters else None,
                    include=['documents', 'metadatas', 'distances']
                )
                
                # Format results
                if results and results['ids']:
                    for i in range(len(results['ids'][0])):
                        all_results.append({
                            'id': results['ids'][0][i],
                            'text': results['documents'][0][i],
                            'metadata': results['metadatas'][0][i],
                            'score': 1 - results['distances'][0][i],  # Convert distance to similarity
                            'collection': collection_name
                        })
            except Exception as e:
                print(f"Error searching collection {collection_name}: {e}")
                continue
        
        # Sort by score and return top_k
        all_results.sort(key=lambda x: x['score'], reverse=True)
        return all_results[:top_k]
    
    def hybrid_search(self, query: str, project_id: Optional[str] = None,
                     top_k: int = 10) -> List[Dict[str, Any]]:
        """
        Hybrid search with filtering and ranking.
        Returns results formatted for Spotlight UI.
        """
        # Build filters
        filters = {}
        if project_id:
            filters['project_id'] = project_id
        
        # Search
        results = self.search(query, top_k=top_k * 2, filters=filters if filters else None)
        
        # Format for UI
        formatted_results = []
        for result in results[:top_k]:
            metadata = result['metadata']
            
            # Build navigation URL
            if metadata.get('page_type') == 'report_detail':
                url = metadata.get('page_url', '')
                section = metadata.get('section_id', '')
                if section:
                    url += f'#{section}'
            elif metadata.get('page_type') == 'docs':
                url = metadata.get('page_url', '/docs')
                section = metadata.get('section_anchor', '')
                if section:
                    url += f'#{section}'
            elif metadata.get('page_type') == 'project_detail':
                url = f'/projects/{metadata.get("analysis_id", "")}'
                section = metadata.get('section_id', '')
                if section:
                    url += f'#{section}'
            else:
                url = '/'
            
            # Extract preview text
            preview = result['text'][:200] + '...' if len(result['text']) > 200 else result['text']
            
            formatted_results.append({
                'id': result['id'],
                'title': self._extract_title(result['text'], metadata),
                'preview': preview,
                'url': url,
                'type': metadata.get('page_type', 'unknown'),
                'collection': result['collection'],
                'score': result['score'],
                'metadata': metadata
            })
        
        return formatted_results
    
    def _extract_title(self, text: str, metadata: Dict[str, Any]) -> str:
        """Extract a meaningful title from text and metadata."""
        # Try metadata first
        if metadata.get('agent_name'):
            return f"Agent: {metadata['agent_name']}"
        if metadata.get('tool_name'):
            return f"Tool: {metadata['tool_name']}"
        if metadata.get('title'):
            return metadata['title']
        
        # Extract from text
        lines = text.strip().split('\n')
        for line in lines:
            line = line.strip()
            if line and not line.startswith('#'):
                # Remove common prefixes
                for prefix in ['Agent:', 'Tool:', 'Test:', 'Section:', 'Category:']:
                    if line.startswith(prefix):
                        return line
                return line[:100]
        
        return 'Untitled'
    
    def delete_by_analysis(self, analysis_id: str):
        """Delete all documents for a specific analysis."""
        for collection in self.collections.values():
            try:
                collection.delete(where={"analysis_id": analysis_id})
            except:
                pass
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about indexed data."""
        stats = {}
        for name, collection in self.collections.items():
            try:
                count = collection.count()
                stats[name] = count
            except:
                stats[name] = 0
        return stats


# Singleton instance
_rag_service = None

def get_rag_service() -> RAGService:
    """Get or create RAG service instance."""
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service
