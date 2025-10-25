import json
import re
import time
import google.generativeai as genai
from typing import Dict, List, Any, Callable
from config import Config

genai.configure(api_key=Config.GEMINI_API_KEY)

class TestGenerator:
    """Service for generating and running test cases for AI agents"""
    
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        self.progress_callback = None
        
    def generate_test_cases(
        self, 
        agent_data: Dict[str, Any],
        progress_callback: Callable[[str, Dict], None] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate test cases for the analyzed agents with progress updates
        
        Args:
            agent_data: Structured agent data with configurations
            progress_callback: Function to call with progress updates
            
        Returns:
            List of test case objects with metrics and benchmarks
        """
        if progress_callback:
            progress_callback("status", {
                "step": "analyzing_codebase",
                "message": "🔍 Getting context of your codebase...",
                "progress": 10
            })
        
        agents = agent_data.get('agents', [])
        tools = agent_data.get('tools', [])
        relationships = agent_data.get('relationships', [])
        
        if progress_callback:
            progress_callback("status", {
                "step": "preparing_tests",
                "message": f"📋 Analyzing {len(agents)} agents, {len(tools)} tools, and {len(relationships)} relationships...",
                "progress": 20
            })
        
        time.sleep(0.5)  # Small delay for UX
        
        prompt = f"""
Generate {Config.MAX_TEST_CASES} comprehensive test cases for testing AI agents in a LangChain-based system.

Agent Information:
{json.dumps(agents, indent=2)}

Tools:
{json.dumps(tools, indent=2)}

Relationships:
{json.dumps(relationships, indent=2)}

For each test case, create tests that cover these categories with specific METRICS and BENCHMARKS:

1. **Tool Calling Accuracy**: Verify agents call the correct tools with proper parameters
   - Metric: Accuracy percentage (0-100%)
   - Benchmark: Industry standard is 95%+ accuracy

2. **Reasoning Capability**: Test logical reasoning and decision making
   - Metric: Reasoning score (0-100)
   - Benchmark: Score should be 80%+ for production

3. **Collaborative Behavior**: Test agent-to-agent communication
   - Metric: Collaboration efficiency (0-100%)
   - Benchmark: 85%+ for well-designed systems

4. **Connection Testing**: Verify relationship flows and data passing
   - Metric: Connection success rate (0-100%)
   - Benchmark: 90%+ for stable systems

5. **Performance**: Test response time and resource usage
   - Metric: Response time (ms), throughput (requests/sec)
   - Benchmark: <500ms response time

6. **Error Handling**: Test agent behavior with invalid inputs
   - Metric: Recovery rate (0-100%)
   - Benchmark: 95%+ recovery rate

7. **Output Quality**: Evaluate response quality and relevance
   - Metric: Quality score (0-100)
   - Benchmark: 85%+ for production readiness

8. **Security**: Test for potential security vulnerabilities
   - Metric: Security score (0-100), vulnerabilities found
   - Benchmark: 90%+ security score, 0 critical vulnerabilities

Return as JSON array with this EXACT structure:
[{{
    "id": "test_case_1",
    "name": "Descriptive Test Name",
    "category": "tool_calling|reasoning|collaborative|connection|performance|error_handling|output_quality|security",
    "description": "What this test validates and why it matters",
    "target": {{
        "type": "agent|tool|relationship",
        "id": "actual_id_from_data",
        "name": "actual_name"
    }},
    "test_input": "Specific input or scenario",
    "expected_behavior": "Expected outcome",
    "success_criteria": "How to determine pass/fail",
    "highlight_elements": ["element_ids_to_highlight"],
    "metrics": [{{
        "name": "accuracy|reasoning_score|collaboration_efficiency|connection_rate|response_time|recovery_rate|quality_score|security_score",
        "unit": "%|ms|score",
        "benchmark": 95,
        "description": "What this metric measures"
    }}],
    "estimated_duration": 2.5
}}]

Make tests SPECIFIC to the actual agents/tools/relationships in the provided data.
Each test should have clear metrics that can be measured.
"""
        
        try:
            if progress_callback:
                progress_callback("status", {
                    "step": "generating_tests",
                    "message": "🧪 Generating test cases with AI...",
                    "progress": 40
                })
            
            response = self.model.generate_content(prompt)
            text = response.text.strip()
            
            # Extract JSON
            json_match = re.search(r'\[.*\]', text, re.DOTALL)
            if json_match:
                test_cases = json.loads(json_match.group())
                test_cases = test_cases[:Config.MAX_TEST_CASES]
                
                # Emit progress for each generated test
                for i, test_case in enumerate(test_cases, 1):
                    if progress_callback:
                        progress_callback("test_case_generated", {
                            "step": f"test_case_{i}",
                            "message": f"✅ Generated test case {i}/{len(test_cases)}: {test_case.get('name')}",
                            "progress": 40 + (i / len(test_cases) * 50),
                            "test_case": test_case
                        })
                    time.sleep(0.3)  # Small delay for UX
                
                if progress_callback:
                    progress_callback("status", {
                        "step": "tests_ready",
                        "message": f"✨ Generated {len(test_cases)} test cases successfully!",
                        "progress": 100
                    })
                
                return test_cases
            
            return []
            
        except Exception as e:
            if progress_callback:
                progress_callback("error", {
                    "step": "generation_failed",
                    "message": f"❌ Error generating test cases: {str(e)}",
                    "error": str(e)
                })
            print(f"Error generating test cases: {str(e)}")
            return []
    
    def run_test(
        self, 
        test_case: Dict[str, Any], 
        agent_data: Dict[str, Any],
        progress_callback: Callable[[str, Dict], None] = None
    ) -> Dict[str, Any]:
        """
        Run a specific test case with progress updates
        
        Args:
            test_case: Test case to run
            agent_data: Agent configuration data
            progress_callback: Function to call with progress updates
            
        Returns:
            Test result with pass/fail status, metrics, and recommendations
        """
        
        if progress_callback:
            progress_callback("test_started", {
                "test_id": test_case.get('id'),
                "message": f"🧪 Starting test: {test_case.get('name')}",
                "highlight_elements": test_case.get('highlight_elements', [])
            })
        
        # Find target agent/tool
        target = test_case.get('target', {})
        target_type = target.get('type')
        target_id = target.get('id')
        
        if progress_callback:
            progress_callback("status", {
                "message": f"🔍 Analyzing {target_type}: {target.get('name')}..."
            })
        
        time.sleep(0.5)
        
        if target_type == 'agent':
            target_info = self._find_agent(agent_data, target_id)
        elif target_type == 'tool':
            target_info = self._find_tool(agent_data, target_id)
        elif target_type == 'relationship':
            target_info = self._find_relationship(agent_data, target_id)
        else:
            target_info = None
        
        if progress_callback:
            progress_callback("status", {
                "message": f"⚡ Executing test case..."
            })
        
        # Execute test using Gemini to simulate and evaluate
        prompt = f"""
Execute and evaluate the following test case for an AI agent system.

Test Case:
{json.dumps(test_case, indent=2)}

Target Information:
{json.dumps(target_info, indent=2)}

Full Agent System Context:
{json.dumps(agent_data, indent=2)[:4000]}

Simulate running this test thoroughly and provide:

1. **Test Execution**: Simulate what happens when this test runs
2. **Status**: PASSED, FAILED, or WARNING
3. **Metrics**: Calculate actual values for each metric defined in the test case
4. **Issues**: Identify any problems, bugs, or areas of improvement
5. **Recommendations**: Provide actionable fixes with exact code changes

For METRICS, calculate realistic values based on the test category:
- tool_calling: accuracy percentage (0-100%)
- reasoning: reasoning score (0-100)
- collaborative: efficiency percentage (0-100%)
- connection: success rate (0-100%)
- performance: response_time in ms
- error_handling: recovery rate (0-100%)
- output_quality: quality score (0-100)
- security: security score (0-100)

If issues are found, provide specific fixes that include:
- Exact file path
- Line number (estimate based on typical agent structure)
- Current problematic code
- Suggested replacement code
- Clear explanation

Return as JSON:
{{
    "test_id": "{test_case.get('id')}",
    "status": "passed|failed|warning",
    "execution_time": 1.5,
    "results": {{
        "summary": "Concise test result summary",
        "details": "Detailed execution findings",
        "issues_found": ["specific issue 1", "specific issue 2"],
        "logs": [
            "Log line 1: Test initialized",
            "Log line 2: Agent invoked with input",
            "Log line 3: Tool called successfully",
            "Log line 4: Response generated"
        ]
    }},
    "metrics": [{{
        "name": "metric_name_from_test_case",
        "value": 87.5,
        "unit": "%",
        "benchmark": 95,
        "passed": false,
        "description": "What was measured"
    }}],
    "recommendations": [{{
        "severity": "critical|high|medium|low",
        "category": "tool_calling|reasoning|performance|security|other",
        "issue": "Clear issue description",
        "impact": "What happens if not fixed",
        "fix": {{
            "file_path": "path/to/file.py",
            "line_number": 42,
            "current_code": "actual problematic code",
            "suggested_code": "improved code",
            "explanation": "Why this fix helps and how it improves the metric"
        }}
    }}]
}}

Be specific and realistic in your evaluation.
"""
        
        try:
            if progress_callback:
                progress_callback("status", {
                    "message": f"🤖 AI evaluating test results..."
                })
            
            response = self.model.generate_content(prompt)
            text = response.text.strip()
            
            # Extract JSON
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                
                if progress_callback:
                    status_emoji = "✅" if result.get('status') == 'passed' else "❌" if result.get('status') == 'failed' else "⚠️"
                    progress_callback("test_completed", {
                        "test_id": test_case.get('id'),
                        "message": f"{status_emoji} Test {result.get('status').upper()}: {test_case.get('name')}",
                        "result": result
                    })
                
                return result
            
            return {
                'test_id': test_case.get('id'),
                'status': 'error',
                'results': {'summary': 'Failed to parse test result'},
                'metrics': [],
                'recommendations': []
            }
            
        except Exception as e:
            if progress_callback:
                progress_callback("test_error", {
                    "test_id": test_case.get('id'),
                    "message": f"❌ Test error: {str(e)}"
                })
            
            return {
                'test_id': test_case.get('id'),
                'status': 'error',
                'results': {'summary': f'Error running test: {str(e)}'},
                'metrics': [],
                'recommendations': []
            }
    
    def update_test_cases(
        self,
        current_test_cases: List[Dict[str, Any]],
        user_feedback: str,
        agent_data: Dict[str, Any],
        progress_callback: Callable[[str, Dict], None] = None
    ) -> List[Dict[str, Any]]:
        """
        Update test cases based on user feedback
        
        Args:
            current_test_cases: Current list of test cases
            user_feedback: User's modification request
            agent_data: Agent configuration data
            progress_callback: Function to call with progress updates
            
        Returns:
            Updated list of test cases
        """
        if progress_callback:
            progress_callback("status", {
                "message": "🔄 Processing your feedback..."
            })
        
        prompt = f"""
You are updating a test suite based on user feedback.

Current Test Cases:
{json.dumps(current_test_cases, indent=2)}

User Feedback:
{user_feedback}

Available Agents/Tools/Relationships:
{json.dumps(agent_data, indent=2)[:3000]}

Based on the user's feedback, modify the test cases accordingly. You can:
- Add new test cases
- Remove test cases
- Modify existing test cases
- Adjust metrics and benchmarks
- Change test priorities

Return the COMPLETE updated test suite as JSON array with the same structure:
[{{
    "id": "test_case_id",
    "name": "Test Name",
    "category": "tool_calling|reasoning|collaborative|connection|performance|error_handling|output_quality|security",
    "description": "Description",
    "target": {{"type": "agent|tool|relationship", "id": "id", "name": "name"}},
    "test_input": "input",
    "expected_behavior": "behavior",
    "success_criteria": "criteria",
    "highlight_elements": ["ids"],
    "metrics": [{{"name": "metric", "unit": "unit", "benchmark": 95, "description": "desc"}}],
    "estimated_duration": 2.5
}}]
"""
        
        try:
            if progress_callback:
                progress_callback("status", {
                    "message": "🤖 AI updating test cases..."
                })
            
            response = self.model.generate_content(prompt)
            text = response.text.strip()
            
            json_match = re.search(r'\[.*\]', text, re.DOTALL)
            if json_match:
                updated_cases = json.loads(json_match.group())
                
                if progress_callback:
                    progress_callback("status", {
                        "message": f"✨ Updated test suite with {len(updated_cases)} test cases"
                    })
                
                return updated_cases
            
            return current_test_cases
            
        except Exception as e:
            if progress_callback:
                progress_callback("error", {
                    "message": f"❌ Error updating tests: {str(e)}"
                })
            return current_test_cases
    
    def _find_agent(self, agent_data: Dict[str, Any], agent_id: str) -> Dict[str, Any]:
        """Find agent by ID"""
        for agent in agent_data.get('agents', []):
            if agent.get('id') == agent_id:
                return agent
        return {}
    
    def _find_tool(self, agent_data: Dict[str, Any], tool_id: str) -> Dict[str, Any]:
        """Find tool by ID"""
        for tool in agent_data.get('tools', []):
            if tool.get('id') == tool_id:
                return tool
        return {}
    
    def _find_relationship(self, agent_data: Dict[str, Any], rel_id: str) -> Dict[str, Any]:
        """Find relationship by ID"""
        for rel in agent_data.get('relationships', []):
            if rel.get('id') == rel_id:
                return rel
        return {}
    
    def generate_test_report(
        self,
        test_results: List[Dict[str, Any]],
        agent_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate comprehensive test report with graphs and benchmarks
        
        Args:
            test_results: List of test results
            agent_data: Agent configuration data
            
        Returns:
            Report with statistics, graphs data, and recommendations
        """
        total_tests = len(test_results)
        passed = sum(1 for r in test_results if r.get('status') == 'passed')
        failed = sum(1 for r in test_results if r.get('status') == 'failed')
        warnings = sum(1 for r in test_results if r.get('status') == 'warning')
        errors = sum(1 for r in test_results if r.get('status') == 'error')
        
        # Calculate aggregate metrics by category
        category_scores = {}
        for result in test_results:
            # Find the original test case to get category
            test_id = result.get('test_id')
            metrics = result.get('metrics', [])
            
            for metric in metrics:
                category = metric.get('name', 'unknown')
                if category not in category_scores:
                    category_scores[category] = []
                category_scores[category].append(metric.get('value', 0))
        
        # Calculate averages
        category_averages = {
            cat: sum(scores) / len(scores) if scores else 0
            for cat, scores in category_scores.items()
        }
        
        # Per-agent performance
        agent_performance = {}
        for agent in agent_data.get('agents', []):
            agent_id = agent.get('id')
            agent_tests = [r for r in test_results if r.get('test_id', '').startswith(agent_id) or
                          any(h == agent_id for h in r.get('highlight_elements', []))]
            
            if agent_tests:
                agent_metrics = []
                for test in agent_tests:
                    agent_metrics.extend(test.get('metrics', []))
                
                avg_score = sum(m.get('value', 0) for m in agent_metrics) / len(agent_metrics) if agent_metrics else 0
                
                agent_performance[agent_id] = {
                    'name': agent.get('name'),
                    'tests_run': len(agent_tests),
                    'passed': sum(1 for t in agent_tests if t.get('status') == 'passed'),
                    'failed': sum(1 for t in agent_tests if t.get('status') == 'failed'),
                    'average_score': round(avg_score, 2),
                    'metrics': agent_metrics
                }
        
        # Collect all recommendations
        all_recommendations = []
        critical_issues = []
        for result in test_results:
            for rec in result.get('recommendations', []):
                all_recommendations.append({
                    **rec,
                    'test_id': result.get('test_id'),
                    'test_name': result.get('test_name', 'Unknown Test')
                })
                if rec.get('severity') == 'critical':
                    critical_issues.append(rec)
        
        return {
            'summary': {
                'total_tests': total_tests,
                'passed': passed,
                'failed': failed,
                'warnings': warnings,
                'errors': errors,
                'success_rate': round((passed / total_tests * 100) if total_tests > 0 else 0, 2)
            },
            'category_performance': [
                {
                    'category': cat,
                    'average_score': round(score, 2),
                    'benchmark': 85,  # Default benchmark
                    'passed': score >= 85
                }
                for cat, score in category_averages.items()
            ],
            'agent_performance': list(agent_performance.values()),
            'recommendations': all_recommendations,
            'critical_issues': critical_issues,
            'charts_data': {
                'test_distribution': {
                    'labels': ['Passed', 'Failed', 'Warning', 'Error'],
                    'values': [passed, failed, warnings, errors],
                    'colors': ['#10b981', '#ef4444', '#f59e0b', '#6b7280']
                },
                'category_scores': {
                    'labels': list(category_averages.keys()),
                    'values': [round(v, 2) for v in category_averages.values()],
                    'benchmarks': [85] * len(category_averages)
                },
                'agent_comparison': {
                    'labels': [p['name'] for p in agent_performance.values()],
                    'values': [p['average_score'] for p in agent_performance.values()]
                }
            }
        }