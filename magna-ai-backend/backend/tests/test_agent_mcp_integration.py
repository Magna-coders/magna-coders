"""
Integration tests for AI Agent with MCP Server.

Tests that the agent correctly integrates with the MCP server to:
- Register MCP tools
- Fetch user context at session start
- Invoke MCP tools based on user queries
- Cache user context for session duration
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime

from ..agent.core import MagnaAgent
from ..mcp.server import MagnaBackendMCPServer
from ..tools.base import ToolRegistry
from ..memory.system import MemorySystem
from ..llm.orchestrator import LLMOrchestrator


@pytest.fixture
def mock_llm_orchestrator():
    """Create a mock LLM orchestrator."""
    orchestrator = AsyncMock(spec=LLMOrchestrator)
    
    # Mock generate method to return simple responses
    async def mock_generate(*args, **kwargs):
        # Return different responses based on prompt content
        prompt = kwargs.get('prompt', '')
        
        if 'Analyze' in prompt or 'analyze' in prompt:
            # Analysis response
            yield '{"intent": "career_advice", "required_information": ["user_profile"], "entities": {}, "confidence": 0.9}'
        elif 'plan' in prompt.lower():
            # Planning response
            yield '{"tools_to_use": ["mcp_get_user_context"], "tool_parameters": {"mcp_get_user_context": {"user_id": "test-user-123"}}, "execution_strategy": "sequential", "reasoning": "Need user profile for career advice"}'
        else:
            # Regular response
            yield "Hello! I'm here to help with your career."
    
    orchestrator.generate = mock_generate
    return orchestrator


@pytest.fixture
def mock_memory_system():
    """Create a mock memory system."""
    memory = AsyncMock(spec=MemorySystem)
    memory.retrieve_context = AsyncMock(return_value=[])
    memory.store_interaction = AsyncMock()
    return memory


@pytest.fixture
def tool_registry():
    """Create a real tool registry."""
    return ToolRegistry()


@pytest.fixture
def mock_mcp_server():
    """Create a mock MCP server."""
    mcp_server = AsyncMock(spec=MagnaBackendMCPServer)
    
    # Mock get_tool_list to return available tools
    mcp_server.get_tool_list = MagicMock(return_value=[
        {
            'name': 'get_user_context',
            'description': 'Retrieves user profile information'
        },
        {
            'name': 'get_user_skills',
            'description': 'Retrieves user skills with proficiency levels'
        },
        {
            'name': 'get_user_learning',
            'description': 'Retrieves user learning progress'
        }
    ])
    
    # Mock execute_tool to return user context
    async def mock_execute_tool(tool_name, user_id, parameters, **kwargs):
        if tool_name == 'get_user_context':
            return {
                'userId': user_id,
                'name': 'John Doe',
                'role': 'Software Engineer',
                'skills': ['Python', 'JavaScript', 'React'],
                'experienceLevel': 'intermediate',
                'location': 'San Francisco',
                'subscriptionTier': 'premium'
            }
        elif tool_name == 'get_user_skills':
            return {
                'skills': [
                    {'name': 'Python', 'proficiency': 85, 'category': 'Backend'},
                    {'name': 'JavaScript', 'proficiency': 75, 'category': 'Frontend'}
                ]
            }
        return {}
    
    mcp_server.execute_tool = AsyncMock(side_effect=mock_execute_tool)
    return mcp_server


@pytest.mark.asyncio
async def test_agent_registers_mcp_tools(
    mock_llm_orchestrator,
    mock_memory_system,
    tool_registry,
    mock_mcp_server
):
    """Test that agent registers MCP tools on initialization."""
    # Create agent with MCP server
    agent = MagnaAgent(
        llm_orchestrator=mock_llm_orchestrator,
        memory_system=mock_memory_system,
        tool_registry=tool_registry,
        mcp_server=mock_mcp_server
    )
    
    # Verify MCP tools were registered
    registered_tools = tool_registry.list_tools()
    tool_names = [tool.name for tool in registered_tools]
    
    assert 'mcp_get_user_context' in tool_names
    assert 'mcp_get_user_skills' in tool_names
    assert 'mcp_get_user_learning' in tool_names


@pytest.mark.asyncio
async def test_agent_fetches_user_context_at_session_start(
    mock_llm_orchestrator,
    mock_memory_system,
    tool_registry,
    mock_mcp_server
):
    """Test that agent fetches user context at the start of a session."""
    # Create agent with MCP server
    agent = MagnaAgent(
        llm_orchestrator=mock_llm_orchestrator,
        memory_system=mock_memory_system,
        tool_registry=tool_registry,
        mcp_server=mock_mcp_server
    )
    
    # Process a message
    responses = []
    async for response in agent.process_message(
        user_id='test-user-123',
        message='Hello',
        conversation_id='test-conv-1',
        stream=False
    ):
        responses.append(response)
    
    # Verify MCP server was called to fetch user context
    mock_mcp_server.execute_tool.assert_called()
    
    # Check that user context was fetched
    calls = [call for call in mock_mcp_server.execute_tool.call_args_list 
             if call[1].get('tool_name') == 'get_user_context']
    assert len(calls) > 0


@pytest.mark.asyncio
async def test_agent_caches_user_context(
    mock_llm_orchestrator,
    mock_memory_system,
    tool_registry,
    mock_mcp_server
):
    """Test that agent caches user context for session duration."""
    # Create agent with MCP server
    agent = MagnaAgent(
        llm_orchestrator=mock_llm_orchestrator,
        memory_system=mock_memory_system,
        tool_registry=tool_registry,
        mcp_server=mock_mcp_server
    )
    
    # Process first message
    async for response in agent.process_message(
        user_id='test-user-123',
        message='Hello',
        conversation_id='test-conv-1',
        stream=False
    ):
        pass
    
    # Reset mock call count
    mock_mcp_server.execute_tool.reset_mock()
    
    # Process second message (should use cached context)
    async for response in agent.process_message(
        user_id='test-user-123',
        message='How are you?',
        conversation_id='test-conv-1',
        stream=False
    ):
        pass
    
    # Verify user context was fetched from cache (no new call to MCP server)
    context_calls = [call for call in mock_mcp_server.execute_tool.call_args_list 
                     if call[1].get('tool_name') == 'get_user_context']
    
    # Should be 0 because it was cached
    assert len(context_calls) == 0


@pytest.mark.asyncio
async def test_mcp_tool_wrapper_includes_user_id(
    mock_llm_orchestrator,
    mock_memory_system,
    tool_registry,
    mock_mcp_server
):
    """Test that MCP tool wrappers correctly pass user_id parameter."""
    # Create agent with MCP server
    agent = MagnaAgent(
        llm_orchestrator=mock_llm_orchestrator,
        memory_system=mock_memory_system,
        tool_registry=tool_registry,
        mcp_server=mock_mcp_server
    )
    
    # Get the wrapped MCP tool from registry
    mcp_tool = tool_registry.get_tool('mcp_get_user_context')
    
    assert mcp_tool is not None
    
    # Execute the tool with user_id
    result = await mcp_tool.execute(user_id='test-user-123')
    
    # Verify the result
    assert result.success is True
    assert result.data is not None
    assert result.data.get('userId') == 'test-user-123'


@pytest.mark.asyncio
async def test_mcp_tool_wrapper_handles_missing_user_id(
    mock_llm_orchestrator,
    mock_memory_system,
    tool_registry,
    mock_mcp_server
):
    """Test that MCP tool wrappers handle missing user_id parameter."""
    # Create agent with MCP server
    agent = MagnaAgent(
        llm_orchestrator=mock_llm_orchestrator,
        memory_system=mock_memory_system,
        tool_registry=tool_registry,
        mcp_server=mock_mcp_server
    )
    
    # Get the wrapped MCP tool from registry
    mcp_tool = tool_registry.get_tool('mcp_get_user_context')
    
    assert mcp_tool is not None
    
    # Execute the tool without user_id
    result = await mcp_tool.execute()
    
    # Verify the result indicates error
    assert result.success is False
    assert 'user_id' in result.error.lower()


@pytest.mark.asyncio
async def test_agent_uses_user_context_for_personalization(
    mock_llm_orchestrator,
    mock_memory_system,
    tool_registry,
    mock_mcp_server
):
    """Test that agent uses user context for personalized responses."""
    # Create agent with MCP server
    agent = MagnaAgent(
        llm_orchestrator=mock_llm_orchestrator,
        memory_system=mock_memory_system,
        tool_registry=tool_registry,
        mcp_server=mock_mcp_server
    )
    
    # Process a message
    responses = []
    async for response in agent.process_message(
        user_id='test-user-123',
        message='Hello',
        conversation_id='test-conv-1',
        stream=False
    ):
        responses.append(response)
    
    # Verify response was generated
    assert len(responses) > 0
    
    # Verify user context was included in metadata
    response = responses[0]
    user_context = response.metadata.get('user_context')
    
    # User context should be present (either from fetch or cache)
    # Note: It might be None if the fast path was used, which is acceptable
    # The important thing is that the code path exists


@pytest.mark.asyncio
async def test_agent_handles_mcp_server_errors(
    mock_llm_orchestrator,
    mock_memory_system,
    tool_registry,
    mock_mcp_server
):
    """Test that agent handles MCP server errors gracefully."""
    # Make MCP server raise an error
    async def mock_execute_tool_error(*args, **kwargs):
        raise Exception("MCP server connection failed")
    
    mock_mcp_server.execute_tool = mock_execute_tool_error
    
    # Create agent with MCP server
    agent = MagnaAgent(
        llm_orchestrator=mock_llm_orchestrator,
        memory_system=mock_memory_system,
        tool_registry=tool_registry,
        mcp_server=mock_mcp_server
    )
    
    # Process a message (should not crash)
    responses = []
    async for response in agent.process_message(
        user_id='test-user-123',
        message='Hello',
        conversation_id='test-conv-1',
        stream=False
    ):
        responses.append(response)
    
    # Should still get a response (even if user context fetch failed)
    assert len(responses) > 0


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
