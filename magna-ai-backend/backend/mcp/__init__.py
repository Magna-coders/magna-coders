"""
Model Context Protocol (MCP) server for Magna AI backend integration.

This module provides controlled access to the main backend data through
a set of tools that the AI agent can invoke. It implements security
measures including API key authentication, response filtering, caching,
and comprehensive audit logging.
"""

from .server import MagnaBackendMCPServer
from .tools import MCPTool
from .security import PromptGuard, AuditLogger

__all__ = [
    'MagnaBackendMCPServer',
    'MCPTool',
    'PromptGuard',
    'AuditLogger',
]
