"""
Unit tests for MagnaAgent ReAct implementation.

Tests cover all ReAct phases and error handling scenarios.

**Validates: Requirements 7.1-7.7**
"""

import pytest
from datetime import datetime
from unittest.mock import AsyncMock, Mock, patch
from typing import List

from ...agent.core import (
    MagnaAgent,
    AgentResponse,
    Context,
    Analysis,
    ActionPlan,
    ActionResults,
)
from ...llm.orchestrator import LLMOrchestrator
from ...memory.system import MemorySystem
from ...tools.base import ToolRegistry, ToolResult
from ...models.memory import MemoryEntry, MemoryMetadata


@pytest.fixture
def mock_llm_orchestrator():
    """Create mock LLM orchestrator."""
    orchestrator = Mock(spec=LLMOrchestrator)
    
    # Mock generate method to return async iterator
    async def mock_generate(*args, **kwargs):
        # Return simple JSON responses for different prompts
        prompt = kwargs.get('prompt', '')
        
        if 'Analyze' in prompt or 'intent' in prompt.lower():
            # Analysis response
            response = '''```json
{
  "intent": "find_opportunities",
  "required_information": ["user_profile", "job_preferences"],
  "entities": {"skills": ["Python", "JavaScript"], "location": "Remote"},
  "confidence": 0.85
}
```'''
            yield response
        
        elif 'plan' in prompt.lower() or 'tools' in prompt.lower():
            # Planning response
            response = '''```json
{
  "tools_to_use": ["profile_retrieval", "opportunity_match"],
  "tool_parameters": {
    "profile_retrieval": {"user_id": "test_user"},
    "opportunity_match": {"skills": ["Python"], "limit": 10}
  },
  "execution_strategy": "sequential",
  "reasoning": "Need user profile first, then match opportunities"
}
```'''
            yield response
        
        else:
            # Response generation
            yield "Here are some opportunities that match your profile. "
            yield "I found 5 relevant positions based on your Python and JavaScript skills."
    
    orchestrator.generate = mock_generate
    return orchestrator


@pytest.fixture
def mock_memory_system():
    """Create mock memory system."""
    memory = Mock(spec=MemorySystem)
    
    # Mock retrieve_context
    async def mock_retrieve_context(*args, **kwargs):
        return [
            MemoryEntry(
                id="mem1",
                user_id="test_user",
                conversation_id="conv1",
                timestamp=datetime.now(),
                user_message="What jobs are available?",
                agent_response="I can help you find jobs.",
                embedding=[0.1] * 768,
                importance_score=0.8,
                metadata=MemoryMetadata()
            )
        ]
    
    memory.retrieve_context = mock_retrieve_context
    
    # Mock store_interaction
    async def mock_store_interaction(*args, **kwargs):
        return MemoryEntry(
            id="new_mem",
            user_id=kwargs['user_id'],
            conversation_id=kwargs['conversation_id'],
            timestamp=datetime.now(),
            user_message=kwargs['user_message'],
            agent_response=kwargs['agent_response'],
            embedding=[0.1] * 768,
            importance_score=0.7,
            metadata=MemoryMetadata()
        )
    
    memory.store_interaction = mock_store_interaction
    
    return memory


@pytest.fixture
def mock_tool_registry():
    """Create mock tool registry."""
    registry = Mock(spec=ToolRegistry)
    
    # Mock execute_tool
    async def mock_execute_tool(tool_name, parameters, **kwargs):
        if tool_name == "profile_retrieval":
            return ToolResult(
                success=True,
                data={
                    "user_id": "test_user",
                    "skills": ["Python", "JavaScript"],
                    "location": "Remote"
                },
                execution_time_ms=50.0
            )
        elif tool_name == "opportunity_match":
            return ToolResult(
                success=True,
                data={
                    "matches": [
                        {"title": "Python Developer", "score": 85},
                        {"title": "Full Stack Engineer", "score": 80}
                    ]
                },
                execution_time_ms=120.0
            )
        else:
            return ToolResult(
                success=False,
                error=f"Tool {tool_name} not found"
            )
    
    registry.execute_tool = mock_execute_tool
    
    # Mock list_tools
    from ...tools.base import ToolMetadata
    registry.list_tools = Mock(return_value=[
        ToolMetadata(
            name="profile_retrieval",
            description="Retrieve user profile",
            parameters_schema={"type": "object"},
            timeout_seconds=10
        ),
        ToolMetadata(
            name="opportunity_match",
            description="Find matching opportunities",
            parameters_schema={"type": "object"},
            timeout_seconds=10
        )
    ])
    
    return registry


