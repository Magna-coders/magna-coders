"""
MCP Tool definitions for accessing main backend data.

This module defines the abstract base class for MCP tools and provides
concrete implementations for all data access tools.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any
import httpx
import logging

from ..utils.retry import retry_async, RetryConfig
from ..utils.circuit_breaker import get_circuit_breaker, CircuitBreakerError
from ..utils.exceptions import NetworkError, ConnectionError, TimeoutError

logger = logging.getLogger(__name__)

# Retry configuration for backend requests
BACKEND_RETRY_CONFIG = RetryConfig(
    max_attempts=3,
    delays=(1.0, 2.0, 4.0),
    retryable_exceptions=(
        httpx.TimeoutException,
        httpx.ConnectError,
        httpx.NetworkError,
        NetworkError,
        ConnectionError,
        TimeoutError,
    )
)


class MCPTool(ABC):
    """
    Abstract base class for MCP tools.
    
    All tools must implement the name, description, and execute methods
    to provide a consistent interface for the MCP server.
    """
    
    @property
    @abstractmethod
    def name(self) -> str:
        """
        Tool name used for registration and invocation.
        
        Returns:
            str: Unique tool identifier
        """
        pass
    
    @property
    @abstractmethod
    def description(self) -> str:
        """
        Tool description for AI agent understanding.
        
        Returns:
            str: Human-readable description of what the tool does
        """
        pass
    
    @abstractmethod
    async def execute(
        self,
        backend_url: str,
        api_key: str,
        user_id: str,
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute the tool with the provided parameters.
        
        Args:
            backend_url: Main backend API base URL
            api_key: API key for authentication
            user_id: ID of the authenticated user
            parameters: Tool-specific parameters
            
        Returns:
            Dict[str, Any]: Tool execution result
            
        Raises:
            Exception: If tool execution fails
        """
        pass


