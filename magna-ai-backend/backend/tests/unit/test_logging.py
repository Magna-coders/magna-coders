"""
Unit tests for structured logging.
"""

import pytest
from unittest.mock import AsyncMock, Mock, patch
from datetime import datetime

from ...utils.logging import (
    ErrorLog,
    ErrorSeverity,
    AlertService,
    setup_logging,
    get_logger,
    setup_alert_service,
    get_alert_service,
    log_error,
    determine_severity
)
from ...utils.exceptions import (
    AuthenticationError,
    ProviderUnavailableError,
    ConsentNotProvidedError,
    ValidationError
)


class TestErrorLog:
    """Test ErrorLog dataclass."""
    
    def test_error_log_creation(self):
        """Test creating an error log entry."""
        error_log = ErrorLog(
            timestamp="2024-01-01T00:00:00",
            error_type="ValueError",
            error_message="Invalid value",
            severity=ErrorSeverity.ERROR,
            request_id="req123",
            user_id="user456",
            conversation_id="conv789",
            stack_trace="Traceback...",
            context={"action": "test"}
        )
        
        assert error_log.error_type == "ValueError"
        assert error_log.severity == ErrorSeverity.ERROR
        assert error_log.user_id == "user456"
    
    def test_error_log_to_dict(self):
        """Test converting error log to dictionary."""
        error_log = ErrorLog(
            timestamp="2024-01-01T00:00:00",
            error_type="ValueError",
            error_message="Invalid value",
            severity=ErrorSeverity.ERROR,
            request_id="req123",
            context={}
        )
        
        log_dict = error_log.to_dict()
        
        assert isinstance(log_dict, dict)
        assert log_dict["error_type"] == "ValueError"
        assert log_dict["severity"] == ErrorSeverity.ERROR


class TestAlertService:
    """Test AlertService."""
    
    @pytest.mark.asyncio
    async def test_alert_service_enabled(self):
        """Test alert service when enabled."""
        service = AlertService(enabled=True)
        error_log = ErrorLog(
            timestamp="2024-01-01T00:00:00",
            error_type="CriticalError",
            error_message="System failure",
            severity=ErrorSeverity.CRITICAL,
            request_id="req123",
            context={}
        )
        
        # Should not raise exception
        await service.send_alert(error_log)
    
    @pytest.mark.asyncio
    async def test_alert_service_disabled(self):
        """Test alert service when disabled."""
        service = AlertService(enabled=False)
        error_log = ErrorLog(
            timestamp="2024-01-01T00:00:00",
            error_type="CriticalError",
            error_message="System failure",
            severity=ErrorSeverity.CRITICAL,
            request_id="req123",
            context={}
        )
        
        # Should return immediately without sending
        await service.send_alert(error_log)


class TestLoggingSetup:
    """Test logging setup functions."""
    
    def test_setup_logging_json_format(self):
        """Test setting up logging with JSON format."""
        # Should not raise exception
        setup_logging(log_level="INFO", log_format="json")
    
    def test_setup_logging_console_format(self):
        """Test setting up logging with console format."""
        # Should not raise exception
        setup_logging(log_level="DEBUG", log_format="console")
    
    def test_get_logger(self):
        """Test getting a logger instance."""
        logger = get_logger("test_module")
        
        assert logger is not None
    
    def test_setup_alert_service(self):
        """Test setting up alert service."""
        service = setup_alert_service(enabled=True)
        
        assert isinstance(service, AlertService)
        assert service.enabled is True
    
    def test_get_alert_service(self):
        """Test getting alert service instance."""
        service = get_alert_service()
        
        assert isinstance(service, AlertService)


class TestLogError:
    """Test log_error function."""
    
    @pytest.mark.asyncio
    async def test_log_error_with_error_severity(self):
        """Test logging an error with ERROR severity."""
        error = ValueError("Invalid input")
        context = {
            "request_id": "req123",
            "user_id": "user456",
            "action": "test_action"
        }
        
        error_log = await log_error(
            error=error,
            context=context,
            severity=ErrorSeverity.ERROR
        )
        
        assert error_log.error_type == "ValueError"
        assert error_log.error_message == "Invalid input"
        assert error_log.severity == ErrorSeverity.ERROR
        assert error_log.user_id == "user456"
    
    @pytest.mark.asyncio
    async def test_log_error_with_critical_severity(self):
        """Test logging an error with CRITICAL severity sends alert."""
        error = Exception("Critical failure")
        context = {
            "request_id": "req123",
            "action": "critical_action"
        }
        
        # Test that critical errors are logged with correct severity
        error_log = await log_error(
            error=error,
            context=context,
            severity=ErrorSeverity.CRITICAL
        )
        
        assert error_log.severity == ErrorSeverity.CRITICAL
        assert error_log.error_type == "Exception"
        assert error_log.error_message == "Critical failure"
    
    @pytest.mark.asyncio
    async def test_log_error_with_stack_trace(self):
        """Test logging an error with stack trace."""
        error = RuntimeError("Runtime error")
        context = {"request_id": "req123"}
        stack_trace = "Traceback (most recent call last):\n  File..."
        
        error_log = await log_error(
            error=error,
            context=context,
            severity=ErrorSeverity.ERROR,
            stack_trace=stack_trace
        )
        
        assert error_log.stack_trace == stack_trace


class TestDetermineSeverity:
    """Test determine_severity function."""
    
    def test_determine_severity_authentication_error(self):
        """Test that authentication error is CRITICAL."""
        error = AuthenticationError("Auth failed")
        
        severity = determine_severity(error)
        
        assert severity == ErrorSeverity.CRITICAL
    
    def test_determine_severity_provider_unavailable(self):
        """Test that provider unavailable is CRITICAL."""
        error = ProviderUnavailableError("Provider down")
        
        severity = determine_severity(error)
        
        assert severity == ErrorSeverity.CRITICAL
    
    def test_determine_severity_consent_error(self):
        """Test that consent error is ERROR."""
        error = ConsentNotProvidedError("Consent required")
        
        severity = determine_severity(error)
        
        assert severity == ErrorSeverity.ERROR
    
    def test_determine_severity_validation_error(self):
        """Test that validation error is WARNING."""
        error = ValidationError("Invalid input", errors=["field required"])
        
        severity = determine_severity(error)
        
        assert severity == ErrorSeverity.WARNING
    
    def test_determine_severity_unknown_error(self):
        """Test that unknown error defaults to ERROR."""
        error = Exception("Unknown error")
        
        severity = determine_severity(error)
        
        assert severity == ErrorSeverity.ERROR


class TestErrorSeverity:
    """Test ErrorSeverity enum."""
    
    def test_error_severity_values(self):
        """Test that all severity levels are defined."""
        assert ErrorSeverity.DEBUG == "DEBUG"
        assert ErrorSeverity.INFO == "INFO"
        assert ErrorSeverity.WARNING == "WARNING"
        assert ErrorSeverity.ERROR == "ERROR"
        assert ErrorSeverity.CRITICAL == "CRITICAL"
    
    def test_error_severity_comparison(self):
        """Test comparing severity levels."""
        assert ErrorSeverity.CRITICAL != ErrorSeverity.ERROR
        assert ErrorSeverity.WARNING != ErrorSeverity.INFO
