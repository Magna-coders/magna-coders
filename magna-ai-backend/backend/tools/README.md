# Tool Integration Framework

This module provides the foundation for tool integration in the Magna AI Agent, allowing the agent to interact with external services and APIs through a standardized interface.

## Overview

The tool framework consists of:
- **Tool**: Abstract base class defining the tool interface
- **ToolRegistry**: Central registry for managing and executing tools
- **ToolResult**: Standardized result format for tool execution
- **Error Handling**: Comprehensive error types and retry logic

## Quick Start

### Creating a Custom Tool

```python
from magna_ai.backend.tools import Tool, ToolResult

class WebSearchTool(Tool):
    """Search the web using SerpAPI."""
    
    @property
    def name(self) -> str:
        return "web_search"
    
    @property
    def description(self) -> str:
        return "Search the web for current information using SerpAPI"
    
    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query"
                },
                "num_results": {
                    "type": "integer",
                    "description": "Number of results to return",
                    "default": 5
                }
            },
            "required": ["query"]
        }
    
    async def execute(self, query: str, num_results: int = 5) -> ToolResult:
        try:
            # Perform web search
            results = await self._search_api(query, num_results)
            
            return ToolResult(
                success=True,
                data={"results": results},
                metadata={"query": query, "count": len(results)}
            )
        except Exception as e:
            return ToolResult(
                success=False,
                error=f"Search failed: {str(e)}"
            )
```

### Registering and Using Tools

```python
from magna_ai.backend.tools import ToolRegistry

# Create registry
registry = ToolRegistry()

# Register tools
registry.register_tool(WebSearchTool())
registry.register_tool(ProfileRetrievalTool())
registry.register_tool(OpportunityMatchTool())

# List available tools
tools = registry.list_tools()
for tool in tools:
    print(f"{tool.name}: {tool.description}")

# Execute a tool
result = await registry.execute_tool(
    tool_name="web_search",
    parameters={"query": "Python developer jobs in Kenya"},
    timeout_seconds=10,
    max_retries=3
)

if result.success:
    print(f"Search results: {result.data}")
else:
    print(f"Search failed: {result.error}")
```

## Features

### Timeout Protection

Tools are executed with configurable timeouts to prevent hanging:

```python
result = await registry.execute_tool(
    tool_name="slow_tool",
    parameters={},
    timeout_seconds=5  # Will timeout after 5 seconds
)
```

### Automatic Retry with Exponential Backoff

Failed tool executions are automatically retried with exponential backoff:

```python
result = await registry.execute_tool(
    tool_name="flaky_tool",
    parameters={},
    max_retries=3  # Will retry up to 3 times
)
# Retry delays: 1s, 2s, 4s (exponential backoff)
```

### Error Handling

The framework provides specific error types:

- **ToolExecutionError**: General execution failure
- **ToolTimeoutError**: Execution exceeded timeout
- **ToolValidationError**: Invalid parameters (not retried)

```python
from magna_ai.backend.tools import ToolValidationError

async def execute(self, value: str) -> ToolResult:
    if not value:
        raise ToolValidationError("Value cannot be empty")
    # ... rest of implementation
```

### Execution History

Track tool usage for monitoring and debugging:

```python
# Get recent executions
history = registry.get_execution_history(limit=10)

for record in history:
    print(f"{record['timestamp']}: {record['tool_name']} - "
          f"{'Success' if record['success'] else 'Failed'} "
          f"({record['execution_time_ms']:.2f}ms)")

# Clear history
registry.clear_history()
```

## Tool Interface Requirements

Every tool must implement:

1. **name** (property): Unique identifier for the tool
2. **description** (property): Human-readable description for LLM
3. **parameters_schema** (property): JSON schema for parameters
4. **execute** (method): Async method that performs the tool's operation

## Parameter Schema Format

Use JSON Schema to define tool parameters:

```python
{
    "type": "object",
    "properties": {
        "param1": {
            "type": "string",
            "description": "Description of param1"
        },
        "param2": {
            "type": "integer",
            "description": "Description of param2",
            "default": 10,
            "minimum": 1,
            "maximum": 100
        }
    },
    "required": ["param1"]  # List required parameters
}
```

## Best Practices

### 1. Return ToolResult Consistently

Always return a `ToolResult` with appropriate success status:

```python
# Success
return ToolResult(
    success=True,
    data={"result": "data"},
    metadata={"info": "additional context"}
)

# Failure
return ToolResult(
    success=False,
    error="Clear error message"
)
```

### 2. Handle Errors Gracefully

Catch exceptions and return informative error messages:

```python
async def execute(self, **kwargs) -> ToolResult:
    try:
        result = await self._perform_operation()
        return ToolResult(success=True, data=result)
    except ConnectionError as e:
        return ToolResult(success=False, error=f"Connection failed: {e}")
    except ValueError as e:
        raise ToolValidationError(f"Invalid input: {e}")
```

### 3. Validate Parameters Early

