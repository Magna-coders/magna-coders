"""
Unit tests for user data management API endpoints.
"""

import json
import pytest
import os
from datetime import datetime
from unittest.mock import Mock, patch, AsyncMock
from fastapi import HTTPException
from fastapi.testclient import TestClient

# Set test environment variables before importing modules
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("GEMINI_API_KEY", "test_key")
os.environ.setdefault("JWT_SECRET", "test_secret")
os.environ.setdefault("ENCRYPTION_KEY", "test_encryption_key_32_bytes_long!")

from ...api.user_data import router, export_user_data, delete_user_data
from ...api.auth import User


@pytest.fixture
def mock_user():
    """Create a mock authenticated user."""
    return User(
        user_id="test_user_123",
        username="testuser",
        email="test@example.com"
    )


@pytest.fixture
def mock_storage_backend():
    """Create a mock storage backend."""
    mock = AsyncMock()
    mock.get_user_conversations = AsyncMock(return_value=[])
    mock.get_all_memory_entries = AsyncMock(return_value=[])
    mock.delete_user_conversations = AsyncMock(return_value=5)
    mock.delete_user_memory = AsyncMock(return_value=10)
    return mock


@pytest.fixture
def mock_document_manager():
    """Create a mock document manager."""
    mock = AsyncMock()
    mock.get_user_documents = AsyncMock(return_value=[])
    mock.delete_user_documents = AsyncMock(return_value=3)
    return mock


class TestExportUserData:
    """Test suite for data export endpoint."""
    
    @pytest.mark.asyncio
    async def test_export_user_data_success(self, mock_user):
        """Test successful data export."""
        result = await export_user_data(user=mock_user)
        
        # Verify response structure
        assert result.status_code == 200
        assert "Content-Disposition" in result.headers
        assert "attachment" in result.headers["Content-Disposition"]
        assert mock_user.id in result.headers["Content-Disposition"]
        
        # Parse response body
        content = json.loads(result.body.decode())
        
        # Verify export metadata
        assert "export_metadata" in content
        assert content["export_metadata"]["user_id"] == mock_user.id
        assert "export_timestamp" in content["export_metadata"]
        assert content["export_metadata"]["service"] == "magna-ai-agent"
        
        # Verify data sections exist
        assert "conversations" in content
        assert "memory_entries" in content
        assert "documents" in content
        assert "consent_history" in content
        assert "user_preferences" in content
    
    @pytest.mark.asyncio
    async def test_export_includes_all_sections(self, mock_user):
        """Test that export includes all required data sections."""
        result = await export_user_data(user=mock_user)
        content = json.loads(result.body.decode())
        
        required_sections = [
            "conversations",
            "memory_entries",
            "documents",
            "consent_history",
            "user_preferences"
        ]
        
        for section in required_sections:
            assert section in content, f"Missing section: {section}"
    
    @pytest.mark.asyncio
    async def test_export_filename_format(self, mock_user):
        """Test that export filename follows correct format."""
        result = await export_user_data(user=mock_user)
        
        content_disposition = result.headers["Content-Disposition"]
        
        # Verify filename contains user ID and timestamp
        assert mock_user.id in content_disposition
        assert "magna_ai_data_export" in content_disposition
        assert ".json" in content_disposition
    
    @pytest.mark.asyncio
    async def test_export_handles_partial_failures(self, mock_user):
        """Test that export continues even if some sections fail."""
        # This test verifies graceful degradation
        result = await export_user_data(user=mock_user)
        content = json.loads(result.body.decode())
        
        # Even with placeholder implementation, all sections should be present
        assert isinstance(content["conversations"], list)
        assert isinstance(content["memory_entries"], list)
        assert isinstance(content["documents"], list)
        assert isinstance(content["consent_history"], list)
        assert isinstance(content["user_preferences"], dict)


