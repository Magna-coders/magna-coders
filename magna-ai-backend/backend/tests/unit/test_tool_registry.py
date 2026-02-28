"""Unit tests for Tool abstract base class and ToolRegistry.

Tests cover:
- Tool interface implementation
- Tool registration and retrieval
- Tool execution with timeout and retry logic
- Error handling for various failure scenarios
- Execution history tracking
"""

import asyncio
import pytest
from typing import Any, Dict

from ...tools import (
    Tool,
    ToolRegistry,
    ToolResult,
    ToolMetadata,
    ToolExecutionError,
    ToolTimeoutError,
    ToolValidationError,
)


# Mock tool implementations for testing
class MockSuccessTool(Tool):
    """Mock tool that always succeeds."""
    
    @property
    def name(self) -> str:
        return "mock_success"
    
    @property
    def description(self) -> str:
        return "A mock tool that always succeeds"
    
    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "message": {"type": "string", "description": "Test message"}
            },
            "required": ["message"]
        }
    
    async def execute(self, **kwargs) -> ToolResult:
        message = kwargs.get("message", "")
        return ToolResult(
            success=True,
            data={"response": f"Processed: {message}"},
            metadata={"tool": self.name}
        )


class MockFailureTool(Tool):
    """Mock tool that always fails."""
    
    def __init__(self, failure_count: int = 999):
        """Initialize with number of times to fail before succeeding."""
        self.failure_count = failure_count
        self.attempt_count = 0
    
    @property
    def name(self) -> str:
        return "mock_failure"
    
    @property
    def description(self) -> str:
        return "A mock tool that fails"
    
    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {},
            "required": []
        }
    
    async def execute(self, **kwargs) -> ToolResult:
        self.attempt_count += 1
        if self.attempt_count <= self.failure_count:
            raise ToolExecutionError(f"Mock failure (attempt {self.attempt_count})")
        return ToolResult(success=True, data={"recovered": True})


class MockTimeoutTool(Tool):
    """Mock tool that times out."""
    
    @property
    def name(self) -> str:
        return "mock_timeout"
    
    @property
    def description(self) -> str:
        return "A mock tool that times out"
    
    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "delay": {"type": "number", "description": "Delay in seconds"}
            },
            "required": ["delay"]
        }
    
    async def execute(self, delay: float = 5.0, **kwargs) -> ToolResult:
        await asyncio.sleep(delay)
        return ToolResult(success=True, data={"completed": True})


class MockValidationErrorTool(Tool):
    """Mock tool that raises validation error."""
    
    @property
    def name(self) -> str:
        return "mock_validation_error"
    
    @property
    def description(self) -> str:
        return "A mock tool that raises validation error"
    
    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "value": {"type": "string", "description": "Value to validate"}
            },
            "required": ["value"]
        }
    
    async def execute(self, value: str = "", **kwargs) -> ToolResult:
        if not value:
            raise ToolValidationError("Value cannot be empty")
        return ToolResult(success=True, data={"value": value})


class TestToolInterface:
    """Test Tool abstract base class."""
    
    def test_tool_has_required_properties(self):
        """Test that Tool requires name, description, and parameters_schema."""
        tool = MockSuccessTool()
        
        assert hasattr(tool, "name")
        assert hasattr(tool, "description")
        assert hasattr(tool, "parameters_schema")
        assert hasattr(tool, "execute")
    
    def test_tool_name_property(self):
        """Test tool name property returns correct value."""
        tool = MockSuccessTool()
        assert tool.name == "mock_success"
    
    def test_tool_description_property(self):
        """Test tool description property returns correct value."""
        tool = MockSuccessTool()
        assert tool.description == "A mock tool that always succeeds"
    
    def test_tool_parameters_schema_property(self):
        """Test tool parameters_schema property returns valid JSON schema."""
        tool = MockSuccessTool()
        schema = tool.parameters_schema
        
        assert isinstance(schema, dict)
        assert "type" in schema
        assert schema["type"] == "object"
        assert "properties" in schema
        assert "message" in schema["properties"]
    
    @pytest.mark.asyncio
    async def test_tool_execute_method(self):
        """Test tool execute method works correctly."""
        tool = MockSuccessTool()
        result = await tool.execute(message="test")
        
        assert isinstance(result, ToolResult)
        assert result.success is True
        assert result.data["response"] == "Processed: test"