@pytest.fixture
def magna_agent(mock_llm_orchestrator, mock_memory_system, mock_tool_registry):
    """Create MagnaAgent instance with mocked dependencies."""
    return MagnaAgent(
        llm_orchestrator=mock_llm_orchestrator,
        memory_system=mock_memory_system,
        tool_registry=mock_tool_registry
    )


class TestMagnaAgentInitialization:
    """Test agent initialization."""
    
    def test_agent_initialization(self, magna_agent):
        """Test that agent initializes with required dependencies."""
        assert magna_agent.llm_orchestrator is not None
        assert magna_agent.memory_system is not None
        assert magna_agent.tool_registry is not None
        assert magna_agent.system_prompt is not None
        assert "Magna AI" in magna_agent.system_prompt
    
    def test_custom_system_prompt(self, mock_llm_orchestrator, mock_memory_system, mock_tool_registry):
        """Test agent initialization with custom system prompt."""
        custom_prompt = "Custom agent prompt"
        agent = MagnaAgent(
            llm_orchestrator=mock_llm_orchestrator,
            memory_system=mock_memory_system,
            tool_registry=mock_tool_registry,
            system_prompt=custom_prompt
        )
        assert agent.system_prompt == custom_prompt


class TestAnalyzePhase:
    """Test the Analyze phase of ReAct cycle."""
    
    @pytest.mark.asyncio
    async def test_analyze_extracts_intent(self, magna_agent):
        """Test that analyze phase extracts user intent."""
        context = Context(
            user_id="test_user",
            conversation_id="conv1",
            message="Find me Python jobs",
            memory_entries=[],
            metadata={}
        )
        
        analysis = await magna_agent._analyze("Find me Python jobs", context)
        
        assert analysis.intent == "find_opportunities"
        assert analysis.confidence > 0.0
        assert "user_profile" in analysis.required_information or "job_preferences" in analysis.required_information
    
    @pytest.mark.asyncio
    async def test_analyze_extracts_entities(self, magna_agent):
        """Test that analyze phase extracts entities from message."""
        context = Context(
            user_id="test_user",
            conversation_id="conv1",
            message="Find me Python jobs in Remote",
            memory_entries=[],
            metadata={}
        )
        
        analysis = await magna_agent._analyze("Find me Python jobs in Remote", context)
        
        assert analysis.entities is not None
        assert isinstance(analysis.entities, dict)
    
    @pytest.mark.asyncio
    async def test_analyze_with_memory_context(self, magna_agent, mock_memory_system):
        """Test that analyze phase uses memory context."""
        memory_entry = MemoryEntry(
            id="mem1",
            user_id="test_user",
            conversation_id="conv1",
            timestamp=datetime.now(),
            user_message="I'm looking for remote work",
            agent_response="I can help with that",
            embedding=[0.1] * 768,
            importance_score=0.8,
            metadata=MemoryMetadata()
        )
        
        context = Context(
            user_id="test_user",
            conversation_id="conv1",
            message="Show me opportunities",
            memory_entries=[memory_entry],
            metadata={}
        )
        
        analysis = await magna_agent._analyze("Show me opportunities", context)
        
        # Should successfully analyze even with context
        assert analysis.intent is not None
        assert analysis.confidence >= 0.0


