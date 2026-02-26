"""
Model selection API endpoints.

Allows users to view and select different LLM models.
"""

from typing import List, Dict
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from .auth import User, get_current_user_optional
from ..utils.logging import get_logger
from ..config import settings

logger = get_logger(__name__)

router = APIRouter()

# Global variable to store user model preferences (in-memory for now)
# In production, this should be stored in database
USER_MODEL_PREFERENCES: Dict[str, str] = {}


class ModelInfo(BaseModel):
    """Information about an available model."""
    id: str
    name: str
    provider: str
    description: str
    capabilities: List[str]
    is_default: bool


class ModelSelectionRequest(BaseModel):
    """Request to change the active model."""
    model_id: str


class ModelSelectionResponse(BaseModel):
    """Response after changing model."""
    success: bool
    model_id: str
    message: str


# Available models
AVAILABLE_MODELS = [
    {
        "id": "meta/llama-3.1-8b-instruct",
        "name": "Llama 3.1 8B",
        "provider": "NVIDIA NIM",
        "description": "Faster, lightweight model. Quick responses for simple queries (3-5s).",
        "capabilities": ["general", "conversation", "fast"],
        "is_default": True
    },
    {
        "id": "meta/llama-3.1-70b-instruct",
        "name": "Llama 3.1 70B",
        "provider": "NVIDIA NIM",
        "description": "High-quality general-purpose model. Balanced performance for most tasks (5-10s).",
        "capabilities": ["general", "coding", "conversation"],
        "is_default": False
    },
    {
        "id": "deepseek-ai/deepseek-v3.2",
        "name": "DeepSeek V3.2",
        "provider": "NVIDIA NIM",
        "description": "Advanced reasoning model with thinking process. Best for complex problem-solving (20-30s).",
        "capabilities": ["reasoning", "coding", "analysis", "math"],
        "is_default": False
    },
    {
        "id": "gemini-2.5-flash",
        "name": "Gemini 2.5 Flash",
        "provider": "Google",
        "description": "Google's fast model. Good for general tasks (20 requests/day limit).",
        "capabilities": ["general", "conversation"],
        "is_default": False
    }
]


def get_user_model(user_id: str) -> str:
    """Get the selected model for a user, or default."""
    return USER_MODEL_PREFERENCES.get(user_id, settings.nvidia_nim_model)


@router.get("/models", response_model=List[ModelInfo])
async def list_models(user: User = Depends(get_current_user_optional)):
    """
    Get list of available LLM models.
    
    Returns:
        List of available models with their capabilities
    """
    logger.info(f"User {user.id} requested model list")
    
    # Mark the user's currently selected model as default
    user_model = get_user_model(user.id)
    models = []
    for model in AVAILABLE_MODELS:
        model_copy = model.copy()
        model_copy["is_default"] = (model["id"] == user_model)
        models.append(ModelInfo(**model_copy))
    
    return models


@router.post("/models/select", response_model=ModelSelectionResponse)
async def select_model(
    request: ModelSelectionRequest,
    user: User = Depends(get_current_user_optional)
):
    """
    Select a different LLM model for the user's session.
    
    Args:
        request: Model selection request with model_id
        user: Authenticated user
        
    Returns:
        Success response with selected model info
    """
    logger.info(f"User {user.id} selected model: {request.model_id}")
    
    # Validate model exists
    model = next((m for m in AVAILABLE_MODELS if m["id"] == request.model_id), None)
    
    if not model:
        return ModelSelectionResponse(
            success=False,
            model_id=request.model_id,
            message=f"Model '{request.model_id}' not found"
        )
    
    # Store user preference in memory
    USER_MODEL_PREFERENCES[user.id] = request.model_id
    logger.info(f"Updated model preference for user {user.id} to {request.model_id}")
    
    return ModelSelectionResponse(
        success=True,
        model_id=request.model_id,
        message=f"Successfully switched to {model['name']}"
    )