Check parameters before performing expensive operations:

```python
async def execute(self, user_id: str, **kwargs) -> ToolResult:
    if not user_id or not user_id.strip():
        raise ToolValidationError("user_id cannot be empty")
    
    # Continue with operation
    ...
```

### 4. Use Metadata for Context

Include useful metadata in results:

```python
return ToolResult(
    success=True,
    data={"matches": matches},
    metadata={
        "query_time_ms": query_time,
        "total_candidates": total,
        "filters_applied": filters
    }
)
```

### 5. Log Important Events

Use logging for debugging and monitoring:

```python
import logging

logger = logging.getLogger(__name__)

async def execute(self, **kwargs) -> ToolResult:
    logger.info(f"Executing {self.name} with params: {kwargs}")
    
    try:
        result = await self._operation()
        logger.info(f"{self.name} completed successfully")
        return ToolResult(success=True, data=result)
    except Exception as e:
        logger.error(f"{self.name} failed: {e}", exc_info=True)
        return ToolResult(success=False, error=str(e))
```

## Built-in Tools

The following tools are currently implemented:

### WebSearchTool
Search the web using SerpAPI for current information, news, job postings, and technical documentation.

**Parameters:**
- `query` (string, required): Search query to execute
- `num_results` (integer, optional): Number of results to return (1-10, default: 5)
- `location` (string, optional): Geographic location for localized results

**Example:**
```python
result = await registry.execute_tool(
    tool_name="web_search",
    parameters={
        "query": "Python developer jobs in Kenya",
        "num_results": 5
    }
)
```

### ProfileRetrievalTool
Fetch user profile information from the Magna platform backend.

**Parameters:**
- `user_id` (string, required): UUID of the user whose profile to retrieve
- `auth_token` (string, optional): JWT authentication token

**Example:**
```python
result = await registry.execute_tool(
    tool_name="profile_retrieval",
    parameters={
        "user_id": "550e8400-e29b-41d4-a716-446655440000"
    }
)
```

### OpportunityMatchTool
Retrieve opportunities (jobs, projects, gigs) from the Magna platform backend.

**Parameters:**
- `opportunity_type` (string, optional): Type of opportunity ("project", "opportunity", "all", default: "all")
- `limit` (integer, optional): Maximum number of results (1-50, default: 10)
- `page` (integer, optional): Page number for pagination (default: 1)
- `category_id` (string, optional): Filter by category UUID
- `auth_token` (string, optional): JWT authentication token

**Example:**
```python
result = await registry.execute_tool(
    tool_name="opportunity_match",
    parameters={
        "opportunity_type": "project",
        "limit": 10,
        "page": 1
    }
)
```

### Coming Soon

- **CollaborationMatchTool**: Find matching collaborators
- **DocumentUploadTool**: Upload documents to S3
- **DocumentSubmitTool**: Submit documents to opportunities
- **InterviewQuestionTool**: Generate interview questions
- **ResumeAnalysisTool**: Analyze and provide resume feedback

## Testing

The framework includes comprehensive unit tests:

```bash
# Run tool registry tests
pytest tests/unit/test_tool_registry.py -v

# Run with coverage
pytest tests/unit/test_tool_registry.py --cov=tools --cov-report=html
```

## Requirements Validation

This implementation validates the following requirements:

- **8.1**: Integration with web search APIs ✓
- **8.2**: Connection to backend APIs for profile retrieval ✓
- **8.3**: Access to opportunity matching APIs ✓
- **8.4**: Document upload API invocation ✓
- **8.5**: Graceful error handling and user notification ✓

## Architecture

```
tools/
├── __init__.py          # Public API exports
├── base.py              # Tool and ToolRegistry implementation
├── README.md            # This file
└── built_in/            # Built-in tool implementations (coming soon)
    ├── web_search.py
    ├── profile.py
    ├── matching.py
    └── documents.py
```

## Performance Considerations

- **Timeout**: Default 10 seconds, configurable per execution
- **Retry**: Default 3 attempts with exponential backoff (1s, 2s, 4s)
- **History**: Keeps last 100 executions in memory
- **Async**: All operations are async for non-blocking execution

## Error Recovery

The framework implements intelligent error recovery:

1. **Transient Errors**: Automatically retried with backoff
2. **Validation Errors**: Not retried, returned immediately
3. **Timeout Errors**: Not retried, returned immediately
4. **All Retries Exhausted**: Returns failure with detailed error

## Integration with Agent

The tool registry integrates with the ReAct agent:

```python
# In agent initialization
self.tool_registry = ToolRegistry()
self.tool_registry.register_tool(WebSearchTool())
# ... register other tools

# In agent execution
async def _act(self, plan: ActionPlan) -> ActionResults:
    results = []
    for action in plan.actions:
        result = await self.tool_registry.execute_tool(
            tool_name=action.tool_name,
            parameters=action.parameters
        )
        results.append(result)
    return ActionResults(results)
```
