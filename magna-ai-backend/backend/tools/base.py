"""Tool abstract base class and registry for Magna AI Agent.

This module provides the foundation for tool integration, allowing the agent
to interact with external services and APIs through a standardized interface.
"""

import asyncio
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


@dataclass
class ToolResult:
    """Result from tool execution.
    
    Attributes:
        success: Whether the tool execution succeeded
        data: Result data from the tool
        error: Error message if execution failed
        execution_time_ms: Time taken to execute in milliseconds
        metadata: Additional metadata about the execution
    """
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    execution_time_ms: float = 0.0
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        """Initialize metadata if not provided."""
        if self.metadata is None:
            self.metadata = {}


@dataclass
class ToolMetadata:
    """Metadata about a registered tool.
    
    Attributes:
        name: Tool identifier
        description: Human-readable description for LLM
        parameters_schema: JSON schema for parameters
        timeout_seconds: Default timeout for execution
    """
    name: str
    description: str
    parameters_schema: Dict[str, Any]
    timeout_seconds: int = 10


class ToolExecutionError(Exception):
    """Raised when tool execution fails."""
    pass


class ToolTimeoutError(ToolExecutionError):
    """Raised when tool execution times out."""
    pass


class ToolValidationError(ToolExecutionError):
    """Raised when tool parameters are invalid."""
    pass


