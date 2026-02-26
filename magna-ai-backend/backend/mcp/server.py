"""
MCP Server implementation for Magna AI backend integration.

This module provides the main MCP server class that manages tool
registration, execution, caching, and security validation.
"""

import logging
from typing import Dict, Any, Optional
from cachetools import TTLCache

from .tools import MCPTool
from .security import PromptGuard, AuditLogger

logger = logging.getLogger(__name__)


class ToolNotFoundError(Exception):
    """Raised when a requested tool is not registered."""
    pass


class UnauthorizedError(Exception):
    """Raised when user authorization fails."""
    pass


class ToolExecutionError(Exception):
    """Raised when tool execution fails."""
    pass


class MagnaBackendMCPServer:
    """
    Model Context Protocol server for controlled access to main backend data.
    
    Implements tools that the AI agent can invoke to fetch user information
    with security validation, caching, and audit logging.
    """
    
    def __init__(self, backend_url: str, api_key: str):
        """
        Initialize the MCP server.
        
        Args:
            backend_url: Main backend API base URL
            api_key: API key for authentication
        """
        self.backend_url = backend_url
        self.api_key = api_key
        self.tools: Dict[str, MCPTool] = {}
        
        # TTL cache with 5-minute expiration (300 seconds)
        self.cache = TTLCache(maxsize=1000, ttl=300)
        
        # Security components
        self.audit_logger = AuditLogger()
        self.prompt_guard = PromptGuard()
        self.prompt_guard.audit_logger = self.audit_logger
        
        logger.info(f"MCP Server initialized with backend URL: {backend_url}")
    
    def register_tool(self, tool: MCPTool) -> None:
        """
        Register a tool with the MCP server.
        
        Args:
            tool: MCPTool instance to register
        """
        tool_name = tool.name
        if tool_name in self.tools:
            logger.warning(f"Tool {tool_name} already registered, overwriting")
        
        self.tools[tool_name] = tool
        logger.info(f"Registered tool: {tool_name}")
    
    async def initialize(self) -> None:
        """
        Initialize the MCP server and register all available tools.
        
        This method should be called after instantiation to set up
        all tools. Tool registration is done separately to allow
        for dynamic tool loading.
        """
        logger.info("MCP Server initialization complete")
        logger.info(f"Registered tools: {list(self.tools.keys())}")
    
    async def execute_tool(
        self, 
        tool_name: str, 
        user_id: str, 
        parameters: Dict[str, Any],
        session_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Execute a tool with security validation and caching.
        
        Args:
            tool_name: Name of the tool to execute
            user_id: ID of the authenticated user
            parameters: Tool-specific parameters
            session_id: Session ID for audit logging
            ip_address: User IP address for audit logging
            user_agent: User agent for audit logging
            
        Returns:
            Dict[str, Any]: Filtered tool response
            
        Raises:
            ToolNotFoundError: If tool doesn't exist
            UnauthorizedError: If user not authorized
            ToolExecutionError: If tool execution fails
        """
        # Validate tool exists
        if tool_name not in self.tools:
            logger.error(f"Tool not found: {tool_name}")
            raise ToolNotFoundError(f"Tool {tool_name} not found")
        
        # Validate user ID
        if not user_id:
            logger.error("User ID required but not provided")
            raise UnauthorizedError("User ID required")
        
        # Check cache
        cache_key = self._generate_cache_key(tool_name, user_id, parameters)
        if cache_key in self.cache:
            logger.info(f"Cache hit for {tool_name}")
            return self.cache[cache_key]
        
        # Execute tool
        tool = self.tools[tool_name]
        try:
            logger.info(f"Executing tool: {tool_name} for user {user_id}")
            
            result = await tool.execute(
                backend_url=self.backend_url,
                api_key=self.api_key,
                user_id=user_id,
                parameters=parameters
            )
            
            # Filter sensitive data
            filtered_result = self._filter_sensitive_data(result)
            
            # Cache result
            self.cache[cache_key] = filtered_result
            
            # Audit log
            await self.audit_logger.log_tool_execution(
                tool_name=tool_name,
                user_id=user_id,
                parameters=parameters,
                success=True,
                session_id=session_id,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            logger.info(f"Tool execution successful: {tool_name}")
            return filtered_result
            
        except Exception as e:
            logger.error(f"Tool execution failed: {tool_name} - {str(e)}")
            
            await self.audit_logger.log_tool_execution(
                tool_name=tool_name,
                user_id=user_id,
                parameters=parameters,
                success=False,
                error=str(e),
                session_id=session_id,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            raise ToolExecutionError(f"Tool execution failed: {e}")
    
    def _generate_cache_key(
        self, 
        tool_name: str, 
        user_id: str, 
        parameters: Dict[str, Any]
    ) -> str:
        """
        Generate a cache key for the tool execution.
        
        Args:
            tool_name: Name of the tool
            user_id: User ID
            parameters: Tool parameters
            
        Returns:
            str: Cache key
        """
        # Create a stable hash of parameters
        params_str = str(sorted(parameters.items()))
        return f"{tool_name}:{user_id}:{hash(params_str)}"
    
    def _filter_sensitive_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Remove sensitive fields from response.
        
        Args:
            data: Response data to filter
            
        Returns:
            Dict[str, Any]: Filtered data
        """
        sensitive_fields = {
            'password', 
            'email', 
            'apiKey', 
            'api_key',
            'token', 
            'paymentInfo',
            'payment_info',
            'creditCard',
            'credit_card',
            'ssn',
            'social_security'
        }
        
        if not isinstance(data, dict):
            return data
        
        filtered = {}
        for key, value in data.items():
            # Skip sensitive fields
            if key.lower() in {f.lower() for f in sensitive_fields}:
                continue
            
            # Recursively filter nested dictionaries
            if isinstance(value, dict):
                filtered[key] = self._filter_sensitive_data(value)
            # Filter lists of dictionaries
            elif isinstance(value, list):
                filtered[key] = [
                    self._filter_sensitive_data(item) if isinstance(item, dict) else item
                    for item in value
                ]
            else:
                filtered[key] = value
        
        return filtered
    
    def get_tool_list(self) -> list:
        """
        Get list of registered tools with their descriptions.
        
        Returns:
            list: List of tool information dictionaries
        """
        return [
            {
                'name': tool.name,
                'description': tool.description
            }
            for tool in self.tools.values()
        ]
