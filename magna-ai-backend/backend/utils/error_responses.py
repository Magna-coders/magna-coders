"""
Consistent error response formatting for API endpoints.

This module provides utilities for creating standardized error responses
with appropriate status codes and user-friendly messages.
"""

import uuid
from typing import Dict, Any, Optional
from datetime import datetime
from enum import Enum

from .logging import get_logger

logger = get_logger(__name__)


class ErrorCode(str, Enum):
    """Standard error codes for API responses."""
    
    # Authentication errors (401)
    INVALID_TOKEN = "INVALID_TOKEN"
    EXPIRED_TOKEN = "EXPIRED_TOKEN"
    MISSING_TOKEN = "MISSING_TOKEN"
    AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED"
    
    # Authorization errors (403)
    FORBIDDEN = "FORBIDDEN"
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS"
    UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS"
    
    # Rate limiting errors (429)
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS"
    
    # Prompt injection errors (400)
    PROMPT_INJECTION_DETECTED = "PROMPT_INJECTION_DETECTED"
    INVALID_INPUT = "INVALID_INPUT"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    
    # Backend communication errors (503, 504)
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    BACKEND_TIMEOUT = "BACKEND_TIMEOUT"
    BACKEND_ERROR = "BACKEND_ERROR"
    CIRCUIT_BREAKER_OPEN = "CIRCUIT_BREAKER_OPEN"
    
    # Tool execution errors (400, 500)
    TOOL_NOT_FOUND = "TOOL_NOT_FOUND"
    TOOL_EXECUTION_FAILED = "TOOL_EXECUTION_FAILED"
    INVALID_PARAMETERS = "INVALID_PARAMETERS"
    
    # Database errors (500, 503)
    DATABASE_ERROR = "DATABASE_ERROR"
    DATABASE_UNAVAILABLE = "DATABASE_UNAVAILABLE"
    
    # AI generation errors (500, 504)
    AI_GENERATION_FAILED = "AI_GENERATION_FAILED"
    AI_TIMEOUT = "AI_TIMEOUT"
    
    # Generic errors
    INTERNAL_ERROR = "INTERNAL_ERROR"
    UNKNOWN_ERROR = "UNKNOWN_ERROR"


# User-friendly error messages
ERROR_MESSAGES = {
    # Authentication
    ErrorCode.INVALID_TOKEN: "Your session is invalid. Please log in again.",
    ErrorCode.EXPIRED_TOKEN: "Your session has expired. Please log in again.",
    ErrorCode.MISSING_TOKEN: "Authentication required. Please log in.",
    ErrorCode.AUTHENTICATION_FAILED: "Authentication failed. Please check your credentials.",
    
    # Authorization
    ErrorCode.FORBIDDEN: "You don't have permission to access this resource.",
    ErrorCode.INSUFFICIENT_PERMISSIONS: "Your account doesn't have the required permissions.",
    ErrorCode.UNAUTHORIZED_ACCESS: "You are not authorized to access this data.",
    
    # Rate limiting
    ErrorCode.RATE_LIMIT_EXCEEDED: "You've made too many requests. Please try again later.",
    ErrorCode.TOO_MANY_REQUESTS: "Too many requests. Please slow down.",
    
    # Prompt injection
    ErrorCode.PROMPT_INJECTION_DETECTED: "Your message contains invalid content. Please rephrase.",
    ErrorCode.INVALID_INPUT: "The input provided is invalid. Please check and try again.",
    ErrorCode.VALIDATION_ERROR: "The data provided failed validation.",
    
    # Backend communication
    ErrorCode.SERVICE_UNAVAILABLE: "The service is temporarily unavailable. Please try again later.",
    ErrorCode.BACKEND_TIMEOUT: "The request took too long to process. Please try again.",
    ErrorCode.BACKEND_ERROR: "An error occurred while communicating with the backend.",
    ErrorCode.CIRCUIT_BREAKER_OPEN: "The service is temporarily unavailable due to high error rates.",
    
    # Tool execution
    ErrorCode.TOOL_NOT_FOUND: "The requested operation is not available.",
    ErrorCode.TOOL_EXECUTION_FAILED: "Failed to execute the requested operation.",
    ErrorCode.INVALID_PARAMETERS: "The parameters provided are invalid.",
    
    # Database
    ErrorCode.DATABASE_ERROR: "A database error occurred. Please try again.",
    ErrorCode.DATABASE_UNAVAILABLE: "The database is temporarily unavailable.",
    
    # AI generation
    ErrorCode.AI_GENERATION_FAILED: "Failed to generate a response. Please try again.",
    ErrorCode.AI_TIMEOUT: "The AI took too long to respond. Please try again.",
    
    # Generic
    ErrorCode.INTERNAL_ERROR: "An internal error occurred. Please try again.",
    ErrorCode.UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
}