class Tool(ABC):
    """Abstract base class for all tools.
    
    Tools extend the agent's capabilities by providing access to external
    services, APIs, and data sources. Each tool must implement the required
    properties and execute method.
    
    Example:
        class WebSearchTool(Tool):
            @property
            def name(self) -> str:
                return "web_search"
            
            @property
            def description(self) -> str:
                return "Search the web for information"
            
            @property
            def parameters_schema(self) -> Dict[str, Any]:
                return {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Search query"}
                    },
                    "required": ["query"]
                }
            
            async def execute(self, query: str) -> ToolResult:
                # Implementation
                pass
    """
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Tool identifier used for registration and invocation.
        
        Returns:
            Unique tool name (e.g., "web_search", "profile_retrieval")
        """
        pass
    
    @property
    @abstractmethod
    def description(self) -> str:
        """Human-readable description for LLM understanding.
        
        This description helps the LLM decide when to use this tool.
        Should clearly explain what the tool does and when to use it.
        
        Returns:
            Tool description for LLM context
        """
        pass
    
    @property
    @abstractmethod
    def parameters_schema(self) -> Dict[str, Any]:
        """JSON schema defining tool parameters.
        
        Follows JSON Schema specification for parameter validation.
        Should include type, properties, required fields, and descriptions.
        
        Returns:
            JSON schema dictionary
        """
        pass
    
    @abstractmethod
    async def execute(self, **kwargs) -> ToolResult:
        """Execute tool logic with provided parameters.
        
        This method contains the core tool functionality. It should:
        - Validate input parameters
        - Perform the tool's operation
        - Handle errors gracefully
        - Return a ToolResult with success status and data
        
        Args:
            **kwargs: Tool parameters matching the parameters_schema
            
        Returns:
            ToolResult with execution outcome
            
        Raises:
            ToolExecutionError: If execution fails
            ToolValidationError: If parameters are invalid
        """
        pass


class ToolRegistry:
    """Registry for managing and executing tools.
    
    The ToolRegistry maintains a collection of available tools and provides
    methods for registration, discovery, and execution with error handling,
    timeout, and retry logic.
    
    Attributes:
        _tools: Dictionary mapping tool names to Tool instances
        _execution_history: List of recent tool executions for monitoring
    """
    
    def __init__(self):
        """Initialize empty tool registry."""
        self._tools: Dict[str, Tool] = {}
        self._execution_history: List[Dict[str, Any]] = []
        logger.info("ToolRegistry initialized")
    
    def register_tool(self, tool: Tool) -> None:
        """Register a new tool in the registry.
        
        Args:
            tool: Tool instance to register
            
        Raises:
            ValueError: If tool with same name already registered
        """
        if tool.name in self._tools:
            raise ValueError(f"Tool '{tool.name}' is already registered")
        
        self._tools[tool.name] = tool
        logger.info(f"Registered tool: {tool.name}")
    
    def get_tool(self, name: str) -> Optional[Tool]:
        """Retrieve tool by name.
        
        Args:
            name: Tool identifier
            
        Returns:
            Tool instance if found, None otherwise
        """
        return self._tools.get(name)
    
    def list_tools(self) -> List[ToolMetadata]:
        """List all available tools with metadata.
        
        Returns:
            List of ToolMetadata for all registered tools
        """
        return [
            ToolMetadata(
                name=tool.name,
                description=tool.description,
                parameters_schema=tool.parameters_schema,
                timeout_seconds=10  # Default timeout
            )
            for tool in self._tools.values()
        ]
    
    async def execute_tool(
        self,
        tool_name: str,
        parameters: Dict[str, Any],
        timeout_seconds: int = 10,
        max_retries: int = 3
    ) -> ToolResult:
        """Execute tool with error handling, timeout, and retry logic.
        
        This method implements robust tool execution with:
        - Timeout protection to prevent hanging
        - Exponential backoff retry for transient failures
        - Comprehensive error handling and logging
        - Execution history tracking
        
        Args:
            tool_name: Name of tool to execute
            parameters: Tool parameters matching schema
            timeout_seconds: Maximum execution time in seconds
            max_retries: Maximum number of retry attempts
            
        Returns:
            ToolResult with execution outcome
            
        Raises:
            ToolExecutionError: If tool not found or execution fails after retries
        """
        # Validate tool exists
        tool = self.get_tool(tool_name)
        if tool is None:
            error_msg = f"Tool '{tool_name}' not found in registry"
            logger.error(error_msg)
            return ToolResult(
                success=False,
                error=error_msg,
                metadata={"tool_name": tool_name}
            )
        
        # Execute with retry logic
        last_error = None
        for attempt in range(max_retries):
            try:
                start_time = datetime.now()
                
                # Execute with timeout
                result = await asyncio.wait_for(
                    tool.execute(**parameters),
                    timeout=timeout_seconds
                )
                
                # Calculate execution time
                execution_time = (datetime.now() - start_time).total_seconds() * 1000
                result.execution_time_ms = execution_time
                
                # Log successful execution
                self._log_execution(
                    tool_name=tool_name,
                    parameters=parameters,
                    result=result,
                    attempt=attempt + 1
                )
                
                logger.info(
                    f"Tool '{tool_name}' executed successfully "
                    f"in {execution_time:.2f}ms (attempt {attempt + 1})"
                )
                
                return result
                
            except asyncio.TimeoutError:
                last_error = f"Tool execution timed out after {timeout_seconds}s"
                logger.warning(
                    f"Tool '{tool_name}' timed out on attempt {attempt + 1}/{max_retries}"
                )
                
                # Don't retry on timeout - return immediately
                return ToolResult(
                    success=False,
                    error=last_error,
                    metadata={
                        "tool_name": tool_name,
                        "timeout_seconds": timeout_seconds,
                        "attempt": attempt + 1
                    }
                )
                
            except ToolValidationError as e:
                # Don't retry validation errors
                last_error = f"Parameter validation failed: {str(e)}"
                logger.error(f"Tool '{tool_name}' validation error: {e}")
                
                return ToolResult(
                    success=False,
                    error=last_error,
                    metadata={
                        "tool_name": tool_name,
                        "parameters": parameters,
                        "attempt": attempt + 1
                    }
                )
                
            except Exception as e:
                last_error = str(e)
                logger.warning(
                    f"Tool '{tool_name}' failed on attempt {attempt + 1}/{max_retries}: {e}"
                )
                
                # Exponential backoff before retry
                if attempt < max_retries - 1:
                    backoff_seconds = 2 ** attempt  # 1s, 2s, 4s
                    logger.info(f"Retrying in {backoff_seconds}s...")
                    await asyncio.sleep(backoff_seconds)
        
        # All retries exhausted
        error_msg = f"Tool execution failed after {max_retries} attempts: {last_error}"
        logger.error(f"Tool '{tool_name}' failed permanently: {error_msg}")
        
        result = ToolResult(
            success=False,
            error=error_msg,
            metadata={
                "tool_name": tool_name,
                "max_retries": max_retries,
                "last_error": last_error
            }
        )
        
        self._log_execution(
            tool_name=tool_name,
            parameters=parameters,
            result=result,
            attempt=max_retries
        )
        
        return result
    
    def _log_execution(
        self,
        tool_name: str,
        parameters: Dict[str, Any],
        result: ToolResult,
        attempt: int
    ) -> None:
        """Log tool execution for monitoring and debugging.
        
        Args:
            tool_name: Name of executed tool
            parameters: Parameters used
            result: Execution result
            attempt: Attempt number
        """
        execution_record = {
            "timestamp": datetime.now().isoformat(),
            "tool_name": tool_name,
            "parameters": parameters,
            "success": result.success,
            "execution_time_ms": result.execution_time_ms,
            "attempt": attempt,
            "error": result.error
        }
        
        self._execution_history.append(execution_record)
        
        # Keep only last 100 executions
        if len(self._execution_history) > 100:
            self._execution_history = self._execution_history[-100:]
    
    def get_execution_history(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent tool execution history.
        
        Args:
            limit: Maximum number of records to return
            
        Returns:
            List of execution records
        """
        return self._execution_history[-limit:]
    
    def clear_history(self) -> None:
        """Clear execution history."""
        self._execution_history.clear()
        logger.info("Execution history cleared")