class GetUserContextTool(MCPTool):
    """
    Fetches user profile context including name, role, skills, and preferences.
    """
    
    @property
    def name(self) -> str:
        return "get_user_context"
    
    @property
    def description(self) -> str:
        return (
            "Retrieves user profile information including name, role, skills, "
            "experience level, location, and subscription tier"
        )
    
    async def execute(
        self,
        backend_url: str,
        api_key: str,
        user_id: str,
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Fetch user context from the main backend with retry and circuit breaker.
        
        Args:
            backend_url: Main backend API base URL
            api_key: API key for authentication
            user_id: ID of the authenticated user
            parameters: Tool-specific parameters (unused for this tool)
            
        Returns:
            Dict containing user context data
            
        Raises:
            CircuitBreakerError: If circuit breaker is open
            Exception: If the request fails after retries
            
        Validates: Requirements 13.1, 13.2, 13.6
        """
        # Get circuit breaker for main backend
        circuit_breaker = await get_circuit_breaker(
            name="main_backend",
            failure_threshold=5,
            recovery_timeout=30.0,
            success_threshold=2
        )
        
        @retry_async(config=BACKEND_RETRY_CONFIG, operation_name="get_user_context")
        async def _fetch():
            async with httpx.AsyncClient() as client:
                try:
                    logger.info(f"Fetching user context for user {user_id}")
                    response = await client.get(
                        f"{backend_url}/api/ai/user-context/{user_id}",
                        headers={"X-API-Key": api_key},
                        timeout=5.0
                    )
                    response.raise_for_status()
                    return response.json()
                except httpx.TimeoutException as e:
                    logger.error(f"Timeout fetching user context: {e}")
                    raise TimeoutError(f"Request timeout: {e}")
                except httpx.HTTPStatusError as e:
                    logger.error(f"HTTP error fetching user context: {e}")
                    # Don't retry on 4xx errors (client errors)
                    if 400 <= e.response.status_code < 500:
                        raise Exception(f"HTTP error {e.response.status_code}: {e}")
                    raise NetworkError(f"HTTP error {e.response.status_code}: {e}")
                except (httpx.ConnectError, httpx.NetworkError) as e:
                    logger.error(f"Network error fetching user context: {e}")
                    raise ConnectionError(f"Connection failed: {e}")
                except Exception as e:
                    logger.error(f"Error fetching user context: {e}")
                    raise Exception(f"Failed to fetch user context: {e}")
        
        # Execute through circuit breaker
        return await circuit_breaker.call(_fetch)


class GetUserSkillsTool(MCPTool):
    """
    Fetches user skills with proficiency levels and categories.
    """
    
    @property
    def name(self) -> str:
        return "get_user_skills"
    
    @property
    def description(self) -> str:
        return (
            "Retrieves user skills with proficiency levels (0-100) and categories"
        )
    
    async def execute(
        self,
        backend_url: str,
        api_key: str,
        user_id: str,
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Fetch user skills from the main backend with retry and circuit breaker.
        
        Args:
            backend_url: Main backend API base URL
            api_key: API key for authentication
            user_id: ID of the authenticated user
            parameters: Tool-specific parameters (unused for this tool)
            
        Returns:
            Dict containing user skills data
            
        Raises:
            CircuitBreakerError: If circuit breaker is open
            Exception: If the request fails after retries
            
        Validates: Requirements 13.1, 13.2, 13.6
        """
        # Get circuit breaker for main backend
        circuit_breaker = await get_circuit_breaker(
            name="main_backend",
            failure_threshold=5,
            recovery_timeout=30.0,
            success_threshold=2
        )
        
        @retry_async(config=BACKEND_RETRY_CONFIG, operation_name="get_user_skills")
        async def _fetch():
            async with httpx.AsyncClient() as client:
                try:
                    logger.info(f"Fetching user skills for user {user_id}")
                    response = await client.get(
                        f"{backend_url}/api/ai/user-skills/{user_id}",
                        headers={"X-API-Key": api_key},
                        timeout=5.0
                    )
                    response.raise_for_status()
                    return response.json()
                except httpx.TimeoutException as e:
                    logger.error(f"Timeout fetching user skills: {e}")
                    raise TimeoutError(f"Request timeout: {e}")
                except httpx.HTTPStatusError as e:
                    logger.error(f"HTTP error fetching user skills: {e}")
                    if 400 <= e.response.status_code < 500:
                        raise Exception(f"HTTP error {e.response.status_code}: {e}")
                    raise NetworkError(f"HTTP error {e.response.status_code}: {e}")
                except (httpx.ConnectError, httpx.NetworkError) as e:
                    logger.error(f"Network error fetching user skills: {e}")
                    raise ConnectionError(f"Connection failed: {e}")
                except Exception as e:
                    logger.error(f"Error fetching user skills: {e}")
                    raise Exception(f"Failed to fetch user skills: {e}")
        
        # Execute through circuit breaker
        return await circuit_breaker.call(_fetch)


class GetUserLearningTool(MCPTool):
    """
    Fetches user learning progress including course enrollments and completion status.
    """
    
    @property
    def name(self) -> str:
        return "get_user_learning"
    
    @property
    def description(self) -> str:
        return (
            "Retrieves user learning progress including course enrollments, "
            "progress percentages, and completion status"
        )
    
    async def execute(
        self,
        backend_url: str,
        api_key: str,
        user_id: str,
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Fetch user learning progress from the main backend with retry and circuit breaker.
        
        Args:
            backend_url: Main backend API base URL
            api_key: API key for authentication
            user_id: ID of the authenticated user
            parameters: Tool-specific parameters (unused for this tool)
            
        Returns:
            Dict containing user learning data
            
        Raises:
            CircuitBreakerError: If circuit breaker is open
            Exception: If the request fails after retries
            
        Validates: Requirements 13.1, 13.2, 13.6
        """
        circuit_breaker = await get_circuit_breaker(
            name="main_backend",
            failure_threshold=5,
            recovery_timeout=30.0,
            success_threshold=2
        )
        
        @retry_async(config=BACKEND_RETRY_CONFIG, operation_name="get_user_learning")
        async def _fetch():
            async with httpx.AsyncClient() as client:
                try:
                    logger.info(f"Fetching user learning for user {user_id}")
                    response = await client.get(
                        f"{backend_url}/api/ai/user-learning/{user_id}",
                        headers={"X-API-Key": api_key},
                        timeout=5.0
                    )
                    response.raise_for_status()
                    return response.json()
                except httpx.TimeoutException as e:
                    logger.error(f"Timeout fetching user learning: {e}")
                    raise TimeoutError(f"Request timeout: {e}")
                except httpx.HTTPStatusError as e:
                    logger.error(f"HTTP error fetching user learning: {e}")
                    if 400 <= e.response.status_code < 500:
                        raise Exception(f"HTTP error {e.response.status_code}: {e}")
                    raise NetworkError(f"HTTP error {e.response.status_code}: {e}")
                except (httpx.ConnectError, httpx.NetworkError) as e:
                    logger.error(f"Network error fetching user learning: {e}")
                    raise ConnectionError(f"Connection failed: {e}")
                except Exception as e:
                    logger.error(f"Error fetching user learning: {e}")
                    raise Exception(f"Failed to fetch user learning: {e}")
        
        return await circuit_breaker.call(_fetch)


class GetUserProjectsTool(MCPTool):
    """
    Fetches user projects with descriptions, technologies, and status.
    """
    
    @property
    def name(self) -> str:
        return "get_user_projects"
    
    @property
    def description(self) -> str:
        return (
            "Retrieves user projects including titles, descriptions, "
            "technologies used, and project status"
        )
    
    async def execute(
        self,
        backend_url: str,
        api_key: str,
        user_id: str,
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Fetch user projects from the main backend with retry and circuit breaker.
        
        Args:
            backend_url: Main backend API base URL
            api_key: API key for authentication
            user_id: ID of the authenticated user
            parameters: Tool-specific parameters (unused for this tool)
            
        Returns:
            Dict containing user projects data
            
        Raises:
            CircuitBreakerError: If circuit breaker is open
            Exception: If the request fails after retries
            
        Validates: Requirements 13.1, 13.2, 13.6
        """
        circuit_breaker = await get_circuit_breaker(
            name="main_backend",
            failure_threshold=5,
            recovery_timeout=30.0,
            success_threshold=2
        )
        
        @retry_async(config=BACKEND_RETRY_CONFIG, operation_name="get_user_projects")
        async def _fetch():
            async with httpx.AsyncClient() as client:
                try:
                    logger.info(f"Fetching user projects for user {user_id}")
                    response = await client.get(
                        f"{backend_url}/api/ai/user-projects/{user_id}",
                        headers={"X-API-Key": api_key},
                        timeout=5.0
                    )
                    response.raise_for_status()
                    return response.json()
                except httpx.TimeoutException as e:
                    logger.error(f"Timeout fetching user projects: {e}")
                    raise TimeoutError(f"Request timeout: {e}")
                except httpx.HTTPStatusError as e:
                    logger.error(f"HTTP error fetching user projects: {e}")
                    if 400 <= e.response.status_code < 500:
                        raise Exception(f"HTTP error {e.response.status_code}: {e}")
                    raise NetworkError(f"HTTP error {e.response.status_code}: {e}")
                except (httpx.ConnectError, httpx.NetworkError) as e:
                    logger.error(f"Network error fetching user projects: {e}")
                    raise ConnectionError(f"Connection failed: {e}")
                except Exception as e:
                    logger.error(f"Error fetching user projects: {e}")
                    raise Exception(f"Failed to fetch user projects: {e}")
        
        return await circuit_breaker.call(_fetch)


class SearchCommunityPostsTool(MCPTool):
    """
    Searches community posts with query and limit parameters.
    """
    
    @property
    def name(self) -> str:
        return "search_community_posts"
    
    @property
    def description(self) -> str:
        return (
            "Searches community posts by query string and returns matching posts "
            "with titles, excerpts, authors, and tags"
        )
    
    async def execute(
        self,
        backend_url: str,
        api_key: str,
        user_id: str,
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Search community posts from the main backend with retry and circuit breaker.
        
        Args:
            backend_url: Main backend API base URL
            api_key: API key for authentication
            user_id: ID of the authenticated user
            parameters: Tool-specific parameters:
                - query (str): Search query string
                - limit (int, optional): Maximum number of results (default: 10)
            
        Returns:
            Dict containing search results
            
        Raises:
            CircuitBreakerError: If circuit breaker is open
            Exception: If the request fails after retries
            
        Validates: Requirements 13.1, 13.2, 13.6
        """
        query = parameters.get('query', '')
        limit = parameters.get('limit', 10)
        
        circuit_breaker = await get_circuit_breaker(
            name="main_backend",
            failure_threshold=5,
            recovery_timeout=30.0,
            success_threshold=2
        )
        
        @retry_async(config=BACKEND_RETRY_CONFIG, operation_name="search_community_posts")
        async def _fetch():
            async with httpx.AsyncClient() as client:
                try:
                    logger.info(f"Searching community posts with query: {query}")
                    response = await client.get(
                        f"{backend_url}/api/ai/community-posts",
                        headers={"X-API-Key": api_key},
                        params={"query": query, "limit": limit},
                        timeout=5.0
                    )
                    response.raise_for_status()
                    return response.json()
                except httpx.TimeoutException as e:
                    logger.error(f"Timeout searching community posts: {e}")
                    raise TimeoutError(f"Request timeout: {e}")
                except httpx.HTTPStatusError as e:
                    logger.error(f"HTTP error searching community posts: {e}")
                    if 400 <= e.response.status_code < 500:
                        raise Exception(f"HTTP error {e.response.status_code}: {e}")
                    raise NetworkError(f"HTTP error {e.response.status_code}: {e}")
                except (httpx.ConnectError, httpx.NetworkError) as e:
                    logger.error(f"Network error searching community posts: {e}")
                    raise ConnectionError(f"Connection failed: {e}")
                except Exception as e:
                    logger.error(f"Error searching community posts: {e}")
                    raise Exception(f"Failed to search community posts: {e}")
        
        return await circuit_breaker.call(_fetch)


class GetJobMatchesTool(MCPTool):
    """
    Fetches job matches for a user based on their skills and preferences.
    """
    
    @property
    def name(self) -> str:
        return "get_job_matches"
    
    @property
    def description(self) -> str:
        return (
            "Retrieves job opportunities that match the user's skills and preferences, "
            "including match scores and required skills"
        )
    
    async def execute(
        self,
        backend_url: str,
        api_key: str,
        user_id: str,
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Fetch job matches from the main backend with retry and circuit breaker.
        
        Args:
            backend_url: Main backend API base URL
            api_key: API key for authentication
            user_id: ID of the authenticated user
            parameters: Tool-specific parameters (unused for this tool)
            
        Returns:
            Dict containing job matches data
            
        Raises:
            CircuitBreakerError: If circuit breaker is open
            Exception: If the request fails after retries
            
        Validates: Requirements 13.1, 13.2, 13.6
        """
        circuit_breaker = await get_circuit_breaker(
            name="main_backend",
            failure_threshold=5,
            recovery_timeout=30.0,
            success_threshold=2
        )
        
        @retry_async(config=BACKEND_RETRY_CONFIG, operation_name="get_job_matches")
        async def _fetch():
            async with httpx.AsyncClient() as client:
                try:
                    logger.info(f"Fetching job matches for user {user_id}")
                    response = await client.get(
                        f"{backend_url}/api/ai/job-matches/{user_id}",
                        headers={"X-API-Key": api_key},
                        timeout=5.0
                    )
                    response.raise_for_status()
                    return response.json()
                except httpx.TimeoutException as e:
                    logger.error(f"Timeout fetching job matches: {e}")
                    raise TimeoutError(f"Request timeout: {e}")
                except httpx.HTTPStatusError as e:
                    logger.error(f"HTTP error fetching job matches: {e}")
                    if 400 <= e.response.status_code < 500:
                        raise Exception(f"HTTP error {e.response.status_code}: {e}")
                    raise NetworkError(f"HTTP error {e.response.status_code}: {e}")
                except (httpx.ConnectError, httpx.NetworkError) as e:
                    logger.error(f"Network error fetching job matches: {e}")
                    raise ConnectionError(f"Connection failed: {e}")
                except Exception as e:
                    logger.error(f"Error fetching job matches: {e}")
                    raise Exception(f"Failed to fetch job matches: {e}")
        
        return await circuit_breaker.call(_fetch)