class TestToolRegistry:
    """Test ToolRegistry functionality."""
    
    def test_registry_initialization(self):
        """Test ToolRegistry initializes correctly."""
        registry = ToolRegistry()
        
        assert registry is not None
        assert len(registry.list_tools()) == 0
    
    def test_register_tool(self):
        """Test registering a tool."""
        registry = ToolRegistry()
        tool = MockSuccessTool()
        
        registry.register_tool(tool)
        
        assert registry.get_tool("mock_success") is not None
        assert len(registry.list_tools()) == 1
    
    def test_register_duplicate_tool_raises_error(self):
        """Test registering duplicate tool raises ValueError."""
        registry = ToolRegistry()
        tool1 = MockSuccessTool()
        tool2 = MockSuccessTool()
        
        registry.register_tool(tool1)
        
        with pytest.raises(ValueError, match="already registered"):
            registry.register_tool(tool2)
    
    def test_get_tool_returns_correct_tool(self):
        """Test get_tool returns the correct tool instance."""
        registry = ToolRegistry()
        tool = MockSuccessTool()
        registry.register_tool(tool)
        
        retrieved = registry.get_tool("mock_success")
        
        assert retrieved is tool
        assert retrieved.name == "mock_success"
    
    def test_get_tool_returns_none_for_unknown_tool(self):
        """Test get_tool returns None for non-existent tool."""
        registry = ToolRegistry()
        
        result = registry.get_tool("nonexistent")
        
        assert result is None
    
    def test_list_tools_returns_metadata(self):
        """Test list_tools returns correct metadata."""
        registry = ToolRegistry()
        tool1 = MockSuccessTool()
        tool2 = MockFailureTool()
        
        registry.register_tool(tool1)
        registry.register_tool(tool2)
        
        tools = registry.list_tools()
        
        assert len(tools) == 2
        assert all(isinstance(t, ToolMetadata) for t in tools)
        assert any(t.name == "mock_success" for t in tools)
        assert any(t.name == "mock_failure" for t in tools)
    
    @pytest.mark.asyncio
    async def test_execute_tool_success(self):
        """Test successful tool execution."""
        registry = ToolRegistry()
        tool = MockSuccessTool()
        registry.register_tool(tool)
        
        result = await registry.execute_tool(
            tool_name="mock_success",
            parameters={"message": "hello"}
        )
        
        assert result.success is True
        assert result.data["response"] == "Processed: hello"
        assert result.execution_time_ms > 0
    
    @pytest.mark.asyncio
    async def test_execute_tool_not_found(self):
        """Test executing non-existent tool returns error."""
        registry = ToolRegistry()
        
        result = await registry.execute_tool(
            tool_name="nonexistent",
            parameters={}
        )
        
        assert result.success is False
        assert "not found" in result.error.lower()
    
    @pytest.mark.asyncio
    async def test_execute_tool_with_timeout(self):
        """Test tool execution timeout handling."""
        registry = ToolRegistry()
        tool = MockTimeoutTool()
        registry.register_tool(tool)
        
        result = await registry.execute_tool(
            tool_name="mock_timeout",
            parameters={"delay": 5.0},
            timeout_seconds=1
        )
        
        assert result.success is False
        assert "timed out" in result.error.lower()
        assert result.metadata["timeout_seconds"] == 1
    
    @pytest.mark.asyncio
    async def test_execute_tool_with_retry_success(self):
        """Test tool execution succeeds after retries."""
        registry = ToolRegistry()
        tool = MockFailureTool(failure_count=2)  # Fail twice, then succeed
        registry.register_tool(tool)
        
        result = await registry.execute_tool(
            tool_name="mock_failure",
            parameters={},
            max_retries=3
        )
        
        assert result.success is True
        assert result.data["recovered"] is True
        assert tool.attempt_count == 3
    
    @pytest.mark.asyncio
    async def test_execute_tool_with_retry_failure(self):
        """Test tool execution fails after max retries."""
        registry = ToolRegistry()
        tool = MockFailureTool(failure_count=999)  # Always fail
        registry.register_tool(tool)
        
        result = await registry.execute_tool(
            tool_name="mock_failure",
            parameters={},
            max_retries=3
        )
        
        assert result.success is False
        assert "failed after 3 attempts" in result.error.lower()
        assert tool.attempt_count == 3
    
    @pytest.mark.asyncio
    async def test_execute_tool_validation_error_no_retry(self):
        """Test validation errors are not retried."""
        registry = ToolRegistry()
        tool = MockValidationErrorTool()
        registry.register_tool(tool)
        
        result = await registry.execute_tool(
            tool_name="mock_validation_error",
            parameters={"value": ""},
            max_retries=3
        )
        
        assert result.success is False
        assert "validation failed" in result.error.lower()
        assert result.metadata["attempt"] == 1  # Only one attempt
    
    @pytest.mark.asyncio
    async def test_execute_tool_logs_history(self):
        """Test tool execution is logged in history."""
        registry = ToolRegistry()
        tool = MockSuccessTool()
        registry.register_tool(tool)
        
        await registry.execute_tool(
            tool_name="mock_success",
            parameters={"message": "test"}
        )
        
        history = registry.get_execution_history()
        
        assert len(history) == 1
        assert history[0]["tool_name"] == "mock_success"
        assert history[0]["success"] is True
        assert "timestamp" in history[0]
    
    def test_get_execution_history_limit(self):
        """Test execution history respects limit parameter."""
        registry = ToolRegistry()
        
        # Add multiple records
        for i in range(20):
            registry._log_execution(
                tool_name="test",
                parameters={},
                result=ToolResult(success=True),
                attempt=1
            )
        
        history = registry.get_execution_history(limit=5)
        
        assert len(history) == 5
    
    def test_clear_history(self):
        """Test clearing execution history."""
        registry = ToolRegistry()
        tool = MockSuccessTool()
        registry.register_tool(tool)
        
        # Add some history
        registry._log_execution(
            tool_name="test",
            parameters={},
            result=ToolResult(success=True),
            attempt=1
        )
        
        assert len(registry.get_execution_history()) > 0
        
        registry.clear_history()
        
        assert len(registry.get_execution_history()) == 0