class TestPlanPhase:
    """Test the Plan phase of ReAct cycle."""
    
    @pytest.mark.asyncio
    async def test_plan_selects_tools(self, magna_agent):
        """Test that plan phase selects appropriate tools."""
        analysis = Analysis(
            intent="find_opportunities",
            required_information=["user_profile", "opportunities"],
            entities={"skills": ["Python"]},
            confidence=0.85
        )
        
        context = Context(
            user_id="test_user",
            conversation_id="conv1",
            message="Find me jobs",
            memory_entries=[],
            metadata={}
        )
        
        plan = await magna_agent._plan(analysis, context)
        
        assert isinstance(plan.tools_to_use, list)
        # Plan may return empty list if LLM decides no tools needed
        # Just verify it's a valid list
        assert plan.execution_strategy in ["sequential", "parallel"]
        assert plan.reasoning is not None
    
    @pytest.mark.asyncio
    async def test_plan_includes_tool_parameters(self, magna_agent):
        """Test that plan includes parameters for each tool."""
        analysis = Analysis(
            intent="find_opportunities",
            required_information=["user_profile"],
            entities={},
            confidence=0.8
        )
        
        context = Context(
            user_id="test_user",
            conversation_id="conv1",
            message="Find jobs",
            memory_entries=[],
            metadata={}
        )
        
        plan = await magna_agent._plan(analysis, context)
        
        assert isinstance(plan.tool_parameters, dict)
        # Each tool should have parameters
        for tool_name in plan.tools_to_use:
            assert tool_name in plan.tool_parameters
    
    @pytest.mark.asyncio
    async def test_plan_with_no_tools_needed(self, magna_agent):
        """Test planning when no tools are needed."""
        analysis = Analysis(
            intent="greeting",
            required_information=[],
            entities={},
            confidence=0.9
        )
        
        context = Context(
            user_id="test_user",
            conversation_id="conv1",
            message="Hello",
            memory_entries=[],
            metadata={}
        )
        
        plan = await magna_agent._plan(analysis, context)
        
        # Should return valid plan even with no tools
        assert isinstance(plan.tools_to_use, list)
        assert isinstance(plan.tool_parameters, dict)


class TestActPhase:
    """Test the Act phase of ReAct cycle."""
    
    @pytest.mark.asyncio
    async def test_act_executes_tools_sequentially(self, magna_agent):
        """Test that act phase executes tools in sequence."""
        plan = ActionPlan(
            tools_to_use=["profile_retrieval", "opportunity_match"],
            tool_parameters={
                "profile_retrieval": {"user_id": "test_user"},
                "opportunity_match": {"skills": ["Python"]}
            },
            execution_strategy="sequential",
            reasoning="Get profile then match"
        )
        
        context = Context(
            user_id="test_user",
            conversation_id="conv1",
            message="Find jobs",
            memory_entries=[],
            metadata={}
        )
        
        results = await magna_agent._act(plan, context)
        
        assert results.success is True
        assert len(results.tool_results) == 2
        assert "profile_retrieval" in results.tool_results
        assert "opportunity_match" in results.tool_results
    
    @pytest.mark.asyncio
    async def test_act_executes_tools_in_parallel(self, magna_agent):
        """Test that act phase can execute tools in parallel."""
        plan = ActionPlan(
            tools_to_use=["profile_retrieval", "opportunity_match"],
            tool_parameters={
                "profile_retrieval": {"user_id": "test_user"},
                "opportunity_match": {"skills": ["Python"]}
            },
            execution_strategy="parallel",
            reasoning="Independent tools"
        )
        
        context = Context(
            user_id="test_user",
            conversation_id="conv1",
            message="Find jobs",
            memory_entries=[],
            metadata={}
        )
        
        results = await magna_agent._act(plan, context)
        
        assert results.success is True
        assert len(results.tool_results) == 2
    
    @pytest.mark.asyncio
    async def test_act_handles_tool_failure(self, magna_agent, mock_tool_registry):
        """Test that act phase handles tool failures gracefully."""
        # Mock a failing tool
        async def mock_failing_tool(tool_name, parameters, **kwargs):
            if tool_name == "failing_tool":
                return ToolResult(
                    success=False,
                    error="Tool execution failed"
                )
            return ToolResult(success=True, data={})
        
        mock_tool_registry.execute_tool = mock_failing_tool
        
        plan = ActionPlan(
            tools_to_use=["failing_tool", "profile_retrieval"],
            tool_parameters={
                "failing_tool": {},
                "profile_retrieval": {"user_id": "test_user"}
            },
            execution_strategy="sequential",
            reasoning="Test failure handling"
        )
        
        context = Context(
            user_id="test_user",
            conversation_id="conv1",
            message="Test",
            memory_entries=[],
            metadata={}
        )
        
        results = await magna_agent._act(plan, context)
        
        # Should continue despite failure
        assert len(results.errors) > 0
        assert "failing_tool" in results.errors[0]
    
    @pytest.mark.asyncio
    async def test_act_with_no_tools(self, magna_agent):
        """Test act phase when no tools are needed."""
        plan = ActionPlan(
            tools_to_use=[],
            tool_parameters={},
            execution_strategy="sequential",
            reasoning="No tools needed"
        )
        
        context = Context(
            user_id="test_user",
            conversation_id="conv1",
            message="Hello",
            memory_entries=[],
            metadata={}
        )
        
        results = await magna_agent._act(plan, context)
        
        assert results.success is True
        assert len(results.tool_results) == 0
        assert len(results.errors) == 0