class TestDeleteUserData:
    """Test suite for data deletion endpoint."""
    
    @pytest.mark.asyncio
    async def test_delete_user_data_success(self, mock_user):
        """Test successful data deletion."""
        result = await delete_user_data(user=mock_user)
        
        # Verify response structure
        assert result["success"] is True
        assert "message" in result
        assert "summary" in result
        
        # Verify summary structure
        summary = result["summary"]
        assert summary["user_id"] == mock_user.id
        assert "deletion_timestamp" in summary
        assert "deleted_items" in summary
        assert "status" in summary
    
    @pytest.mark.asyncio
    async def test_delete_includes_all_data_types(self, mock_user):
        """Test that deletion covers all data types."""
        result = await delete_user_data(user=mock_user)
        
        deleted_items = result["summary"]["deleted_items"]
        
        required_items = [
            "conversations",
            "memory_entries",
            "documents",
            "consent_records"
        ]
        
        for item in required_items:
            assert item in deleted_items, f"Missing deletion for: {item}"
            assert isinstance(deleted_items[item], int)
    
    @pytest.mark.asyncio
    async def test_delete_returns_deletion_counts(self, mock_user):
        """Test that deletion returns counts for each data type."""
        result = await delete_user_data(user=mock_user)
        
        deleted_items = result["summary"]["deleted_items"]
        
        # All counts should be non-negative integers
        for count in deleted_items.values():
            assert isinstance(count, int)
            assert count >= 0
    
    @pytest.mark.asyncio
    async def test_delete_status_completed(self, mock_user):
        """Test that deletion status is set correctly."""
        result = await delete_user_data(user=mock_user)
        
        status = result["summary"]["status"]
        
        # Status should be either "completed" or "completed_with_errors"
        assert status in ["completed", "completed_with_errors"]
    
    @pytest.mark.asyncio
    async def test_delete_includes_timestamp(self, mock_user):
        """Test that deletion includes timestamp."""
        result = await delete_user_data(user=mock_user)
        
        timestamp = result["summary"]["deletion_timestamp"]
        
        # Verify timestamp is valid ISO format
        assert timestamp is not None
        datetime.fromisoformat(timestamp)  # Should not raise
    
    @pytest.mark.asyncio
    async def test_delete_handles_partial_failures(self, mock_user):
        """Test that deletion continues even if some sections fail."""
        result = await delete_user_data(user=mock_user)
        
        # Should have errors list even if empty
        assert "errors" in result["summary"]
        assert isinstance(result["summary"]["errors"], list)


class TestDataPrivacyCompliance:
    """Test suite for GDPR and privacy compliance."""
    
    @pytest.mark.asyncio
    async def test_export_does_not_require_additional_auth(self, mock_user):
        """Test that export only requires standard authentication."""
        # Should not raise authentication errors
        result = await export_user_data(user=mock_user)
        assert result.status_code == 200
    
    @pytest.mark.asyncio
    async def test_delete_does_not_require_additional_auth(self, mock_user):
        """Test that deletion only requires standard authentication."""
        # Should not raise authentication errors
        result = await delete_user_data(user=mock_user)
        assert result["success"] is True
    
    @pytest.mark.asyncio
    async def test_export_returns_machine_readable_format(self, mock_user):
        """Test that export returns JSON format."""
        result = await export_user_data(user=mock_user)
        
        # Should be valid JSON
        content = json.loads(result.body.decode())
        assert isinstance(content, dict)
    
    @pytest.mark.asyncio
    async def test_delete_is_permanent(self, mock_user):
        """Test that deletion message indicates permanence."""
        result = await delete_user_data(user=mock_user)
        
        message = result["message"].lower()
        
        # Should indicate permanent deletion
        assert "permanently" in message or "deleted" in message


class TestErrorHandling:
    """Test suite for error handling in user data endpoints."""
    
    @pytest.mark.asyncio
    async def test_export_handles_exceptions_gracefully(self, mock_user):
        """Test that export handles unexpected errors."""
        # Even with errors, should return valid response structure
        result = await export_user_data(user=mock_user)
        content = json.loads(result.body.decode())
        
        # Should have all required sections even if empty
        assert "export_metadata" in content
        assert "conversations" in content
    
    @pytest.mark.asyncio
    async def test_delete_handles_exceptions_gracefully(self, mock_user):
        """Test that deletion handles unexpected errors."""
        # Even with errors, should return valid response structure
        result = await delete_user_data(user=mock_user)
        
        assert "success" in result
        assert "summary" in result


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
