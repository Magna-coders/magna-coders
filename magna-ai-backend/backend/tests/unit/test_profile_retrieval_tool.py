"""Unit tests for ProfileRetrievalTool.

Tests profile retrieval functionality including successful retrieval,
error handling, authentication, and data formatting.
"""

import pytest
from unittest.mock import AsyncMock, Mock, patch
import httpx

from ...tools.profile_retrieval_tool import ProfileRetrievalTool
from ...tools.base import ToolResult, ToolValidationError


@pytest.fixture
def profile_tool():
    """Create ProfileRetrievalTool instance for testing."""
    return ProfileRetrievalTool(backend_url="http://test-backend:5000")


@pytest.fixture
def sample_user_id():
    """Sample valid UUID for testing."""
    return "550e8400-e29b-41d4-a716-446655440000"


@pytest.fixture
def sample_profile_response():
    """Sample successful profile response from backend."""
    return {
        "success": True,
        "data": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "username": "john_doe",
            "email": "john@example.com",
            "location": "Nairobi, Kenya",
            "bio": "Full-stack developer passionate about AI",
            "availability": "available",
            "profile_complete_percentage": 85,
            "avatar_url": "https://example.com/avatar.jpg",
            "github_url": "https://github.com/johndoe",
            "linkedin_url": "https://linkedin.com/in/johndoe",
            "twitter_url": "https://twitter.com/johndoe",
            "website_url": "https://johndoe.dev",
            "whatsapp_url": None,
            "skills": [
                {"name": "Python"},
                {"name": "JavaScript"},
                {"name": "React"}
            ],
            "categories": [
                {"name": "Web Development"},
                {"name": "AI/ML"}
            ],
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-15T12:00:00Z"
        }
    }


class TestProfileRetrievalToolMetadata:
    """Test tool metadata properties."""
    
    def test_tool_name(self, profile_tool):
        """Test tool name is correct."""
        assert profile_tool.name == "profile_retrieval"
    
    def test_tool_description(self, profile_tool):
        """Test tool has meaningful description."""
        description = profile_tool.description
        assert len(description) > 50
        assert "profile" in description.lower()
        assert "user" in description.lower()
    
    def test_parameters_schema(self, profile_tool):
        """Test parameters schema is valid."""
        schema = profile_tool.parameters_schema
        
        assert schema["type"] == "object"
        assert "user_id" in schema["properties"]
        assert "auth_token" in schema["properties"]
        assert "user_id" in schema["required"]
        assert schema["properties"]["user_id"]["type"] == "string"
        assert schema["properties"]["user_id"]["format"] == "uuid"


