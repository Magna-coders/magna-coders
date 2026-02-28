"""
Unit tests for error handling middleware.
"""

import pytest
from unittest.mock import AsyncMock, Mock, patch
from datetime import datetime

from ...utils.exceptions import (
    RateLimitError, TimeoutError, AuthenticationError,
    ToolNotFoundError, InvalidParametersError, ToolTimeoutError, ExternalAPIError,
    StorageQuotaExceeded, CorruptedMemoryEntry, EmbeddingGenerationError, SyncFailure,
    FileTooLargeError, UnsupportedFormatError, UploadFailureError, ConsentNotProvidedError
)
from ...utils.error_handlers import (
    handle_llm_error,
    handle_tool_error,
    handle_memory_error,
    handle_document_error,
    validate_input,
    handle_generic_error
)
from ...utils.logging import ErrorSeverity


class TestLLMErrorHandling:
    """Test LLM error handling."""
    
    @pytest.mark.asyncio
    async def test_handle_rate_limit_error_with_fallback(self):
        """Test that rate limit error triggers fallback provider."""
        error = RateLimitError("Rate limit exceeded")
        fallback_func = AsyncMock(return_value="fallback response")
        
        result = await handle_llm_error(
            error=error,
            provider="gemini",
            fallback_provider_func=fallback_func
        )
        
        assert result == "fallback response"
        fallback_func.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_handle_timeout_error_with_retry(self):
        """Test that timeout error triggers retry logic."""
        error = TimeoutError("Request timed out")
        retry_func = AsyncMock(return_value="retry success")
        
        result = await handle_llm_error(
            error=error,
            provider="gemini",
            retry_func=retry_func,
            max_retries=3
        )
        
        assert result == "retry success"
        retry_func.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_handle_authentication_error(self):
        """Test that authentication error is logged as critical."""
        error = AuthenticationError("Invalid API key")
        fallback_func = AsyncMock(return_value="fallback response")
        
        result = await handle_llm_error(
            error=error,
            provider="gemini",
            fallback_provider_func=fallback_func
        )
        
        assert result == "fallback response"
        fallback_func.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_handle_llm_error_no_fallback(self):
        """Test LLM error handling when no fallback is available."""
        error = RateLimitError("Rate limit exceeded")
        
        result = await handle_llm_error(
            error=error,
            provider="gemini",
            fallback_provider_func=None
        )
        
        assert result is None


class TestToolErrorHandling:
    """Test tool error handling."""
    
    @pytest.mark.asyncio
    async def test_handle_tool_not_found_error(self):
        """Test that tool not found error returns appropriate message."""
        error = ToolNotFoundError("Tool 'unknown' not found")
        
        result = await handle_tool_error(
            error=error,
            tool_name="unknown",
            parameters={}
        )
        
        assert result["success"] is False
        assert "not available" in result["error"]
        assert "suggestion" in result
    
    @pytest.mark.asyncio
    async def test_handle_invalid_parameters_error(self):
        """Test that invalid parameters error returns clear message."""
        error = InvalidParametersError("Missing required parameter 'query'")
        
        result = await handle_tool_error(
            error=error,
            tool_name="web_search",
            parameters={}
        )
        
        assert result["success"] is False
        assert "Invalid parameters" in result["error"]
        assert "suggestion" in result
    
    @pytest.mark.asyncio
    async def test_handle_tool_timeout_with_retry(self):
        """Test that tool timeout triggers retry logic."""
        error = ToolTimeoutError("Tool execution timed out")
        retry_func = AsyncMock(return_value={"success": True, "data": "result"})
        
        result = await handle_tool_error(
            error=error,
            tool_name="web_search",
            parameters={"query": "test"},
            retry_func=retry_func,
            max_retries=3
        )
        
        assert result["success"] is True
        retry_func.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_handle_external_api_error_transient(self):
        """Test that transient API errors are retried."""
        error = ExternalAPIError("Service unavailable", is_transient=True)
        retry_func = AsyncMock(return_value={"success": True, "data": "result"})
        
        result = await handle_tool_error(
            error=error,
            tool_name="profile_api",
            parameters={"user_id": "123"},
            retry_func=retry_func,
            max_retries=3
        )
        
        assert result["success"] is True
        retry_func.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_handle_external_api_error_non_transient(self):
        """Test that non-transient API errors are not retried."""
        error = ExternalAPIError("Invalid credentials", is_transient=False)
        retry_func = AsyncMock()
        
        result = await handle_tool_error(
            error=error,
            tool_name="profile_api",
            parameters={"user_id": "123"},
            retry_func=retry_func,
            max_retries=3
        )
        
        assert result["success"] is False
        retry_func.assert_not_called()


