"""
Logging utilities for Magna AI Agent.

This module provides structured logging with error tracking, severity levels,
and alert functionality for critical errors.
"""

import logging
import sys
from typing import Optional, Dict, Any, List
from datetime import datetime
from dataclasses import dataclass, field, asdict
from enum import Enum
import structlog


class ErrorSeverity(str, Enum):
    """Error severity levels."""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


@dataclass
class ErrorLog:
    """
    Structured error log entry with context.
    
    Validates: Requirements 15.4
    """
    timestamp: str
    error_type: str
    error_message: str
    severity: ErrorSeverity
    request_id: str
    user_id: Optional[str] = None
    conversation_id: Optional[str] = None
    stack_trace: Optional[str] = None
    context: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert error log to dictionary."""
        return asdict(self)


class AlertService:
    """
    Service for sending alerts on critical errors.
    
    In production, this would integrate with services like:
    - PagerDuty
    - Slack
    - Email notifications
    - SMS alerts
    """
    
    def __init__(self, enabled: bool = True):
        """
        Initialize alert service.
        
        Args:
            enabled: Whether alerts are enabled
        """
        self.enabled = enabled
        self.logger = get_logger(__name__)
    
    async def send_alert(self, error_log: ErrorLog) -> None:
        """
        Send alert for critical error.
        
        Args:
            error_log: Error log entry to alert on
        """
        if not self.enabled:
            return
        
        # Log the alert
        self.logger.critical(
            "critical_error_alert",
            error_type=error_log.error_type,
            message=error_log.error_message,
            user_id=error_log.user_id,
            conversation_id=error_log.conversation_id,
            context=error_log.context
        )
        
        # In production, send to external alerting service
        # Example integrations:
        # - await self._send_to_pagerduty(error_log)
        # - await self._send_to_slack(error_log)
        # - await self._send_email_alert(error_log)
    
    async def _send_to_slack(self, error_log: ErrorLog) -> None:
        """Send alert to Slack channel (placeholder)."""
        pass
    
    async def _send_to_pagerduty(self, error_log: ErrorLog) -> None:
        """Send alert to PagerDuty (placeholder)."""
        pass
    
    async def _send_email_alert(self, error_log: ErrorLog) -> None:
        """Send email alert (placeholder)."""
        pass


# Global alert service instance
_alert_service: Optional[AlertService] = None


def setup_logging(log_level: str = "INFO", log_format: str = "json") -> None:
    """
    Configure structured logging for the application.
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_format: Format type ("json" or "console")
    """
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer() if log_format == "json" 
            else structlog.dev.ConsoleRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )
    
    # Configure standard logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, log_level.upper()),
    )


def get_logger(name: Optional[str] = None) -> structlog.BoundLogger:
    """
    Get a structured logger instance.
    
    Args:
        name: Logger name (typically __name__)
        
    Returns:
        Configured structlog logger
    """
    return structlog.get_logger(name)


def setup_alert_service(enabled: bool = True) -> AlertService:
    """
    Setup global alert service.
    
    Args:
        enabled: Whether alerts are enabled
        
    Returns:
        Configured alert service
    """
    global _alert_service
    _alert_service = AlertService(enabled=enabled)
    return _alert_service


def get_alert_service() -> AlertService:
    """
    Get global alert service instance.
    
    Returns:
        Alert service instance
    """
    global _alert_service
    if _alert_service is None:
        _alert_service = AlertService(enabled=True)
    return _alert_service


async def log_error(
    error: Exception,
    context: Dict[str, Any],
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    stack_trace: Optional[str] = None
) -> ErrorLog:
    """
    Log error with structured context and send alerts for critical errors.
    
    Args:
        error: The exception that occurred
        context: Context information about the error
        severity: Error severity level
        stack_trace: Optional stack trace string
        
    Returns:
        ErrorLog entry
        
    Validates: Requirements 15.4
    """
    logger = get_logger(__name__)
    
    # Create error log entry
    error_log = ErrorLog(
        timestamp=datetime.utcnow().isoformat(),
        error_type=type(error).__name__,
        error_message=str(error),
        severity=severity,
        request_id=context.get('request_id', 'unknown'),
        user_id=context.get('user_id'),
        conversation_id=context.get('conversation_id'),
        stack_trace=stack_trace,
        context=context
    )
    
    # Log based on severity
    log_data = error_log.to_dict()
    
    if severity == ErrorSeverity.CRITICAL:
        logger.critical("critical_error", **log_data)
        # Send alert for critical errors
        alert_service = get_alert_service()
        await alert_service.send_alert(error_log)
    elif severity == ErrorSeverity.ERROR:
        logger.error("error_occurred", **log_data)
    elif severity == ErrorSeverity.WARNING:
        logger.warning("warning", **log_data)
    elif severity == ErrorSeverity.INFO:
        logger.info("info", **log_data)
    else:
        logger.debug("debug", **log_data)
    
    return error_log


def determine_severity(error: Exception) -> ErrorSeverity:
    """
    Determine error severity based on error type.
    
    Args:
        error: The exception to evaluate
        
    Returns:
        Appropriate severity level
    """
    from .exceptions import (
        AuthenticationError, ProviderUnavailableError,
        ConsentNotProvidedError, ValidationError
    )
    
    # Critical errors that require immediate attention
    if isinstance(error, (AuthenticationError, ProviderUnavailableError)):
        return ErrorSeverity.CRITICAL
    
    # Security-related errors
    if isinstance(error, ConsentNotProvidedError):
        return ErrorSeverity.ERROR
    
    # User input errors
    if isinstance(error, ValidationError):
        return ErrorSeverity.WARNING
    
    # Default to ERROR for unknown exceptions
    return ErrorSeverity.ERROR