class TestProfileRetrievalExecution:
    """Test profile retrieval execution."""
    
    @pytest.mark.asyncio
    async def test_successful_profile_retrieval(
        self,
        profile_tool,
        sample_user_id,
        sample_profile_response
    ):
        """Test successful profile retrieval returns formatted data."""
        # Mock HTTP response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = sample_profile_response
        
        with patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                return_value=mock_response
            )
            
            result = await profile_tool.execute(user_id=sample_user_id)
        
        # Verify result
        assert result.success is True
        assert result.data is not None
        assert result.error is None
        
        # Verify formatted data
        profile = result.data
        assert profile["user_id"] == sample_user_id
        assert profile["username"] == "john_doe"
        assert profile["email"] == "john@example.com"
        assert profile["location"] == "Nairobi, Kenya"
        assert profile["bio"] == "Full-stack developer passionate about AI"
        assert profile["availability"] == "available"
        assert profile["profile_complete_percentage"] == 85
        
        # Verify skills extraction
        assert len(profile["skills"]) == 3
        assert "Python" in profile["skills"]
        assert "JavaScript" in profile["skills"]
        assert "React" in profile["skills"]
        
        # Verify categories extraction
        assert len(profile["categories"]) == 2
        assert "Web Development" in profile["categories"]
        assert "AI/ML" in profile["categories"]
        
        # Verify social links formatting
        assert "github" in profile["social_links"]
        assert "linkedin" in profile["social_links"]
        assert "twitter" in profile["social_links"]
        assert "website" in profile["social_links"]
        assert "whatsapp" not in profile["social_links"]  # None value excluded
    
    @pytest.mark.asyncio
    async def test_profile_retrieval_with_auth_token(
        self,
        profile_tool,
        sample_user_id,
        sample_profile_response
    ):
        """Test profile retrieval includes auth token in headers."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = sample_profile_response
        
        auth_token = "test_jwt_token_12345"
        
        with patch("httpx.AsyncClient") as mock_client:
            mock_get = AsyncMock(return_value=mock_response)
            mock_client.return_value.__aenter__.return_value.get = mock_get
            
            result = await profile_tool.execute(
                user_id=sample_user_id,
                auth_token=auth_token
            )
        
        # Verify auth header was included
        call_args = mock_get.call_args
        headers = call_args[1]["headers"]
        assert "Authorization" in headers
        assert headers["Authorization"] == f"Bearer {auth_token}"
        
        assert result.success is True


class TestProfileRetrievalValidation:
    """Test input validation."""
    
    @pytest.mark.asyncio
    async def test_empty_user_id_raises_error(self, profile_tool):
        """Test empty user_id raises ToolValidationError."""
        with pytest.raises(ToolValidationError) as exc_info:
            await profile_tool.execute(user_id="")
        
        assert "cannot be empty" in str(exc_info.value).lower()
    
    @pytest.mark.asyncio
    async def test_whitespace_user_id_raises_error(self, profile_tool):
        """Test whitespace-only user_id raises ToolValidationError."""
        with pytest.raises(ToolValidationError) as exc_info:
            await profile_tool.execute(user_id="   ")
        
        assert "cannot be empty" in str(exc_info.value).lower()
    
    @pytest.mark.asyncio
    async def test_invalid_uuid_format_raises_error(self, profile_tool):
        """Test invalid UUID format raises ToolValidationError."""
        with pytest.raises(ToolValidationError) as exc_info:
            await profile_tool.execute(user_id="not-a-valid-uuid")
        
        assert "valid uuid format" in str(exc_info.value).lower()
    
    @pytest.mark.asyncio
    async def test_short_uuid_raises_error(self, profile_tool):
        """Test short UUID raises ToolValidationError."""
        with pytest.raises(ToolValidationError) as exc_info:
            await profile_tool.execute(user_id="123-456-789")
        
        assert "valid uuid format" in str(exc_info.value).lower()


class TestProfileRetrievalErrorHandling:
    """Test error handling for various failure scenarios."""
    
    @pytest.mark.asyncio
    async def test_user_not_found_returns_error(self, profile_tool, sample_user_id):
        """Test 404 response returns appropriate error."""
        mock_response = Mock()
        mock_response.status_code = 404
        mock_response.text = "User not found"
        
        with patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                return_value=mock_response
            )
            
            result = await profile_tool.execute(user_id=sample_user_id)
        
        assert result.success is False
        assert "not found" in result.error.lower()
        assert result.metadata["status_code"] == 404
        assert result.metadata["user_id"] == sample_user_id
    
    @pytest.mark.asyncio
    async def test_unauthorized_returns_error(self, profile_tool, sample_user_id):
        """Test 401 response returns authentication error."""
        mock_response = Mock()
        mock_response.status_code = 401
        mock_response.text = "Unauthorized"
        
        with patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                return_value=mock_response
            )
            
            result = await profile_tool.execute(user_id=sample_user_id)
        
        assert result.success is False
        assert "authentication failed" in result.error.lower()
        assert result.metadata["status_code"] == 401
        assert result.metadata["requires_auth"] is True
    
    @pytest.mark.asyncio
    async def test_service_unavailable_returns_error(self, profile_tool, sample_user_id):
        """Test 501 response (service disabled) returns appropriate error."""
        mock_response = Mock()
        mock_response.status_code = 501
        mock_response.text = "Auth endpoints temporarily disabled"
        
        with patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                return_value=mock_response
            )
            
            result = await profile_tool.execute(user_id=sample_user_id)
        
        assert result.success is False
        assert "temporarily unavailable" in result.error.lower()
        assert result.metadata["status_code"] == 501
        assert result.metadata["service_unavailable"] is True
    
    @pytest.mark.asyncio
    async def test_timeout_returns_error(self, profile_tool, sample_user_id):
        """Test request timeout returns appropriate error."""
        with patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                side_effect=httpx.TimeoutException("Request timed out")
            )
            
            result = await profile_tool.execute(user_id=sample_user_id)
        
        assert result.success is False
        assert "timed out" in result.error.lower()
        assert "timeout_seconds" in result.metadata
    
    @pytest.mark.asyncio
    async def test_connection_error_returns_error(self, profile_tool, sample_user_id):
        """Test connection error returns appropriate error."""
        with patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                side_effect=httpx.ConnectError("Connection refused")
            )
            
            result = await profile_tool.execute(user_id=sample_user_id)
        
        assert result.success is False
        assert "failed to connect" in result.error.lower()
        assert "backend_url" in result.metadata
    
    @pytest.mark.asyncio
    async def test_empty_profile_data_returns_error(self, profile_tool, sample_user_id):
        """Test empty profile data in response returns error."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "success": True,
            "data": {}  # Empty data
        }
        
        with patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                return_value=mock_response
            )
            
            result = await profile_tool.execute(user_id=sample_user_id)
        
        assert result.success is False
        assert "empty profile data" in result.error.lower()
    
    @pytest.mark.asyncio
    async def test_unsuccessful_backend_response_returns_error(
        self,
        profile_tool,
        sample_user_id
    ):
        """Test backend response with success=false returns error."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "success": False,
            "message": "Profile retrieval failed"
        }
        
        with patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                return_value=mock_response
            )
            
            result = await profile_tool.execute(user_id=sample_user_id)
        
        assert result.success is False
        assert "unsuccessful response" in result.error.lower()
        assert "Profile retrieval failed" in result.error


class TestProfileDataFormatting:
    """Test profile data formatting logic."""
    
    @pytest.mark.asyncio
    async def test_format_profile_with_minimal_data(self, profile_tool, sample_user_id):
        """Test formatting profile with minimal data."""
        minimal_response = {
            "success": True,
            "data": {
                "id": sample_user_id,
                "username": "minimal_user",
                "email": "minimal@example.com"
            }
        }
        
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = minimal_response
        
        with patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                return_value=mock_response
            )
            
            result = await profile_tool.execute(user_id=sample_user_id)
        
        assert result.success is True
        profile = result.data
        
        # Verify required fields
        assert profile["user_id"] == sample_user_id
        assert profile["username"] == "minimal_user"
        assert profile["email"] == "minimal@example.com"
        
        # Verify default values for missing fields
        assert profile["location"] == ""
        assert profile["bio"] == ""
        assert profile["availability"] == "available"
        assert profile["profile_complete_percentage"] == 0
        assert profile["skills"] == []
        assert profile["categories"] == []
        assert profile["social_links"] == {}
    
    @pytest.mark.asyncio
    async def test_format_profile_with_string_skills(self, profile_tool, sample_user_id):
        """Test formatting profile when skills are strings instead of objects."""
        response_with_string_skills = {
            "success": True,
            "data": {
                "id": sample_user_id,
                "username": "test_user",
                "email": "test@example.com",
                "skills": ["Python", "JavaScript", "Go"]  # String array
            }
        }
        
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = response_with_string_skills
        
        with patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                return_value=mock_response
            )
            
            result = await profile_tool.execute(user_id=sample_user_id)
        
        assert result.success is True
        profile = result.data
        
        # Verify skills are properly extracted
        assert len(profile["skills"]) == 3
        assert "Python" in profile["skills"]
        assert "JavaScript" in profile["skills"]
        assert "Go" in profile["skills"]
