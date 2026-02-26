"""
Basic integration tests for FastAPI endpoints (without full app initialization).
"""

import pytest
from jose import jwt
from datetime import datetime, timedelta


def test_jwt_token_creation():
    """Test JWT token creation and validation."""
    from ...config import settings
    
    payload = {
        "sub": "test-user-123",
        "email": "test@example.com",
        "username": "testuser",
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    
    # Create token
    token = jwt.encode(payload, settings.jwt_secret, algorithm="HS256")
    assert token is not None
    
    # Decode token
    decoded = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    assert decoded["sub"] == "test-user-123"
    assert decoded["email"] == "test@example.com"


def test_api_models_import():
    """Test that API models can be imported."""
    from ...api.models import (
        ChatMessageRequest,
        ChatMessageResponse,
        ConversationSummary,
        ConsentRequest,
        ConsentResponse,
        HealthStatus
    )
    
    # Test model instantiation
    request = ChatMessageRequest(message="Hello", stream=True)
    assert request.message == "Hello"
    assert request.stream is True
    assert request.conversation_id is None


def test_rate_limit_token_bucket():
    """Test token bucket rate limiting logic."""
    from ...api.rate_limit import TokenBucket
    import time
    
    # Create bucket with 10 tokens, refill 1 per second
    bucket = TokenBucket(capacity=10, refill_rate=1.0)
    
    # Should be able to consume 10 tokens
    for i in range(10):
        assert bucket.consume(1) is True
    
    # 11th token should fail
    assert bucket.consume(1) is False
    
    # Wait for refill
    time.sleep(1.1)
    
    # Should be able to consume 1 token now
    assert bucket.consume(1) is True


def test_auth_module_import():
    """Test that auth module can be imported."""
    from ...api.auth import User, get_current_user
    
    # Test User class
    user = User(user_id="123", email="test@example.com", username="testuser")
    assert user.id == "123"
    assert user.email == "test@example.com"


def test_websocket_connection_manager():
    """Test WebSocket connection manager."""
    from ...api.websocket import ConnectionManager
    
    manager = ConnectionManager()
    
    # Initially no connections
    assert len(manager.active_connections) == 0
    
    # Test disconnect (should not error on non-existent connection)
    manager.disconnect("test-user")
    assert len(manager.active_connections) == 0


def test_api_routers_import():
    """Test that API routers can be imported."""
    from ...api import chat_router, health_router, websocket_router
    
    assert chat_router is not None
    assert health_router is not None
    assert websocket_router is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

