"""Tool integration framework for Magna AI Agent.

This package provides the foundation for tool integration, allowing the agent
to interact with external services and APIs through a standardized interface.
"""

from .base import (
    Tool,
    ToolRegistry,
    ToolResult,
    ToolMetadata,
    ToolExecutionError,
    ToolTimeoutError,
    ToolValidationError,
)
from .web_search_tool import WebSearchTool
from .profile_retrieval_tool import ProfileRetrievalTool
from .opportunity_match_tool import OpportunityMatchTool
from .document_upload_tool import DocumentUploadTool

__all__ = [
    "Tool",
    "ToolRegistry",
    "ToolResult",
    "ToolMetadata",
    "ToolExecutionError",
    "ToolTimeoutError",
    "ToolValidationError",
    "WebSearchTool",
    "ProfileRetrievalTool",
    "OpportunityMatchTool",
    "DocumentUploadTool",
]