def create_error_response(
    code: ErrorCode,
    message: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    status_code: int = 500,
    include_details: bool = False
) -> Dict[str, Any]:
    """
    Create a standardized error response.
    
    Args:
        code: Error code from ErrorCode enum
        message: Custom error message (uses default if None)
        details: Additional error details (only included in development)
        status_code: HTTP status code
        include_details: Whether to include details (based on environment)
        
    Returns:
        Dictionary with error response
        
    Validates: Requirements 13.3
    """
    request_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    # Use provided message or default
    user_message = message or ERROR_MESSAGES.get(code, ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR])
    
    response = {
        "error": {
            "code": code,
            "message": user_message,
            "timestamp": timestamp,
            "requestId": request_id
        }
    }
    
    # Include details only if specified (development mode)
    if include_details and details:
        response["error"]["details"] = details
    
    # Log the error
    logger.error(
        "error_response_created",
        code=code,
        status_code=status_code,
        request_id=request_id,
        message=user_message,
        details=details
    )
    
    return response


def authentication_error(
    message: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    include_details: bool = False
) -> tuple[Dict[str, Any], int]:
    """
    Create authentication error response (401).
    
    Validates: Requirements 13.4
    """
    return (
        create_error_response(
            code=ErrorCode.AUTHENTICATION_FAILED,
            message=message,
            details=details,
            status_code=401,
            include_details=include_details
        ),
        401
    )


def authorization_error(
    message: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    include_details: bool = False
) -> tuple[Dict[str, Any], int]:
    """
    Create authorization error response (403).
    
    Validates: Requirements 13.4
    """
    return (
        create_error_response(
            code=ErrorCode.FORBIDDEN,
            message=message,
            details=details,
            status_code=403,
            include_details=include_details
        ),
        403
    )


def rate_limit_error(
    retry_after: Optional[int] = None,
    message: Optional[str] = None,
    include_details: bool = False
) -> tuple[Dict[str, Any], int, Dict[str, str]]:
    """
    Create rate limit error response (429).
    
    Args:
        retry_after: Seconds until the user can retry
        message: Custom error message
        include_details: Whether to include details
        
    Returns:
        Tuple of (response_body, status_code, headers)
        
    Validates: Requirements 13.4
    """
    details = {"retry_after": retry_after} if retry_after else None
    
    response = create_error_response(
        code=ErrorCode.RATE_LIMIT_EXCEEDED,
        message=message,
        details=details,
        status_code=429,
        include_details=include_details
    )
    
    headers = {}
    if retry_after:
        headers["Retry-After"] = str(retry_after)
    
    return (response, 429, headers)


def prompt_injection_error(
    message: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    include_details: bool = False
) -> tuple[Dict[str, Any], int]:
    """
    Create prompt injection error response (400).
    
    Validates: Requirements 13.4
    """
    return (
        create_error_response(
            code=ErrorCode.PROMPT_INJECTION_DETECTED,
            message=message,
            details=details,
            status_code=400,
            include_details=include_details
        ),
        400
    )


def backend_communication_error(
    is_timeout: bool = False,
    is_circuit_open: bool = False,
    message: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    include_details: bool = False
) -> tuple[Dict[str, Any], int]:
    """
    Create backend communication error response (503 or 504).
    
    Args:
        is_timeout: Whether this is a timeout error
        is_circuit_open: Whether circuit breaker is open
        message: Custom error message
        details: Additional error details
        include_details: Whether to include details
        
    Returns:
        Tuple of (response_body, status_code)
        
    Validates: Requirements 13.4
    """
    if is_timeout:
        code = ErrorCode.BACKEND_TIMEOUT
        status_code = 504
    elif is_circuit_open:
        code = ErrorCode.CIRCUIT_BREAKER_OPEN
        status_code = 503
    else:
        code = ErrorCode.SERVICE_UNAVAILABLE
        status_code = 503
    
    return (
        create_error_response(
            code=code,
            message=message,
            details=details,
            status_code=status_code,
            include_details=include_details
        ),
        status_code
    )


