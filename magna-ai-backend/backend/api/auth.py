"""
Authentication middleware for Magna AI Agent API.

Integrates with existing Magna platform authentication.
"""

from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from cachetools import TTLCache
import httpx

from ..config import settings
from ..utils.logging import get_logger

logger = get_logger(__name__)

# Security scheme for JWT bearer tokens
security = HTTPBearer()

# Token validation cache (5 minute TTL)
_token_cache: TTLCache = TTLCache(maxsize=1000, ttl=300)


class User:
    """User model for authenticated requests."""
    
    def __init__(self, user_id: str, email: str, username: str, context: Optional[Dict[str, Any]] = None):
        self.id = user_id
        self.email = email
        self.username = username
        self.context = context or {}


async def validate_jwt_with_backend(token: str) -> Dict[str, Any]:
    """
    Validate JWT token with the main backend and fetch user context.
    
    This function validates the token by decoding it locally first,
    then fetches the user context from the main backend to ensure
    the user still exists and has valid permissions.
    
    Args:
        token: JWT token to validate
        
    Returns:
        Dict containing user_id and user context
        
    Raises:
        HTTPException: If token is invalid or backend validation fails
    """
    # Check cache first
    if token in _token_cache:
        logger.debug("Token validation cache hit")
        return _token_cache[token]
    
    try:
        # Decode JWT token locally first
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=["HS256"]
        )
        
        user_id: str = payload.get("sub")
        if not user_id:
            raise ValueError("Token missing user ID")
        
        # Fetch user context from main backend to validate user still exists
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{settings.backend_api_url}/api/ai/user-context/{user_id}",
                    headers={
                        "X-API-Key": settings.backend_api_key,
                        "Authorization": f"Bearer {token}"
                    },
                    timeout=5.0
                )
                response.raise_for_status()
                backend_response = response.json()
                
                # Extract user context from the response
                # Main backend returns {success: true, data: {...}}
                user_context = backend_response.get("data", backend_response) if isinstance(backend_response, dict) else backend_response
                
                # Cache the validated token with user context
                validation_result = {
                    "user_id": user_id,
                    "email": payload.get("email", ""),
                    "username": payload.get("username", ""),
                    "context": user_context
                }
                
                _token_cache[token] = validation_result
                logger.info(f"Token validated and cached for user {user_id}")
                
                return validation_result
                
            except httpx.HTTPStatusError as e:
                logger.error(f"Backend validation failed: {e.response.status_code}")
                if e.response.status_code == 401:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid API key or unauthorized",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
                elif e.response.status_code == 404:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="User not found",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
                else:
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="Backend service unavailable",
                    )
            except httpx.TimeoutException:
                logger.error("Backend validation timeout")
                raise HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail="Backend validation timeout",
                )
            except httpx.RequestError as e:
                logger.error(f"Backend request error: {e}")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Backend service unavailable",
                )
                
    except JWTError as e:
        logger.warning(f"JWT validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except ValueError as e:
        logger.warning(f"Token validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """
    Extract and validate JWT token from request.
    
    Validates the token with the main backend and fetches user context.
    Results are cached for 5 minutes to reduce backend load.
    
    Args:
        credentials: HTTP authorization credentials with bearer token
        
    Returns:
        User object with authenticated user information and context
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    token = credentials.credentials
    
    try:
        # Validate token with backend (uses cache if available)
        validation_result = await validate_jwt_with_backend(token)
        
        return User(
            user_id=validation_result["user_id"],
            email=validation_result["email"],
            username=validation_result["username"],
            context=validation_result["context"]
        )
        
    except HTTPException:
        raise


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> User:
    """
    Extract and validate JWT token from request, or create dev user if no token in development.
    
    This allows the frontend to work without authentication during development.
    In production, authentication is always required.
    
    Args:
        credentials: Optional HTTP authorization credentials with bearer token
        
    Returns:
        User object with authenticated user information or dev user
        
    Raises:
        HTTPException: If token is invalid or expired (production only)
    """
    # If no credentials provided and in development, return dev user
    if credentials is None:
        if settings.environment == "development":
            logger.info("No auth token provided, using development user")
            return User(
                user_id="dev_user_123",
                email="dev@example.com",
                username="devuser",
                context={}
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    # If credentials provided, try to validate them
    try:
        token = credentials.credentials
        validation_result = await validate_jwt_with_backend(token)
        
        return User(
            user_id=validation_result["user_id"],
            email=validation_result["email"],
            username=validation_result["username"],
            context=validation_result["context"]
        )
        
    except HTTPException as e:
        # In development, fall back to dev user if token is invalid
        if settings.environment == "development":
            logger.info(f"Invalid token in development mode, using dev user: {e.detail}")
            return User(
                user_id="dev_user_123",
                email="dev@example.com",
                username="devuser",
                context={}
            )
        else:
            # In production, reject invalid tokens
            raise


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[User]:
    """
    Extract user from token if provided, otherwise return None.
    
    Useful for endpoints that work with or without authentication.
    
    Args:
        credentials: Optional HTTP authorization credentials
        
    Returns:
        User object if authenticated, None otherwise
    """
    if credentials is None:
        return None
        
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None

