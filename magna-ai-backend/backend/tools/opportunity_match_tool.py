"""Opportunity matching tool implementation for Magna backend API.

This module provides opportunity retrieval capabilities for the Magna AI Agent,
allowing it to fetch jobs, projects, and gigs from the existing Magna backend.

**Validates: Requirements 8.3**
"""

import logging
from typing import Any, Dict, List, Optional

import httpx

from ..config import settings
from .base import Tool, ToolResult, ToolValidationError

logger = logging.getLogger(__name__)


class OpportunityMatchTool(Tool):
    """Fetch opportunities from Magna backend API.
    
    This tool enables the agent to retrieve opportunity information including
    jobs, projects, and gigs from the existing Magna platform backend.
    
    The tool supports filtering by opportunity type and returns structured
    opportunity data for use in matching and recommendations.
    """
    
    def __init__(
        self,
        backend_url: Optional[str] = None,
        timeout_seconds: int = 10
    ):
        """Initialize the opportunity matching tool.
        
        Args:
            backend_url: Base URL for Magna backend API. Defaults to http://localhost:5000
            timeout_seconds: Request timeout in seconds
        """
        self._backend_url = backend_url or "http://localhost:5000"
        self._timeout_seconds = timeout_seconds
        logger.info(f"OpportunityMatchTool initialized with backend: {self._backend_url}")
    
    @property
    def name(self) -> str:
        """Tool identifier."""
        return "opportunity_match"
    
    @property
    def description(self) -> str:
        """Human-readable description for LLM."""
        return (
            "Retrieve opportunities (jobs, projects, gigs) from the Magna platform backend. "
            "Use this tool to fetch available opportunities for matching with user profiles. "
            "Supports filtering by opportunity type (project, opportunity, all). "
            "Returns structured opportunity data including title, description, category, "
            "owner information, and timestamps."
        )
    
    @property
    def parameters_schema(self) -> Dict[str, Any]:
        """JSON schema for parameters."""
        return {
            "type": "object",
            "properties": {
                "opportunity_type": {
                    "type": "string",
                    "description": "Type of opportunity to retrieve",
                    "enum": ["project", "opportunity", "all"],
                    "default": "all"
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of opportunities to return",
                    "default": 10,
                    "minimum": 1,
                    "maximum": 50
                },
                "page": {
                    "type": "integer",
                    "description": "Page number for pagination",
                    "default": 1,
                    "minimum": 1
                },
                "category_id": {
                    "type": "string",
                    "description": "Filter by category UUID (optional)"
                },
                "auth_token": {
                    "type": "string",
                    "description": "JWT authentication token for the request (optional)"
                }
            },
            "required": []
        }
    
    async def execute(
        self,
        opportunity_type: str = "all",
        limit: int = 10,
        page: int = 1,
        category_id: Optional[str] = None,
        auth_token: Optional[str] = None,
        **kwargs
    ) -> ToolResult:
        """Execute opportunity retrieval from Magna backend.
        
        Args:
            opportunity_type: Type of opportunity ("project", "opportunity", "all")
            limit: Maximum number of results to return (1-50)
            page: Page number for pagination
            category_id: Optional category UUID filter
            auth_token: JWT authentication token (optional)
            **kwargs: Additional parameters (ignored)
            
        Returns:
            ToolResult with opportunity data containing:
                - opportunities: List of opportunity dictionaries
                - total_count: Total number of opportunities available
                - page: Current page number
                - limit: Results per page
                - opportunity_type: Type of opportunities returned
                
        Raises:
            ToolValidationError: If parameters are invalid
        """
        # Validate input
        if opportunity_type not in ["project", "opportunity", "all"]:
            raise ToolValidationError(
                f"opportunity_type must be 'project', 'opportunity', or 'all', got: {opportunity_type}"
            )
        
        if limit < 1 or limit > 50:
            raise ToolValidationError("limit must be between 1 and 50")
        
        if page < 1:
            raise ToolValidationError("page must be at least 1")
        
        try:
            # Prepare headers
            headers = {}
            if auth_token:
                headers["Authorization"] = f"Bearer {auth_token}"
            
            # Fetch opportunities based on type
            opportunities = []
            
            if opportunity_type in ["project", "all"]:
                projects = await self._fetch_projects(
                    limit=limit,
                    page=page,
                    category_id=category_id,
                    headers=headers
                )
                opportunities.extend(projects)
            
            if opportunity_type in ["opportunity", "all"]:
                opps = await self._fetch_opportunities(
                    limit=limit,
                    page=page,
                    category_id=category_id,
                    headers=headers
                )
                opportunities.extend(opps)
            
            # Sort by created_at descending (most recent first)
            opportunities.sort(
                key=lambda x: x.get("created_at", ""),
                reverse=True
            )
            
            # Apply limit if fetching all types
            if opportunity_type == "all":
                opportunities = opportunities[:limit]
            
            logger.info(
                f"Retrieved {len(opportunities)} opportunities "
                f"(type: {opportunity_type}, page: {page})"
            )
            
            return ToolResult(
                success=True,
                data={
                    "opportunities": opportunities,
                    "total_count": len(opportunities),
                    "page": page,
                    "limit": limit,
                    "opportunity_type": opportunity_type
                },
                metadata={
                    "tool": self.name,
                    "category_id": category_id
                }
            )
            
        except Exception as e:
            error_msg = f"Opportunity retrieval failed: {str(e)}"
            logger.error(error_msg, exc_info=True)
            
            return ToolResult(
                success=False,
                error=error_msg,
                metadata={
                    "tool": self.name,
                    "opportunity_type": opportunity_type,
                    "error_type": type(e).__name__
                }
            )
    
    async def _fetch_projects(
        self,
        limit: int,
        page: int,
        category_id: Optional[str],
        headers: Dict[str, str]
    ) -> List[Dict[str, Any]]:
        """Fetch projects from backend API.
        
        Args:
            limit: Maximum number of results
            page: Page number
            category_id: Optional category filter
            headers: HTTP headers including auth
            
        Returns:
            List of project dictionaries
        """
        try:
            # Build query parameters
            params = {
                "page": page,
                "limit": limit
            }
            if category_id:
                params["category"] = category_id
            
            url = f"{self._backend_url}/api/projects"
            
            logger.debug(f"Fetching projects from {url} with params: {params}")
            
            async with httpx.AsyncClient(timeout=self._timeout_seconds) as client:
                response = await client.get(url, headers=headers, params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Extract results from paginated response
                    projects = data.get("results", [])
                    
                    # Format projects with type indicator
                    formatted_projects = []
                    for project in projects:
                        formatted_project = {
                            "id": project.get("id"),
                            "type": "project",
                            "title": project.get("title"),
                            "description": project.get("description"),
                            "owner_id": project.get("owner_id"),
                            "category_id": project.get("category_id"),
                            "created_at": project.get("created_at"),
                            "updated_at": project.get("updated_at")
                        }
                        formatted_projects.append(formatted_project)
                    
                    logger.debug(f"Retrieved {len(formatted_projects)} projects")
                    return formatted_projects
                
                elif response.status_code == 404:
                    logger.warning("Projects endpoint not found")
                    return []
                
                else:
                    logger.warning(
                        f"Projects API returned status {response.status_code}: {response.text[:200]}"
                    )
                    return []
        
        except httpx.TimeoutException:
            logger.error(f"Projects request timed out after {self._timeout_seconds}s")
            return []
        
        except httpx.ConnectError as e:
            logger.error(f"Failed to connect to backend: {str(e)}")
            return []
        
        except Exception as e:
            logger.error(f"Error fetching projects: {str(e)}", exc_info=True)
            return []
    
    async def _fetch_opportunities(
        self,
        limit: int,
        page: int,
        category_id: Optional[str],
        headers: Dict[str, str]
    ) -> List[Dict[str, Any]]:
        """Fetch opportunities from backend API.
        
        Args:
            limit: Maximum number of results
            page: Page number
            category_id: Optional category filter
            headers: HTTP headers including auth
            
        Returns:
            List of opportunity dictionaries
        """
        try:
            # Build query parameters
            params = {
                "page": page,
                "limit": limit
            }
            if category_id:
                params["category"] = category_id
            
            # Note: Assuming opportunities endpoint follows similar pattern to projects
            # Adjust URL if different
            url = f"{self._backend_url}/api/opportunities"
            
            logger.debug(f"Fetching opportunities from {url} with params: {params}")
            
            async with httpx.AsyncClient(timeout=self._timeout_seconds) as client:
                response = await client.get(url, headers=headers, params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Extract results from paginated response
                    opportunities = data.get("results", [])
                    
                    # Format opportunities with type indicator
                    formatted_opportunities = []
                    for opp in opportunities:
                        formatted_opp = {
                            "id": opp.get("id"),
                            "type": "opportunity",
                            "title": opp.get("title"),
                            "description": opp.get("description"),
                            "author_id": opp.get("author_id"),
                            "category_id": opp.get("category_id"),
                            "created_at": opp.get("created_at"),
                            "updated_at": opp.get("updated_at")
                        }
                        formatted_opportunities.append(formatted_opp)
                    
                    logger.debug(f"Retrieved {len(formatted_opportunities)} opportunities")
                    return formatted_opportunities
                
                elif response.status_code == 404:
                    logger.warning("Opportunities endpoint not found")
                    return []
                
                else:
                    logger.warning(
                        f"Opportunities API returned status {response.status_code}: {response.text[:200]}"
                    )
                    return []
        
        except httpx.TimeoutException:
            logger.error(f"Opportunities request timed out after {self._timeout_seconds}s")
            return []
        
        except httpx.ConnectError as e:
            logger.error(f"Failed to connect to backend: {str(e)}")
            return []
        
        except Exception as e:
            logger.error(f"Error fetching opportunities: {str(e)}", exc_info=True)
            return []


# Example usage
if __name__ == "__main__":
    import asyncio
    from .base import ToolRegistry
    
    async def main():
        """Demonstrate opportunity matching tool usage."""
        # Create registry
        registry = ToolRegistry()
        
        # Register opportunity matching tool
        registry.register_tool(OpportunityMatchTool())
        
        # Test opportunity retrieval
        print("Testing opportunity matching tool:")
        print("-" * 50)
        
        # Test 1: Fetch all opportunities
        print("\n1. Fetching all opportunities (limit 5):")
        result = await registry.execute_tool(
            tool_name="opportunity_match",
            parameters={
                "opportunity_type": "all",
                "limit": 5
            }
        )
        
        if result.success:
            data = result.data
            print(f"Total opportunities: {data['total_count']}")
            print(f"Opportunity type: {data['opportunity_type']}")
            print(f"\nOpportunities:")
            for opp in data['opportunities']:
                print(f"  - [{opp['type']}] {opp['title']}")
                print(f"    ID: {opp['id']}")
                print(f"    Created: {opp['created_at']}")
        else:
            print(f"Failed: {result.error}")
        
        # Test 2: Fetch only projects
        print("\n2. Fetching only projects (limit 3):")
        result = await registry.execute_tool(
            tool_name="opportunity_match",
            parameters={
                "opportunity_type": "project",
                "limit": 3
            }
        )
        
        if result.success:
            data = result.data
            print(f"Total projects: {data['total_count']}")
            for opp in data['opportunities']:
                print(f"  - {opp['title']}")
        else:
            print(f"Failed: {result.error}")
        
        # Test 3: Fetch only opportunities
        print("\n3. Fetching only opportunities (limit 3):")
        result = await registry.execute_tool(
            tool_name="opportunity_match",
            parameters={
                "opportunity_type": "opportunity",
                "limit": 3
            }
        )
        
        if result.success:
            data = result.data
            print(f"Total opportunities: {data['total_count']}")
            for opp in data['opportunities']:
                print(f"  - {opp['title']}")
        else:
            print(f"Failed: {result.error}")
    
    asyncio.run(main())