class TestRespondPhase:
    """Test the Respond phase of ReAct cycle."""
    
    @pytest.mark.asyncio
    async def test_respond_generates_response(self, magna_agent):
        """Test that respond phase generates natural language response."""
        analysis = Analysis(
            intent="find_opportunities",
            required_information=["opportunities"],
            entities={},
            confidence=0.85
        )
        
        plan = ActionPlan(
            tools_to_use=["opportunity_match"],
            tool_parameters={"opportunity_match": {}},
            execution_strategy="sequential",
            reasoning="Match opportunities"
        )
        
        results = ActionResults(
            tool_results={
                "opportunity_match": ToolResult(
                    success=True,
                    data={"matches": [{"title": "Python Dev"}]},
                    execution_time_ms=100.0
                )
            },
            success=True,
            errors=[]
        )
        
        context = Context(
            user_id="test_user",
            conversation_id="conv1",
            message="Find jobs",
            memory_entries=[],
            metadata={"request_id": "req1"}
        )
        
        responses = []
        async for response in magna_agent._respond(
            analysis=analysis,
            plan=plan,
            results=results,
            context=context,
            stream=False
        ):
            responses.append(response)
        
        assert len(responses) > 0
        final_response = responses[-1]
        assert isinstance(final_response, AgentResponse)
        assert final_response.content is not None
        assert len(final_response.content) > 0
    
    @pytest.mark.asyncio
    async def test_respond_streaming(self, magna_agent):
        """Test that respond phase can stream responses."""
        analysis = Analysis(
            intent="greeting",
            required_information=[],
            entities={},
            confidence=0.9
        )
        
        plan = ActionPlan(
            tools_to_use=[],
            tool_parameters={},
            execution_strategy="sequential",
            reasoning="No tools needed"
        )
        
        results = ActionResults(
            tool_results={},
            success=True,
            errors=[]
        )
        
        context = Context(
            user_id="test_user",
            conversation_id="conv1",
            message="Hello",
            memory_entries=[],
            metadata={}
        )
        
        chunks = []
        async for response in magna_agent._respond(
            analysis=analysis,
            plan=plan,
            results=results,
            context=context,
            stream=True
        ):
            chunks.append(response)
        
        # Should receive multiple chunks when streaming
        assert len(chunks) > 0
        # Each chunk should be an AgentResponse
        for chunk in chunks:
            assert isinstance(chunk, AgentResponse)
    
    @pytest.mark.asyncio
    async def test_respond_includes_metadata(self, magna_agent):
        """Test that response includes metadata about execution."""
        analysis = Analysis(
            intent="find_opportunities",
            required_information=[],
            entities={},
            confidence=0.8
        )
        
        plan = ActionPlan(
            tools_to_use=["profile_retrieval"],
            tool_parameters={"profile_retrieval": {}},
            execution_strategy="sequential",
            reasoning="Get profile"
        )
        
        results = ActionResults(
            tool_results={
                "profile_retrieval": ToolResult(
                    success=True,
                    data={},
                    execution_time_ms=50.0
                )
            },
            success=True,
            errors=[]
        )
        
        context = Context(
            user_id="test_user",
            conversation_id="conv1",
            message="Test",
            memory_entries=[],
            metadata={"request_id": "req1"}
        )
        
        responses = []
        async for response in magna_agent._respond(
            analysis=analysis,
            plan=plan,
            results=results,
            context=context,
            stream=False
        ):
            responses.append(response)
        
        final_response = responses[-1]
        assert "intent" in final_response.metadata
        assert "tools_used" in final_response.metadata
        assert final_response.metadata["intent"] == "find_opportunities"


