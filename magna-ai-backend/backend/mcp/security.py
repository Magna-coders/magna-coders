"""
Security components for MCP server.

This module provides prompt injection detection and audit logging
functionality to ensure secure AI interactions.
"""

import re
import logging
from typing import Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class PromptGuard:
    """
    Detects and blocks prompt injection attempts.
    
    Uses pattern matching and heuristics to identify malicious prompts
    that attempt to manipulate the AI agent or leak sensitive data.
    """
    
    INJECTION_PATTERNS = [
        r"ignore\s+.*?instructions?",
        r"reveal\s+.*?(?:prompt|instructions?|system)",
        r"bypass\s+.*?security",
        r"disregard\s+",
        r"forget\s+.*?(?:everything|all|previous|instructions?)",
        r"you\s+are\s+now\s+",
        r"new\s+instructions?:",
        r"system\s*:\s*",
        r"<\s*system\s*>",
        r"show\s+me\s+.*?(?:prompt|instructions?)",
        r"what\s+(?:are|is)\s+your\s+(?:instructions?|prompt)",
        r"repeat\s+.*?(?:instructions?|prompt)",
    ]
    
    def __init__(self):
        """Initialize the prompt guard with compiled regex patterns."""
        self.patterns = [
            re.compile(p, re.IGNORECASE) for p in self.INJECTION_PATTERNS
        ]
        self.audit_logger = None  # Will be set by MCP server
    
    async def scan_message(
        self, 
        message: str, 
        user_id: str, 
        session_id: str
    ) -> bool:
        """
        Scan message for injection patterns.
        
        Args:
            message: User message to scan
            user_id: ID of the user
            session_id: Current session ID
            
        Returns:
            bool: True if message is safe, False if injection detected
        """
        for pattern in self.patterns:
            if pattern.search(message):
                if self.audit_logger:
                    await self.audit_logger.log_injection_attempt(
                        user_id=user_id,
                        session_id=session_id,
                        message=message,
                        pattern=pattern.pattern
                    )
                logger.warning(
                    f"Prompt injection detected for user {user_id}: {pattern.pattern}"
                )
                return False
        
        return True
    
    def get_rejection_message(self) -> str:
        """
        Get user-friendly rejection message.
        
        Returns:
            str: Message to display when injection is detected
        """
        return (
            "I'm sorry, but I can't process that request. "
            "Please rephrase your question in a different way."
        )


class AuditLogger:
    """
    Logs AI interactions and security events for monitoring.
    
    Creates audit log entries in the database for tool executions,
    prompt injection attempts, and unauthorized access attempts.
    """
    
    def __init__(self):
        """Initialize the audit logger."""
        self.db_connection = None  # Will be set by MCP server
    
    async def log_tool_execution(
        self,
        tool_name: str,
        user_id: str,
        parameters: dict,
        success: bool,
        error: Optional[str] = None,
        session_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> None:
        """
        Log a tool execution event.
        
        Args:
            tool_name: Name of the executed tool
            user_id: ID of the user
            parameters: Tool parameters
            success: Whether execution succeeded
            error: Error message if failed
            session_id: Session ID if available
            ip_address: User IP address if available
            user_agent: User agent string if available
        """
        try:
            log_entry = {
                'user_id': user_id,
                'session_id': session_id or 'unknown',
                'query_summary': f"Tool: {tool_name}",
                'tools_used': [tool_name],
                'response_summary': 'Success' if success else f'Error: {error}',
                'ip_address': ip_address,
                'user_agent': user_agent,
                'created_at': datetime.utcnow().isoformat()
            }
            
            logger.info(f"Tool execution logged: {tool_name} for user {user_id}")
            
            # TODO: Store in database when connection is available
            # For now, just log to console
            if not success:
                logger.error(f"Tool execution failed: {tool_name} - {error}")
                
        except Exception as e:
            logger.error(f"Failed to log tool execution: {e}")
    
    async def log_injection_attempt(
        self,
        user_id: str,
        session_id: str,
        message: str,
        pattern: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> None:
        """
        Log a prompt injection attempt.
        
        Args:
            user_id: ID of the user
            session_id: Session ID
            message: The malicious message
            pattern: The pattern that was matched
            ip_address: User IP address if available
            user_agent: User agent string if available
        """
        try:
            log_entry = {
                'user_id': user_id,
                'session_id': session_id,
                'query_summary': f"INJECTION ATTEMPT: {pattern}",
                'tools_used': [],
                'response_summary': 'Blocked',
                'ip_address': ip_address,
                'user_agent': user_agent,
                'created_at': datetime.utcnow().isoformat()
            }
            
            logger.warning(
                f"Injection attempt logged: user {user_id}, pattern: {pattern}"
            )
            
            # TODO: Store in database when connection is available
            
        except Exception as e:
            logger.error(f"Failed to log injection attempt: {e}")
    
    async def log_unauthorized_access(
        self,
        requested_user_id: str,
        authenticated_user_id: str,
        resource: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> None:
        """
        Log an unauthorized access attempt.
        
        Args:
            requested_user_id: User ID that was requested
            authenticated_user_id: Actual authenticated user ID
            resource: Resource that was accessed
            ip_address: User IP address if available
            user_agent: User agent string if available
        """
        try:
            log_entry = {
                'user_id': authenticated_user_id,
                'session_id': 'unknown',
                'query_summary': f"UNAUTHORIZED ACCESS: Requested {requested_user_id}",
                'tools_used': [],
                'response_summary': f'Blocked access to {resource}',
                'ip_address': ip_address,
                'user_agent': user_agent,
                'created_at': datetime.utcnow().isoformat()
            }
            
            logger.warning(
                f"Unauthorized access logged: user {authenticated_user_id} "
                f"attempted to access {requested_user_id}"
            )
            
            # TODO: Store in database when connection is available
            
        except Exception as e:
            logger.error(f"Failed to log unauthorized access: {e}")