class TestToolResult:
    """Test ToolResult dataclass."""
    
    def test_tool_result_initialization(self):
        """Test ToolResult initializes correctly."""
        result = ToolResult(
            success=True,
            data={"key": "value"},
            error=None,
            execution_time_ms=100.5
        )
        
        assert result.success is True
        assert result.data == {"key": "value"}
        assert result.error is None
        assert result.execution_time_ms == 100.5
        assert isinstance(result.metadata, dict)
    
    def test_tool_result_with_error(self):
        """Test ToolResult with error."""
        result = ToolResult(
            success=False,
            error="Something went wrong"
        )
        
        assert result.success is False
        assert result.error == "Something went wrong"
        assert result.data is None
    
    def test_tool_result_metadata_initialization(self):
        """Test ToolResult metadata is initialized as empty dict."""
        result = ToolResult(success=True)
        
        assert result.metadata is not None
        assert isinstance(result.metadata, dict)
        assert len(result.metadata) == 0


class TestToolMetadata:
    """Test ToolMetadata dataclass."""
    
    def test_tool_metadata_initialization(self):
        """Test ToolMetadata initializes correctly."""
        metadata = ToolMetadata(
            name="test_tool",
            description="A test tool",
            parameters_schema={"type": "object"},
            timeout_seconds=15
        )
        
        assert metadata.name == "test_tool"
        assert metadata.description == "A test tool"
        assert metadata.parameters_schema == {"type": "object"}
        assert metadata.timeout_seconds == 15
    
    def test_tool_metadata_default_timeout(self):
        """Test ToolMetadata uses default timeout."""
        metadata = ToolMetadata(
            name="test_tool",
            description="A test tool",
            parameters_schema={"type": "object"}
        )
        
        assert metadata.timeout_seconds == 10


class TestExponentialBackoff:
    """Test exponential backoff retry logic."""
    
    @pytest.mark.asyncio
    async def test_exponential_backoff_timing(self):
        """Test that retry delays follow exponential backoff pattern."""
        registry = ToolRegistry()
        tool = MockFailureTool(failure_count=999)
        registry.register_tool(tool)
        
        import time
        start_time = time.time()
        
        await registry.execute_tool(
            tool_name="mock_failure",
            parameters={},
            max_retries=3
        )
        
        elapsed = time.time() - start_time
        
        # Should have delays of 1s + 2s = 3s minimum
        # (first attempt immediate, second after 1s, third after 2s)
        assert elapsed >= 3.0
        assert elapsed < 5.0  # Should not take too long
