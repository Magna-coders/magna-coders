"""Profile retrieval tool implementation for Magna backend API.

This module provides user profile retrieval capabilities for the Magna AI Agent,
allowing it to fetch user profile data from the existing Magna backend.

**Validates: Requirements 8.2**
"""

import logging
from typing import Any, Dict, Optional

import httpx

from ..config import settings
from .base import Tool, ToolResult, ToolValidationError

logger = logging.getLogger(__name__)


class ProfileRetrievalTool(Tool):
    """Fetch user profile from Magna backend API.
    
    This tool enables the agent to retrieve user profile information including
    skills, experience, location, career goals, and other relevant data from
    the existing Magna platform backend.
    
    The tool handles authentication, error cases, and returns structured
    profile data for use in opportunity matching and recommendations.
    """
    
    def __init__(
        self,
        backend_url: Optional[str] = None,
        timeout_seconds: int = 10
    ):
        """Initialize the profile retrieval tool.
        
        Args:
            backend_url: Base URL for Magna backend API. Defaults to http://localhost:5000
            timeout_seconds: Request timeout in seconds
        """
        self._backend_url = backend_url or "http://localhost:5000"
        self._timeout_seconds = timeout_seconds
        logger.info(f"ProfileRetrievalTool initialized with backend: {self._backend_url}")
    
    @property
    def name(self) -> str:
        """Tool identifier."""
        return "profile_retrieval"
    
    @property
    def description(self) -> str:
        """Human-readable description for LLM."""
        return (
            "Retrieve user profile information from the Magna platform backend. "
            "Use this tool to fetch user skills, experience, location, career goals, "
            "availability, and other profile data needed for opportunity matching "
            "and personalized recommendations. Requires a valid user ID."
        )
    
    @property
    def parameters_schema(self) -> Dict[str, Any]:
        """JSON schema for parameters."""
        return {
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "string",
                    "description": "UUID of the user whose profile to retrieve",
                    "format": "uuid"
                },
                "auth_token": {
                    "type": "string",
                    "description": "JWT authentication token for the request (optional if using internal service auth)"
                }
            },
            "required": ["user_id"]
        }
    
    async def execute(
        self,
        user_id: str,
        auth_token: Optional[str] = None,
        **kwargs
    ) -> ToolResult:
        """Execute profile retrieval from Magna backend.
        
        Args:
            user_id: UUID of the user whose profile to retrieve
            auth_token: JWT authentication token (optional)
            **kwargs: Additional parameters (ignored)
            
        Returns:
            ToolResult with profile data containing:
                - user_id: User's unique identifier
                - username: User's username
                - email: User's email address
                - skills: List of user skills
                - location: User's location
                - bio: User biography
                - availability: User availability status
                - profile_complete_percentage: Profile completion percentage
                - social_links: Dictionary of social media URLs
                - created_at: Account creation timestamp
                
        Raises:
            ToolValidationError: If user_id is empty or invalid format
        """
        # Validate input
        if not user_id or not user_id.strip():
            raise ToolValidationError("user_id cannot be empty")
        
        user_id = user_id.strip()
        
        # Basic UUID format validation
        if len(user_id) != 36 or user_id.count('-') != 4:
            raise ToolValidationError(
                f"user_id must be a valid UUID format, got: {user_id}"
            )
        
        try:
            # Prepare request
            url = f"{self._backend_url}/api/auth/profile/{user_id}"
            headers = {}
            
            # Add authentication if provided
            if auth_token:
                headers["Authorization"] = f"Bearer {auth_token}"
            
            logger.info(f"Fetching profile for user_id: {user_id}")
            
            # Make HTTP request
            async with httpx.AsyncClient(timeout=self._timeout_seconds) as client:
                response = await client.get(url, headers=headers)
                
                # Handle different response status codes
                if response.status_code == 200:
                    # Success - parse profile data
                    data = response.json()
                    
                    # Check if response has expected structure
                    if not data.get("success"):
                        return ToolResult(
                            success=False,
                            error=f"Backend returned unsuccessful response: {data.get('message', 'Unknown error')}",
                            metadata={
                                "tool": self.name,
                                "user_id": user_id,
                                "status_code": response.status_code
                            }
                        )
                    
                    # Extract profile data
                    profile_data = data.get("data", {})
                    
                    if not profile_data:
                        return ToolResult(
                            success=False,
                            error="Backend returned empty profile data",
                            metadata={
                                "tool": self.name,
                                "user_id": user_id
                            }
                        )
                    
                    # Format profile data for agent use
                    formatted_profile = self._format_profile_data(profile_data)
                    
                    logger.info(
                        f"Profile retrieved successfully for user: {user_id} "
                        f"(username: {formatted_profile.get('username', 'N/A')})"
                    )
                    
                    return ToolResult(
                        success=True,
                        data=formatted_profile,
                        metadata={
                            "tool": self.name,
                            "user_id": user_id,
                            "profile_complete": formatted_profile.get("profile_complete_percentage", 0)
                        }
                    )
                
                elif response.status_code == 401:
                    # Unauthorized - invalid or missing auth token
                    error_msg = "Authentication failed: Invalid or missing auth token"
                    logger.warning(f"{error_msg} for user_id: {user_id}")
                    
                    return ToolResult(
                        success=False,
                        error=error_msg,
                        metadata={
                            "tool": self.name,
                            "user_id": user_id,
                            "status_code": 401,
                            "requires_auth": True
                        }
                    )
                
                elif response.status_code == 404:
                    # User not found
                    error_msg = f"User not found with ID: {user_id}"
                    logger.warning(error_msg)
                    
                    return ToolResult(
                        success=False,
                        error=error_msg,
                        metadata={
                            "tool": self.name,
                            "user_id": user_id,
                            "status_code": 404
                        }
                    )
                
                elif response.status_code == 501:
                    # Service temporarily unavailable (auth endpoints disabled)
                    error_msg = "Profile service is temporarily unavailable"
                    logger.warning(f"{error_msg}: {response.text}")
                    
                    return ToolResult(
                        success=False,
                        error=error_msg,
                        metadata={
                            "tool": self.name,
                            "user_id": user_id,
                            "status_code": 501,
                            "service_unavailable": True
                        }
                    )
                
                else:
                    # Other error
                    error_msg = f"Backend returned error status {response.status_code}"
                    logger.error(f"{error_msg}: {response.text}")
                    
                    return ToolResult(
                        success=False,
                        error=error_msg,
                        metadata={
                            "tool": self.name,
                            "user_id": user_id,
                            "status_code": response.status_code,
                            "response_text": response.text[:200]  # First 200 chars
                        }
                    )
        
        except httpx.TimeoutException:
            error_msg = f"Request timed out after {self._timeout_seconds}s"
            logger.error(f"{error_msg} for user_id: {user_id}")
            
            return ToolResult(
                success=False,
                error=error_msg,
                metadata={
                    "tool": self.name,
                    "user_id": user_id,
                    "timeout_seconds": self._timeout_seconds
                }
            )
        
        except httpx.ConnectError as e:
            error_msg = f"Failed to connect to backend at {self._backend_url}"
            logger.error(f"{error_msg}: {str(e)}")
            
            return ToolResult(
                success=False,
                error=error_msg,
                metadata={
                    "tool": self.name,
                    "user_id": user_id,
                    "backend_url": self._backend_url
                }
            )
        
        except Exception as e:
            error_msg = f"Profile retrieval failed: {str(e)}"
            logger.error(error_msg, exc_info=True)
            
            return ToolResult(
                success=False,
                error=error_msg,
                metadata={
                    "tool": self.name,
                    "user_id": user_id,
                    "error_type": type(e).__name__
                }
            )
    
    def _format_profile_data(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Format raw profile data from backend into structured format.
        
        Args:
            raw_data: Raw profile data from backend API
            
        Returns:
            Formatted profile dictionary with standardized fields
        """
        # Extract skills if available (from user_skills relation)
        skills = []
        if "skills" in raw_data and isinstance(raw_data["skills"], list):
            skills = [
                skill.get("name", "") if isinstance(skill, dict) else str(skill)
                for skill in raw_data["skills"]
            ]
        
        # Extract categories if available
        categories = []
        if "categories" in raw_data and isinstance(raw_data["categories"], list):
            categories = [
                cat.get("name", "") if isinstance(cat, dict) else str(cat)
                for cat in raw_data["categories"]
            ]
        
        # Build social links dictionary
        social_links = {}
        for field in ["github_url", "linkedin_url", "twitter_url", "website_url", "whatsapp_url"]:
            if raw_data.get(field):
                # Remove _url suffix for cleaner key names
                key = field.replace("_url", "")
                social_links[key] = raw_data[field]
        
        # Format the profile data
        formatted = {
            "user_id": raw_data.get("id", ""),
            "username": raw_data.get("username", ""),
            "email": raw_data.get("email", ""),
            "location": raw_data.get("location", ""),
            "bio": raw_data.get("bio", ""),
            "availability": raw_data.get("availability", "available"),
            "profile_complete_percentage": raw_data.get("profile_complete_percentage", 0),
            "avatar_url": raw_data.get("avatar_url", ""),
            "skills": skills,
            "categories": categories,
            "social_links": social_links,
            "created_at": raw_data.get("created_at", ""),
            "updated_at": raw_data.get("updated_at", "")
        }
        
        return formatted


# Example usage
if __name__ == "__main__":
    import asyncio
    from .base import ToolRegistry
    
    async def main():
        """Demonstrate profile retrieval tool usage."""
        # Create registry
        registry = ToolRegistry()
        
        # Register profile retrieval tool
        registry.register_tool(ProfileRetrievalTool())
        
        # Test profile retrieval
        print("Testing profile retrieval tool:")
        print("-" * 50)
        
        # Example user ID (replace with actual UUID)
        test_user_id = "550e8400-e29b-41d4-a716-446655440000"
        
        result = await registry.execute_tool(
            tool_name="profile_retrieval",
            parameters={
                "user_id": test_user_id
            }
        )
        
        if result.success:
            profile = result.data
            print(f"Profile retrieved successfully!")
            print(f"Username: {profile['username']}")
            print(f"Email: {profile['email']}")
            print(f"Location: {profile['location']}")
            print(f"Skills: {', '.join(profile['skills']) if profile['skills'] else 'None'}")
            print(f"Availability: {profile['availability']}")
            print(f"Profile completion: {profile['profile_complete_percentage']}%")
            print(f"Social links: {profile['social_links']}")
        else:
            print(f"Profile retrieval failed: {result.error}")
            print(f"Metadata: {result.metadata}")
    
    asyncio.run(main())
