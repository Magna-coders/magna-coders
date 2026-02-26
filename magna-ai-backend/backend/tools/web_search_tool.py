"""Web search tool implementation using SerpAPI.

This module provides web search capabilities for the Magna AI Agent,
allowing it to search the web for current information using SerpAPI.

**Validates: Requirements 8.1**
"""

import logging
from typing import Any, Dict, List, Optional

from serpapi import Client

from ..config import settings
from .base import Tool, ToolResult, ToolValidationError

logger = logging.getLogger(__name__)


class WebSearchTool(Tool):
    """Search the web using SerpAPI.
    
    This tool enables the agent to search the web for current information,
    news, job postings, and other real-time data. It uses Google Search
    via SerpAPI to retrieve relevant results.
    
    The tool returns structured search results including titles, snippets,
    links, and additional metadata for each result.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize the web search tool.
        
        Args:
            api_key: SerpAPI API key. If not provided, uses settings.serpapi_api_key
        """
        self._api_key = api_key or settings.serpapi_api_key
        if not self._api_key:
            logger.warning("SerpAPI API key not configured")
    
    @property
    def name(self) -> str:
        """Tool identifier."""
        return "web_search"
    
    @property
    def description(self) -> str:
        """Human-readable description for LLM."""
        return (
            "Search the web for current information using Google Search. "
            "Use this tool to find recent news, job postings, technical documentation, "
            "or any information that may not be in your training data. "
            "Returns titles, snippets, and links to relevant web pages."
        )
    
    @property
    def parameters_schema(self) -> Dict[str, Any]:
        """JSON schema for parameters."""
        return {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query to execute"
                },
                "num_results": {
                    "type": "integer",
                    "description": "Number of search results to return",
                    "default": 5,
                    "minimum": 1,
                    "maximum": 10
                },
                "location": {
                    "type": "string",
                    "description": "Geographic location for localized results (e.g., 'Kenya', 'United States')",
                    "default": ""
                }
            },
            "required": ["query"]
        }
    
    async def execute(
        self,
        query: str,
        num_results: int = 5,
        location: str = "",
        **kwargs
    ) -> ToolResult:
        """Execute web search using SerpAPI.
        
        Args:
            query: Search query to execute
            num_results: Number of results to return (1-10)
            location: Geographic location for localized results
            **kwargs: Additional parameters (ignored)
            
        Returns:
            ToolResult with search results containing:
                - results: List of search result dictionaries with title, snippet, link
                - query: Original search query
                - total_results: Total number of results found
                
        Raises:
            ToolValidationError: If query is empty or num_results is invalid
        """
        # Validate input
        if not query or not query.strip():
            raise ToolValidationError("Search query cannot be empty")
        
        if num_results < 1 or num_results > 10:
            raise ToolValidationError("num_results must be between 1 and 10")
        
        # Check API key
        if not self._api_key:
            return ToolResult(
                success=False,
                error="SerpAPI API key not configured. Please set SERPAPI_API_KEY environment variable."
            )
        
        try:
            # Prepare search parameters
            search_params = {
                "q": query.strip(),
                "num": num_results,
                "engine": "google"
            }
            
            # Add location if provided
            if location and location.strip():
                search_params["location"] = location.strip()
            
            logger.info(f"Executing web search: query='{query}', num_results={num_results}")
            
            # Execute search using Client
            client = Client(api_key=self._api_key)
            results = client.search(search_params)
            
            # Parse organic results
            organic_results = results.get("organic_results", [])
            
            if not organic_results:
                logger.info(f"No results found for query: {query}")
                return ToolResult(
                    success=True,
                    data={
                        "results": [],
                        "query": query,
                        "total_results": 0,
                        "message": "No results found for the given query"
                    },
                    metadata={
                        "tool": self.name,
                        "location": location
                    }
                )
            
            # Format results
            formatted_results = []
            for idx, result in enumerate(organic_results[:num_results]):
                formatted_result = {
                    "position": idx + 1,
                    "title": result.get("title", ""),
                    "link": result.get("link", ""),
                    "snippet": result.get("snippet", ""),
                    "displayed_link": result.get("displayed_link", "")
                }
                
                # Add additional fields if available
                if "date" in result:
                    formatted_result["date"] = result["date"]
                
                formatted_results.append(formatted_result)
            
            # Get search metadata
            search_metadata = results.get("search_metadata", {})
            total_results_str = results.get("search_information", {}).get("total_results", "")
            
            # Parse total results (remove commas)
            try:
                if total_results_str:
                    total_results = int(total_results_str.replace(",", ""))
                else:
                    total_results = len(formatted_results)
            except (ValueError, AttributeError):
                total_results = len(formatted_results)
            
            logger.info(
                f"Web search completed: {len(formatted_results)} results returned "
                f"(total available: {total_results})"
            )
            
            return ToolResult(
                success=True,
                data={
                    "results": formatted_results,
                    "query": query,
                    "total_results": total_results,
                    "location": location if location else None
                },
                metadata={
                    "tool": self.name,
                    "search_id": search_metadata.get("id", ""),
                    "results_returned": len(formatted_results)
                }
            )
            
        except Exception as e:
            error_msg = f"Web search failed: {str(e)}"
            logger.error(error_msg, exc_info=True)
            
            return ToolResult(
                success=False,
                error=error_msg,
                metadata={
                    "tool": self.name,
                    "query": query
                }
            )


# Example usage
if __name__ == "__main__":
    import asyncio
    from .base import ToolRegistry
    
    async def main():
        """Demonstrate web search tool usage."""
        # Create registry
        registry = ToolRegistry()
        
        # Register web search tool
        registry.register_tool(WebSearchTool())
        
        # Test web search
        print("Testing web search tool:")
        print("-" * 50)
        
        result = await registry.execute_tool(
            tool_name="web_search",
            parameters={
                "query": "Python developer jobs in Kenya",
                "num_results": 3
            }
        )
        
        if result.success:
            print(f"Query: {result.data['query']}")
            print(f"Total results: {result.data['total_results']}")
            print(f"\nTop {len(result.data['results'])} results:")
            print()
            
            for res in result.data['results']:
                print(f"{res['position']}. {res['title']}")
                print(f"   {res['link']}")
                print(f"   {res['snippet']}")
                print()
        else:
            print(f"Search failed: {result.error}")
    
    asyncio.run(main())