def tool_execution_error(
    tool_name: str,
    is_not_found: bool = False,
    message: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    include_details: bool = False
) -> tuple[Dict[str, Any], int]:
    """
    Create tool execution error response (400 or 500).
    
    Args:
        tool_name: Name of the tool that failed
        is_not_found: Whether the tool was not found
        message: Custom error message
        details: Additional error details
        include_details: Whether to include details
        
    Returns:
        Tuple of (response_body, status_code)
        
    Validates: Requirements 13.4
    """
    if is_not_found:
        code = ErrorCode.TOOL_NOT_FOUND
        status_code = 400
    else:
        code = ErrorCode.TOOL_EXECUTION_FAILED
        status_code = 500
    
    error_details = {"tool_name": tool_name}
    if details:
        error_details.update(details)
    
    return (
        create_error_response(
            code=code,
            message=message,
            details=error_details,
            status_code=status_code,
            include_details=include_details
        ),
        status_code
    )


def database_error(
    is_unavailable: bool = False,
    message: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    include_details: bool = False
) -> tuple[Dict[str, Any], int]:
    """
    Create database error response (500 or 503).
    
    Args:
        is_unavailable: Whether database is unavailable
        message: Custom error message
        details: Additional error details
        include_details: Whether to include details
        
    Returns:
        Tuple of (response_body, status_code)
        
    Validates: Requirements 13.4
    """
    if is_unavailable:
        code = ErrorCode.DATABASE_UNAVAILABLE
        status_code = 503
    else:
        code = ErrorCode.DATABASE_ERROR
        status_code = 500
    
    return (
        create_error_response(
            code=code,
            message=message,
            details=details,
            status_code=status_code,
            include_details=include_details
        ),
        status_code
    )


def ai_generation_error(
    is_timeout: bool = False,
    message: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    include_details: bool = False
) -> tuple[Dict[str, Any], int]:
    """
    Create AI generation error response (500 or 504).
    
    Args:
        is_timeout: Whether this is a timeout error
        message: Custom error message
        details: Additional error details
        include_details: Whether to include details
        
    Returns:
        Tuple of (response_body, status_code)
        
    Validates: Requirements 13.4
    """
    if is_timeout:
        code = ErrorCode.AI_TIMEOUT
        status_code = 504
    else:
        code = ErrorCode.AI_GENERATION_FAILED
        status_code = 500
    
    return (
        create_error_response(
            code=code,
            message=message,
            details=details,
            status_code=status_code,
            include_details=include_details
        ),
        status_code
    )


def validation_error(
    errors: list[str],
    message: Optional[str] = None,
    include_details: bool = False
) -> tuple[Dict[str, Any], int]:
    """
    Create validation error response (400).
    
    Args:
        errors: List of validation error messages
        message: Custom error message
        include_details: Whether to include details
        
    Returns:
        Tuple of (response_body, status_code)
    """
    details = {"validation_errors": errors}
    
    return (
        create_error_response(
            code=ErrorCode.VALIDATION_ERROR,
            message=message or "Input validation failed",
            details=details,
            status_code=400,
            include_details=include_details
        ),
        400
    )


def internal_error(
    message: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    include_details: bool = False
) -> tuple[Dict[str, Any], int]:
    """
    Create internal server error response (500).
    
    Args:
        message: Custom error message
        details: Additional error details (not exposed to user)
        include_details: Whether to include details
        
    Returns:
        Tuple of (response_body, status_code)
        
    Validates: Requirements 13.5
    """
    return (
        create_error_response(
            code=ErrorCode.INTERNAL_ERROR,
            message=message,
            details=details,
            status_code=500,
            include_details=include_details
        ),
        500
    )
