"""
User context API endpoints for Magna AI Agent.

Provides endpoints for fetching user context and profile information.
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status

from .auth import User, get_current_user
from .models import ErrorResponse
from ..utils.logging import get_logger
from ..config import settings

logger = get_logger(__name__)

# Create router
router = APIRouter()


@router.get(
    "/context",
    response_model=Dict[str, Any],
    responses={
        401: {"model": ErrorResponse},
        500: {"model": ErrorResponse}
    }
)
async def get_user_context(
    user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get user context for the authenticated user.
    
    This endpoint returns the user's profile information including name,
    role, skills, experience level, location, and subscription tier.
    The context is fetched from the main backend and cached during JWT
    validation, so this endpoint returns quickly.
    
    Args:
        user: Authenticated user from JWT token
        
    Returns:
        Dict containing user context data
        
    Raises:
        HTTPException: If context retrieval fails
    """
    try:
        logger.info(f"Fetching user context for user {user.id}")
        
        # User context is already fetched and cached during JWT validation
        # in the get_current_user dependency
        if user.context:
            logger.debug(f"Returning cached context for user {user.id}")
            return user.context
        
        # If context is not available (shouldn't happen), return basic info
        logger.warning(f"No cached context for user {user.id}, returning basic info")
        return {
            "userId": user.id,
            "email": user.email,
            "username": user.username
        }
    
    except Exception as e:
        logger.error(f"Error fetching user context: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user context"
        )