class TestMemoryErrorHandling:
    """Test memory error handling."""
    
    @pytest.mark.asyncio
    async def test_handle_storage_quota_exceeded(self):
        """Test that storage quota exceeded triggers pruning."""
        error = StorageQuotaExceeded("Storage quota exceeded", user_id="user123")
        memory_system = Mock()
        memory_system.prune_memory = AsyncMock(return_value=50)
        
        await handle_memory_error(error, memory_system)
        
        memory_system.prune_memory.assert_called_once_with(
            user_id="user123",
            target_size_mb=4.0
        )
    
    @pytest.mark.asyncio
    async def test_handle_corrupted_memory_entry(self):
        """Test that corrupted entry is removed."""
        error = CorruptedMemoryEntry("Entry corrupted", entry_id="entry123")
        memory_system = Mock()
        memory_system.remove_entry = AsyncMock()
        
        await handle_memory_error(error, memory_system)
        
        memory_system.remove_entry.assert_called_once_with("entry123")
    
    @pytest.mark.asyncio
    async def test_handle_embedding_generation_error(self):
        """Test that embedding failure stores without embedding."""
        interaction = {"user_message": "test", "agent_response": "response"}
        error = EmbeddingGenerationError(
            "Embedding failed",
            user_id="user123",
            interaction=interaction
        )
        memory_system = Mock()
        memory_system.store_without_embedding = AsyncMock()
        
        await handle_memory_error(error, memory_system)
        
        memory_system.store_without_embedding.assert_called_once_with(
            user_id="user123",
            interaction=interaction
        )
    
    @pytest.mark.asyncio
    async def test_handle_sync_failure(self):
        """Test that sync failure queues for retry."""
        data = {"memory": "data"}
        error = SyncFailure("Sync failed", user_id="user123", data=data)
        memory_system = Mock()
        memory_system.queue_for_sync = AsyncMock()
        
        await handle_memory_error(error, memory_system)
        
        memory_system.queue_for_sync.assert_called_once_with(
            user_id="user123",
            data=data
        )


class TestDocumentErrorHandling:
    """Test document error handling."""
    
    @pytest.mark.asyncio
    async def test_handle_file_too_large_error(self):
        """Test that file too large error returns clear message."""
        error = FileTooLargeError("File too large", size_mb=15.5, limit_mb=10.0)
        
        result = await handle_document_error(error)
        
        assert result["success"] is False
        assert "15.5" in result["error"]
        assert "10" in result["error"]
        assert "compress" in result["suggestion"].lower()
    
    @pytest.mark.asyncio
    async def test_handle_unsupported_format_error(self):
        """Test that unsupported format error returns clear message."""
        error = UnsupportedFormatError("Unsupported format", format="exe")
        
        result = await handle_document_error(error)
        
        assert result["success"] is False
        assert "exe" in result["error"]
        assert "PDF" in result["suggestion"] or "DOCX" in result["suggestion"]
    
    @pytest.mark.asyncio
    async def test_handle_upload_failure_with_retry(self):
        """Test that upload failure triggers retry logic."""
        error = UploadFailureError("Upload failed", file_data=b"data")
        retry_func = AsyncMock(return_value={"success": True, "url": "s3://..."})
        
        result = await handle_document_error(
            error=error,
            retry_func=retry_func,
            max_retries=3
        )
        
        assert result["success"] is True
        retry_func.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_handle_consent_not_provided_error(self):
        """Test that consent error returns appropriate message."""
        error = ConsentNotProvidedError("Consent required")
        
        result = await handle_document_error(error)
        
        assert result["success"] is False
        assert "consent" in result["error"].lower()
        assert "approve" in result["suggestion"].lower()


class TestInputValidation:
    """Test input validation."""
    
    def test_validate_input_success(self):
        """Test successful input validation."""
        data = {
            "user_id": "123",
            "message": "Hello",
            "conversation_id": "conv456"
        }
        required_fields = ["user_id", "message"]
        
        result = validate_input(data, required_fields)
        
        assert result["valid"] is True
        assert len(result["errors"]) == 0
    
    def test_validate_input_missing_field(self):
        """Test validation failure for missing field."""
        data = {
            "message": "Hello"
        }
        required_fields = ["user_id", "message"]
        
        result = validate_input(data, required_fields)
        
        assert result["valid"] is False
        assert any("user_id" in error for error in result["errors"])
    
    def test_validate_input_empty_string(self):
        """Test validation failure for empty string."""
        data = {
            "user_id": "123",
            "message": "   "
        }
        required_fields = ["user_id", "message"]
        
        result = validate_input(data, required_fields)
        
        assert result["valid"] is False
        assert any("message" in error for error in result["errors"])
    
    def test_validate_input_none_value(self):
        """Test validation failure for None value."""
        data = {
            "user_id": None,
            "message": "Hello"
        }
        required_fields = ["user_id", "message"]
        
        result = validate_input(data, required_fields)
        
        assert result["valid"] is False
        assert any("user_id" in error for error in result["errors"])


class TestGenericErrorHandling:
    """Test generic error handling."""
    
    @pytest.mark.asyncio
    async def test_handle_generic_error(self):
        """Test generic error handling."""
        error = Exception("Something went wrong")
        context = {
            "user_id": "user123",
            "request_id": "req456",
            "action": "test_action"
        }
        
        result = await handle_generic_error(error, context, ErrorSeverity.ERROR)
        
        assert result["success"] is False
        assert result["error"] == "Something went wrong"
        assert result["error_type"] == "Exception"
        assert "timestamp" in result
        assert "suggestion" in result
    
    @pytest.mark.asyncio
    async def test_handle_generic_error_critical(self):
        """Test generic error handling with critical severity."""
        error = Exception("Critical failure")
        context = {"request_id": "req456"}
        
        result = await handle_generic_error(error, context, ErrorSeverity.CRITICAL)
        
        assert result["success"] is False
        assert result["error_type"] == "Exception"
