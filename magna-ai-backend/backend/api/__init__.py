"""
API module for Magna AI Agent.
"""

from .chat import router as chat_router
from .health import router as health_router
from .websocket import router as websocket_router
from .user_data import router as user_data_router
from .user import router as user_router
from .models import (
    ChatMessageRequest,
    ChatMessageResponse,
    ConversationSummary,
    ConversationDetail,
    ConsentRequest,
    ConsentResponse,
    ConsentResult,
    HealthStatus,
    ErrorResponse
)

__all__ = [
    "chat_router",
    "health_router",
    "websocket_router",
    "user_data_router",
    "user_router",
    "ChatMessageRequest",
    "ChatMessageResponse",
    "ConversationSummary",
    "ConversationDetail",
    "ConsentRequest",
    "ConsentResponse",
    "ConsentResult",
    "HealthStatus",
    "ErrorResponse"
]
