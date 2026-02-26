"""Unit tests for OpportunityMatchTool.

Tests the opportunity matching tool's ability to fetch and filter
opportunities from the Magna backend API.

**Validates: Requirements 8.3**
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime

from ...tools.opportunity_match_tool import OpportunityMatchTool
from ...tools.base import ToolResult, ToolValidationError


@pytest.fixture
def opportunity_tool():
    """Create OpportunityMatchTool instance for testing."""
    return OpportunityMatchTool(backend_url="http://test-backend:5000")


@pytest.fixture
def mock_projects_response():
    """Mock projects API response."""
    return {
        "results": [
            {
                "id": "proj-1",
                "title": "Build E-commerce Platform",
                "description": "Need a full-stack developer for e-commerce site",
                "owner_id": "user-1",
                "category_id": "cat-1",
                "created_at": "2024-01-15T10:00:00Z",
                "updated_at": "2024-01-15T10:00:00Z"
            },
            {
                "id": "proj-2",
                "title": "Mobile App Development",
                "description": "React Native app for delivery service",
                "owner_id": "user-2",
                "category_id": "cat-2",
                "created_at": "2024-01-14T09:00:00Z",
                "updated_at": "2024-01-14T09:00:00Z"
            }
        ],
        "previous": None,
        "next": None
    }


@pytest.fixture
def mock_opportunities_response():
    """Mock opportunities API response."""
    return {
        "results": [
            {
                "id": "opp-1",
                "title": "Senior Python Developer",
                "description": "Looking for experienced Python developer",
                "author_id": "user-3",
                "category_id": "cat-1",
                "created_at": "2024-01-16T11:00:00Z",
                "updated_at": "2024-01-16T11:00:00Z"
            }
        ],
        "previous": None,
        "next": None
    }


class TestOpportunityMatchTool:
    """Test suite for OpportunityMatchTool."""
    
    def test_tool_properties(self, opportunity_tool):
        """Test tool metadata properties."""
        assert opportunity_tool.name == "opportunity_match"
        assert "opportunities" in opportunity_tool.description.lower()
        assert "project" in opportunity_tool.description.lower()
        
        schema = opportunity_tool.parameters_schema
        assert schema["type"] == "object"
        assert "opportunity_type" in schema["properties"]
        assert "limit" in schema["properties"]
        assert "page" in schema["properties"]
    
    def test_opportunity_type_enum(self, opportunity_tool):
        """Test opportunity_type parameter has correct enum values."""
        schema = opportunity_tool.parameters_schema
        opportunity_type_prop = schema["properties"]["opportunity_type"]
        
        assert "enum" in opportunity_type_prop
        assert set(opportunity_type_prop["enum"]) == {"project", "opportunity", "all"}
    
    def test_limit_constraints(self, opportunity_tool):
        """Test limit parameter has correct constraints."""
        schema = opportunity_tool.parameters_schema
        limit_prop = schema["properties"]["limit"]
        
        assert limit_prop["minimum"] == 1
        assert limit_prop["maximum"] == 50
        assert limit_prop["default"] == 10
    
    @pytest.mark.asyncio
    async def test_invalid_opportunity_type(self, opportunity_tool):
        """Test validation error for invalid opportunity type."""
        with pytest.raises(ToolValidationError) as exc_info:
            await opportunity_tool.execute(opportunity_type="invalid")
        
        assert "opportunity_type must be" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_invalid_limit_too_low(self, opportunity_tool):
        """Test validation error for limit below minimum."""
        with pytest.raises(ToolValidationError) as exc_info:
            await opportunity_tool.execute(limit=0)
        
        assert "limit must be between 1 and 50" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_invalid_limit_too_high(self, opportunity_tool):
        """Test validation error for limit above maximum."""
        with pytest.raises(ToolValidationError) as exc_info:
            await opportunity_tool.execute(limit=100)
        
        assert "limit must be between 1 and 50" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_invalid_page(self, opportunity_tool):
        """Test validation error for invalid page number."""
        with pytest.raises(ToolValidationError) as exc_info:
            await opportunity_tool.execute(page=0)
        
        assert "page must be at least 1" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_fetch_projects_only(
        self,
        opportunity_tool,
        mock_projects_response
    ):
        """Test fetching only projects."""
        with patch("httpx.AsyncClient") as mock_client:
            # Mock the async context manager and response
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = mock_projects_response
            
            mock_get = AsyncMock(return_value=mock_response)
            mock_client.return_value.__aenter__.return_value.get = mock_get
            
            # Execute tool
            result = await opportunity_tool.execute(
                opportunity_type="project",
                limit=10
            )
            
            # Verify result
            assert result.success is True
            assert result.data["opportunity_type"] == "project"
            assert result.data["total_count"] == 2
            assert len(result.data["opportunities"]) == 2
            
            # Verify all results are projects
            for opp in result.data["opportunities"]:
                assert opp["type"] == "project"
                assert "title" in opp
                assert "description" in opp
                assert "owner_id" in opp
    
    @pytest.mark.asyncio
    async def test_fetch_opportunities_only(
        self,
        opportunity_tool,
        mock_opportunities_response
    ):
        """Test fetching only opportunities."""
        with patch("httpx.AsyncClient") as mock_client:
            # Mock the async context manager and response
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = mock_opportunities_response
            
            mock_get = AsyncMock(return_value=mock_response)
            mock_client.return_value.__aenter__.return_value.get = mock_get
            
            # Execute tool
            result = await opportunity_tool.execute(
                opportunity_type="opportunity",
                limit=10
            )
            
            # Verify result
            assert result.success is True
            assert result.data["opportunity_type"] == "opportunity"
            assert result.data["total_count"] == 1
            assert len(result.data["opportunities"]) == 1
            
            # Verify all results are opportunities
            for opp in result.data["opportunities"]:
                assert opp["type"] == "opportunity"
                assert "title" in opp
                assert "description" in opp
                assert "author_id" in opp
    
    @pytest.mark.asyncio
    async def test_fetch_all_opportunities(
        self,
        opportunity_tool,
        mock_projects_response,
        mock_opportunities_response
    ):
        """Test fetching all opportunity types."""
        with patch("httpx.AsyncClient") as mock_client:
            # Mock responses for both endpoints
            def mock_get_side_effect(url, **kwargs):
                mock_response = MagicMock()
                mock_response.status_code = 200
                
                if "projects" in url:
                    mock_response.json.return_value = mock_projects_response
                elif "opportunities" in url:
                    mock_response.json.return_value = mock_opportunities_response
                
                return mock_response
            
            mock_get = AsyncMock(side_effect=mock_get_side_effect)
            mock_client.return_value.__aenter__.return_value.get = mock_get
            
            # Execute tool
            result = await opportunity_tool.execute(
                opportunity_type="all",
                limit=10
            )
            
            # Verify result
            assert result.success is True
            assert result.data["opportunity_type"] == "all"
            assert result.data["total_count"] == 3  # 2 projects + 1 opportunity
            assert len(result.data["opportunities"]) == 3
            
            # Verify mixed types
            types = [opp["type"] for opp in result.data["opportunities"]]
            assert "project" in types
            assert "opportunity" in types
    
    @pytest.mark.asyncio
    async def test_sorting_by_created_at(
        self,
        opportunity_tool,
        mock_projects_response,
        mock_opportunities_response
    ):
        """Test that results are sorted by created_at descending."""
        with patch("httpx.AsyncClient") as mock_client:
            # Mock responses
            def mock_get_side_effect(url, **kwargs):
                mock_response = MagicMock()
                mock_response.status_code = 200
                
                if "projects" in url:
                    mock_response.json.return_value = mock_projects_response
                elif "opportunities" in url:
                    mock_response.json.return_value = mock_opportunities_response
                
                return mock_response
            
            mock_get = AsyncMock(side_effect=mock_get_side_effect)
            mock_client.return_value.__aenter__.return_value.get = mock_get
            
            # Execute tool
            result = await opportunity_tool.execute(opportunity_type="all")
            
            # Verify sorting (most recent first)
            opportunities = result.data["opportunities"]
            assert len(opportunities) == 3
            
            # Check order: opp-1 (2024-01-16) > proj-1 (2024-01-15) > proj-2 (2024-01-14)
            assert opportunities[0]["id"] == "opp-1"
            assert opportunities[1]["id"] == "proj-1"
            assert opportunities[2]["id"] == "proj-2"
    
    @pytest.mark.asyncio
    async def test_limit_applied_to_all_types(
        self,
        opportunity_tool,
        mock_projects_response,
        mock_opportunities_response
    ):
        """Test that limit is applied when fetching all types."""
        with patch("httpx.AsyncClient") as mock_client:
            # Mock responses
            def mock_get_side_effect(url, **kwargs):
                mock_response = MagicMock()
                mock_response.status_code = 200
                
                if "projects" in url:
                    mock_response.json.return_value = mock_projects_response
                elif "opportunities" in url:
                    mock_response.json.return_value = mock_opportunities_response
                
                return mock_response
            
            mock_get = AsyncMock(side_effect=mock_get_side_effect)
            mock_client.return_value.__aenter__.return_value.get = mock_get
            
            # Execute tool with limit of 2
            result = await opportunity_tool.execute(
                opportunity_type="all",
                limit=2
            )
            
            # Verify limit is applied
            assert result.success is True
            assert len(result.data["opportunities"]) == 2
            assert result.data["limit"] == 2
    
    @pytest.mark.asyncio
    async def test_category_filter(self, opportunity_tool, mock_projects_response):
        """Test filtering by category ID."""
        with patch("httpx.AsyncClient") as mock_client:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = mock_projects_response
            
            mock_get = AsyncMock(return_value=mock_response)
            mock_client.return_value.__aenter__.return_value.get = mock_get
            
            # Execute tool with category filter
            category_id = "cat-123"
            result = await opportunity_tool.execute(
                opportunity_type="project",
                category_id=category_id
            )
            
            # Verify category was passed in request
            assert result.success is True
            assert result.metadata["category_id"] == category_id
    
    @pytest.mark.asyncio
    async def test_authentication_token(self, opportunity_tool, mock_projects_response):
        """Test that auth token is included in request headers."""
        with patch("httpx.AsyncClient") as mock_client:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = mock_projects_response
            
            mock_get = AsyncMock(return_value=mock_response)
            mock_client.return_value.__aenter__.return_value.get = mock_get
            
            # Execute tool with auth token
            auth_token = "test-jwt-token"
            result = await opportunity_tool.execute(
                opportunity_type="project",
                auth_token=auth_token
            )
            
            # Verify request was made with auth header
            assert result.success is True
            call_args = mock_get.call_args
            headers = call_args.kwargs.get("headers", {})
            assert "Authorization" in headers
            assert headers["Authorization"] == f"Bearer {auth_token}"
    
    @pytest.mark.asyncio
    async def test_empty_results(self, opportunity_tool):
        """Test handling of empty results."""
        with patch("httpx.AsyncClient") as mock_client:
            # Mock empty response
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"results": []}
            
            mock_get = AsyncMock(return_value=mock_response)
            mock_client.return_value.__aenter__.return_value.get = mock_get
            
            # Execute tool
            result = await opportunity_tool.execute(opportunity_type="project")
            
            # Verify empty results handled correctly
            assert result.success is True
            assert result.data["total_count"] == 0
            assert len(result.data["opportunities"]) == 0
    
    @pytest.mark.asyncio
    async def test_api_error_handling(self, opportunity_tool):
        """Test handling of API errors."""
        with patch("httpx.AsyncClient") as mock_client:
            # Mock error response
            mock_response = MagicMock()
            mock_response.status_code = 500
            mock_response.text = "Internal Server Error"
            
            mock_get = AsyncMock(return_value=mock_response)
            mock_client.return_value.__aenter__.return_value.get = mock_get
            
            # Execute tool
            result = await opportunity_tool.execute(opportunity_type="project")
            
            # Verify graceful handling (returns empty list, not error)
            assert result.success is True
            assert result.data["total_count"] == 0
    
    @pytest.mark.asyncio
    async def test_connection_error(self, opportunity_tool):
        """Test handling of connection errors."""
        with patch("httpx.AsyncClient") as mock_client:
            # Mock connection error
            import httpx
            mock_get = AsyncMock(side_effect=httpx.ConnectError("Connection failed"))
            mock_client.return_value.__aenter__.return_value.get = mock_get
            
            # Execute tool
            result = await opportunity_tool.execute(opportunity_type="project")
            
            # Verify graceful handling
            assert result.success is True
            assert result.data["total_count"] == 0
    
    @pytest.mark.asyncio
    async def test_timeout_error(self, opportunity_tool):
        """Test handling of timeout errors."""
        with patch("httpx.AsyncClient") as mock_client:
            # Mock timeout error
            import httpx
            mock_get = AsyncMock(side_effect=httpx.TimeoutException("Request timed out"))
            mock_client.return_value.__aenter__.return_value.get = mock_get
            
            # Execute tool
            result = await opportunity_tool.execute(opportunity_type="project")
            
            # Verify graceful handling
            assert result.success is True
            assert result.data["total_count"] == 0
    
    @pytest.mark.asyncio
    async def test_pagination_parameters(self, opportunity_tool, mock_projects_response):
        """Test that pagination parameters are passed correctly."""
        with patch("httpx.AsyncClient") as mock_client:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = mock_projects_response
            
            mock_get = AsyncMock(return_value=mock_response)
            mock_client.return_value.__aenter__.return_value.get = mock_get
            
            # Execute tool with pagination
            result = await opportunity_tool.execute(
                opportunity_type="project",
                page=2,
                limit=5
            )
            
            # Verify pagination in response
            assert result.success is True
            assert result.data["page"] == 2
            assert result.data["limit"] == 5
            
            # Verify pagination params were sent to API
            call_args = mock_get.call_args
            params = call_args.kwargs.get("params", {})
            assert params["page"] == 2
            assert params["limit"] == 5


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
