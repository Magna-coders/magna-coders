"""Unit tests for WebSearchTool.

**Validates: Requirements 8.1**
"""

import pytest
from unittest.mock import Mock, patch, MagicMock

from ...tools import WebSearchTool, ToolResult, ToolValidationError


class TestWebSearchTool:
    """Test suite for WebSearchTool."""
    
    @pytest.fixture
    def tool(self):
        """Create WebSearchTool instance for testing."""
        return WebSearchTool(api_key="test_api_key")
    
    def test_tool_name(self, tool):
        """Test that tool has correct name."""
        assert tool.name == "web_search"
    
    def test_tool_description(self, tool):
        """Test that tool has description."""
        assert len(tool.description) > 0
        assert "search" in tool.description.lower()
    
    def test_parameters_schema(self, tool):
        """Test that parameters schema is valid."""
        schema = tool.parameters_schema
        
        assert schema["type"] == "object"
        assert "query" in schema["properties"]
        assert "num_results" in schema["properties"]
        assert "location" in schema["properties"]
        assert "query" in schema["required"]
    
    @pytest.mark.asyncio
    async def test_execute_empty_query(self, tool):
        """Test that empty query raises validation error."""
        with pytest.raises(ToolValidationError, match="cannot be empty"):
            await tool.execute(query="")
    
    @pytest.mark.asyncio
    async def test_execute_invalid_num_results(self, tool):
        """Test that invalid num_results raises validation error."""
        with pytest.raises(ToolValidationError, match="must be between"):
            await tool.execute(query="test", num_results=0)
        
        with pytest.raises(ToolValidationError, match="must be between"):
            await tool.execute(query="test", num_results=11)
    
    @pytest.mark.asyncio
    async def test_execute_no_api_key(self):
        """Test that missing API key returns error result."""
        tool = WebSearchTool(api_key="")
        
        result = await tool.execute(query="test query")
        
        assert result.success is False
        assert "API key not configured" in result.error
    
    @pytest.mark.asyncio
    @patch('backend.tools.web_search_tool.Client')
    async def test_execute_success(self, mock_client_class, tool):
        """Test successful web search execution."""
        # Mock search results
        mock_results = {
            "organic_results": [
                {
                    "title": "Python Developer Jobs in Kenya",
                    "link": "https://example.com/job1",
                    "snippet": "Looking for Python developers in Nairobi",
                    "displayed_link": "example.com"
                },
                {
                    "title": "Senior Python Engineer - Remote",
                    "link": "https://example.com/job2",
                    "snippet": "Remote Python position available",
                    "displayed_link": "example.com",
                    "date": "2024-01-15"
                }
            ],
            "search_information": {
                "total_results": "1,234"
            },
            "search_metadata": {
                "id": "search_123"
            }
        }
        
        # Configure mock
        mock_client_instance = MagicMock()
        mock_client_instance.search.return_value = mock_results
        mock_client_class.return_value = mock_client_instance
        
        # Execute search
        result = await tool.execute(
            query="Python developer jobs Kenya",
            num_results=2
        )
        
        # Verify result
        assert result.success is True
        assert result.data["query"] == "Python developer jobs Kenya"
        assert result.data["total_results"] == 1234
        assert len(result.data["results"]) == 2
        
        # Verify first result
        first_result = result.data["results"][0]
        assert first_result["position"] == 1
        assert first_result["title"] == "Python Developer Jobs in Kenya"
        assert first_result["link"] == "https://example.com/job1"
        assert first_result["snippet"] == "Looking for Python developers in Nairobi"
        
        # Verify second result has date
        second_result = result.data["results"][1]
        assert second_result["position"] == 2
        assert "date" in second_result
        assert second_result["date"] == "2024-01-15"
        
        # Verify metadata
        assert result.metadata["tool"] == "web_search"
        assert result.metadata["search_id"] == "search_123"
        assert result.metadata["results_returned"] == 2
        
        # Verify Client was called correctly
        mock_client_class.assert_called_once_with(api_key="test_api_key")
        mock_client_instance.search.assert_called_once()
        call_args = mock_client_instance.search.call_args[0][0]
        assert call_args["q"] == "Python developer jobs Kenya"
        assert call_args["num"] == 2
        assert call_args["engine"] == "google"
    
    @pytest.mark.asyncio
    @patch('backend.tools.web_search_tool.Client')
    async def test_execute_with_location(self, mock_client_class, tool):
        """Test web search with location parameter."""
        mock_results = {
            "organic_results": [
                {
                    "title": "Test Result",
                    "link": "https://example.com",
                    "snippet": "Test snippet",
                    "displayed_link": "example.com"
                }
            ],
            "search_information": {"total_results": "100"},
            "search_metadata": {"id": "search_456"}
        }
        
        mock_client_instance = MagicMock()
        mock_client_instance.search.return_value = mock_results
        mock_client_class.return_value = mock_client_instance
        
        # Execute with location
        result = await tool.execute(
            query="software jobs",
            num_results=1,
            location="Kenya"
        )
        
        assert result.success is True
        assert result.data["location"] == "Kenya"
        
        # Verify location was passed to API
        call_args = mock_client_instance.search.call_args[0][0]
        assert call_args["location"] == "Kenya"
    
    @pytest.mark.asyncio
    @patch('backend.tools.web_search_tool.Client')
    async def test_execute_no_results(self, mock_client_class, tool):
        """Test handling of search with no results."""
        mock_results = {
            "organic_results": [],
            "search_information": {"total_results": "0"},
            "search_metadata": {"id": "search_789"}
        }
        
        mock_client_instance = MagicMock()
        mock_client_instance.search.return_value = mock_results
        mock_client_class.return_value = mock_client_instance
        
        result = await tool.execute(query="nonexistent query xyz123")
        
        assert result.success is True
        assert result.data["results"] == []
        assert result.data["total_results"] == 0
        assert "No results found" in result.data["message"]
    
    @pytest.mark.asyncio
    @patch('backend.tools.web_search_tool.Client')
    async def test_execute_api_error(self, mock_client_class, tool):
        """Test handling of API errors."""
        # Simulate API error
        mock_client_instance = MagicMock()
        mock_client_instance.search.side_effect = Exception("API connection failed")
        mock_client_class.return_value = mock_client_instance
        
        result = await tool.execute(query="test query")
        
        assert result.success is False
        assert "Web search failed" in result.error
        assert "API connection failed" in result.error
        assert result.metadata["tool"] == "web_search"
        assert result.metadata["query"] == "test query"
    
    @pytest.mark.asyncio
    @patch('backend.tools.web_search_tool.Client')
    async def test_execute_limits_results(self, mock_client_class, tool):
        """Test that results are limited to num_results."""
        # Mock 10 results
        mock_results = {
            "organic_results": [
                {
                    "title": f"Result {i}",
                    "link": f"https://example.com/{i}",
                    "snippet": f"Snippet {i}",
                    "displayed_link": "example.com"
                }
                for i in range(10)
            ],
            "search_information": {"total_results": "10,000"},
            "search_metadata": {"id": "search_limit"}
        }
        
        mock_client_instance = MagicMock()
        mock_client_instance.search.return_value = mock_results
        mock_client_class.return_value = mock_client_instance
        
        # Request only 3 results
        result = await tool.execute(query="test", num_results=3)
        
        assert result.success is True
        assert len(result.data["results"]) == 3
        assert result.data["results"][0]["title"] == "Result 0"
        assert result.data["results"][2]["title"] == "Result 2"
    
    @pytest.mark.asyncio
    @patch('backend.tools.web_search_tool.Client')
    async def test_execute_handles_missing_fields(self, mock_client_class, tool):
        """Test handling of results with missing optional fields."""
        mock_results = {
            "organic_results": [
                {
                    "title": "Minimal Result",
                    "link": "https://example.com"
                    # Missing snippet and displayed_link
                }
            ],
            "search_information": {},  # Missing total_results
            "search_metadata": {}  # Missing id
        }
        
        mock_client_instance = MagicMock()
        mock_client_instance.search.return_value = mock_results
        mock_client_class.return_value = mock_client_instance
        
        result = await tool.execute(query="test")
        
        assert result.success is True
        assert len(result.data["results"]) == 1
        assert result.data["results"][0]["title"] == "Minimal Result"
        assert result.data["results"][0]["snippet"] == ""
        assert result.data["results"][0]["displayed_link"] == ""
        assert result.data["total_results"] == 1  # Falls back to result count