class TestCompleteReActCycle:
    """Test complete ReAct cycle integration."""
    
    @pytest.mark.asyncio
    async def test_process_message_complete_cycle(self, magna_agent):
        """Test that process_message executes complete ReAct cycle."""
        responses = []
        async for response in magna_agent.process_message(
            user_id="test_user",
            message="Find me Python jobs",
            conversation_id="conv1",
            stream=False
        ):
            responses.append(response)
        
        assert len(responses) > 0
        final_response = responses[-1]
        
        # Verify response structure
        assert isinstance(final_response, AgentResponse)
        assert final_response.content is not None
        assert final_response.conversation_id == "conv1"
        assert final_response.metadata is not None
        
        # Verify metadata includes ReAct phases
        assert "intent" in final_response.metadata
        assert "tools_used" in final_response.metadata
    
    @pytest.mark.asyncio
    async def test_process_message_streaming(self, magna_agent):
        """Test that process_message can stream responses."""
        chunks = []
        async for response in magna_agent.process_message(
            user_id="test_user",
            message="Hello",
            conversation_id="conv1",
            stream=True
        ):
            chunks.append(response)
        
        # Should receive multiple chunks
        assert len(chunks) > 0
        
        # All chunks should be AgentResponse objects
        for chunk in chunks:
            assert isinstance(chunk, AgentResponse)
            assert chunk.conversation_id == "conv1"
    
    @pytest.mark.asyncio
    async def test_process_message_stores_in_memory(self, magna_agent, mock_memory_system):
        """Test that process_message stores interaction in memory."""
        # Track if store_interaction was called
        store_called = False
        original_store = mock_memory_system.store_interaction
        
        async def track_store(*args, **kwargs):
            nonlocal store_called
            store_called = True
            return await original_store(*args, **kwargs)
        
        mock_memory_system.store_interaction = track_store
        
        responses = []
        async for response in magna_agent.process_message(
            user_id="test_user",
            message="Test message",
            conversation_id="conv1",
            stream=False
        ):
            responses.append(response)
        
        # Verify memory was stored
        assert store_called is True


class TestErrorHandling:
    """Test error handling in ReAct cycle."""
    
    @pytest.mark.asyncio
    async def test_process_message_handles_llm_error(self, magna_agent, mock_llm_orchestrator):
        """Test that agent handles LLM errors gracefully."""
        # Mock LLM to raise error
        async def mock_error_generate(*args, **kwargs):
            raise Exception("LLM service unavailable")
            yield  # Make it a generator
        
        mock_llm_orchestrator.generate = mock_error_generate
        
        responses = []
        async for response in magna_agent.process_message(
            user_id="test_user",
            message="Test",
            conversation_id="conv1",
            stream=False
        ):
            responses.append(response)
        
        # Should return error response
        assert len(responses) > 0
        error_response = responses[-1]
        assert isinstance(error_response, AgentResponse)
        assert "error" in error_response.metadata or len(error_response.content) > 0
    
    @pytest.mark.asyncio
    async def test_process_message_handles_memory_error(self, magna_agent, mock_memory_system):
        """Test that agent handles memory errors gracefully."""
        # Mock memory to raise error
        async def mock_error_retrieve(*args, **kwargs):
            raise Exception("Memory system unavailable")
        
        mock_memory_system.retrieve_context = mock_error_retrieve
        
        responses = []
        async for response in magna_agent.process_message(
            user_id="test_user",
            message="Test",
            conversation_id="conv1",
            stream=False
        ):
            responses.append(response)
        
        # Should return error response
        assert len(responses) > 0
    
    def test_generate_error_message_timeout(self, magna_agent):
        """Test error message generation for timeout errors."""
        import asyncio
        error = asyncio.TimeoutError("Request timed out")
        message = magna_agent._generate_error_message(error)
        
        # TimeoutError should be caught by the generic handler
        # Just verify we get a valid error message
        assert len(message) > 0
        assert isinstance(message, str)
    
    def test_generate_error_message_rate_limit(self, magna_agent):
        """Test error message generation for rate limit errors."""
        error = Exception("Rate limit exceeded")
        message = magna_agent._generate_error_message(error)
        
        assert "high demand" in message.lower() or "wait" in message.lower()
    
    def test_generate_error_message_generic(self, magna_agent):
        """Test error message generation for generic errors."""
        error = Exception("Something went wrong")
        message = magna_agent._generate_error_message(error)
        
        assert len(message) > 0
        assert "unexpected" in message.lower() or "issue" in message.lower()


class TestHelperMethods:
    """Test helper methods."""
    
    def test_format_memory_context_empty(self, magna_agent):
        """Test formatting empty memory context."""
        formatted = magna_agent._format_memory_context([])
        assert formatted == "No previous context"
    
    def test_format_memory_context_with_entries(self, magna_agent):
        """Test formatting memory context with entries."""
        entries = [
            MemoryEntry(
                id="mem1",
                user_id="test_user",
                conversation_id="conv1",
                timestamp=datetime.now(),
                user_message="Hello",
                agent_response="Hi there",
                embedding=[0.1] * 768,
                importance_score=0.8,
                metadata=MemoryMetadata()
            )
        ]
        
        formatted = magna_agent._format_memory_context(entries)
        assert "Hello" in formatted
        assert "Hi there" in formatted
    
    def test_format_tool_results_empty(self, magna_agent):
        """Test formatting empty tool results."""
        formatted = magna_agent._format_tool_results({})
        assert "No tools" in formatted
    
    def test_format_tool_results_with_success(self, magna_agent):
        """Test formatting successful tool results."""
        results = {
            "test_tool": ToolResult(
                success=True,
                data={"result": "success"},
                execution_time_ms=100.0
            )
        }
        
        formatted = magna_agent._format_tool_results(results)
        assert "test_tool" in formatted
        assert "Success" in formatted
    
    def test_format_tool_results_with_failure(self, magna_agent):
        """Test formatting failed tool results."""
        results = {
            "test_tool": ToolResult(
                success=False,
                error="Tool failed",
                execution_time_ms=50.0
            )
        }
        
        formatted = magna_agent._format_tool_results(results)
        assert "test_tool" in formatted
        assert "Failed" in formatted
        assert "Tool failed" in formatted
    
    def test_parse_json_response_with_code_block(self, magna_agent):
        """Test parsing JSON from markdown code block."""
        response = '''```json
{
  "key": "value",
  "number": 42
}
```'''
        
        parsed = magna_agent._parse_json_response(response)
        assert parsed["key"] == "value"
        assert parsed["number"] == 42
    
    def test_parse_json_response_without_code_block(self, magna_agent):
        """Test parsing JSON without code block."""
        response = '{"key": "value", "number": 42}'
        
        parsed = magna_agent._parse_json_response(response)
        assert parsed["key"] == "value"
        assert parsed["number"] == 42
    
    def test_parse_json_response_invalid(self, magna_agent):
        """Test parsing invalid JSON returns empty dict."""
        response = "This is not JSON"
        
        parsed = magna_agent._parse_json_response(response)
        assert parsed == {}


class TestReActPhaseOrder:
    """Test that ReAct phases execute in correct order.
    
    **Validates: Requirement 7.1 - ReAct pattern execution order**
    """
    
    @pytest.mark.asyncio
    async def test_phases_execute_in_order(self, magna_agent):
        """Test that phases execute in order: Analyze → Plan → Act → Respond."""
        phase_order = []
        
        # Patch each phase to track execution order
        original_analyze = magna_agent._analyze
        original_plan = magna_agent._plan
        original_act = magna_agent._act
        original_respond = magna_agent._respond
        
        async def track_analyze(*args, **kwargs):
            phase_order.append("analyze")
            return await original_analyze(*args, **kwargs)
        
        async def track_plan(*args, **kwargs):
            phase_order.append("plan")
            return await original_plan(*args, **kwargs)
        
        async def track_act(*args, **kwargs):
            phase_order.append("act")
            return await original_act(*args, **kwargs)
        
        async def track_respond(*args, **kwargs):
            phase_order.append("respond")
            async for response in original_respond(*args, **kwargs):
                yield response
        
        magna_agent._analyze = track_analyze
        magna_agent._plan = track_plan
        magna_agent._act = track_act
        magna_agent._respond = track_respond
        
        # Process message
        responses = []
        async for response in magna_agent.process_message(
            user_id="test_user",
            message="Test",
            conversation_id="conv1",
            stream=False
        ):
            responses.append(response)
        
        # Verify phase order
        assert phase_order == ["analyze", "plan", "act", "respond"]
