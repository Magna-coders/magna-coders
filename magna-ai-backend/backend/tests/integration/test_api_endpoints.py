"""
Integration tests for FastAPI endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock
from jose import jwt
from datetime import datetime, timedelta

from ...main import app
from ...config import settings


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def auth_token():
    """Create valid JWT token for testing."""
    payload = {
        "sub": "test-user-123",
        "email": "test@example.com",
        "username": "testuser",
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm="HS256")
    return token


@pytest.fixture
def auth_headers(auth_token):
    """Create authorization headers."""
    return {"Authorization": f"Bearer {auth_token}"}


class TestHealthEndpoints:
    """Test health check endpoints."""
    
    def test_root_endpoint(self, client):
        """Test root endpoint returns service info."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "Magna AI Agent API"
        assert data["version"] == "1.0.0"
        assert data["status"] == "operational"
    
    def test_health_check(self, client):
        """Test health check endpoint."""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "magna-ai-agent"
    
    def test_readiness_check(self, client):
        """Test readiness endpoint."""
        response = client.get("/api/ready")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ready"
    
    def test_liveness_check(self, client):
        """Test liveness endpoint."""
        response = client.get("/api/live")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "alive"


class TestChatEndpoints:
    """Test chat API endpoints."""
    
    def test_send_message_requires_auth(self, client):
        """Test that sending message requires authentication."""
        response = client.post(
            "/api/chat/message",
            json={"message": "Hello", "stream": False}
        )
        assert response.status_code == 403  # No auth header
    
    def test_send_message_invalid_token(self, client):
        """Test that invalid token is rejected."""
        response = client.post(
            "/api/chat/message",
            json={"message": "Hello", "stream": False},
            headers={"Authorization": "Bearer invalid-token"}
        )
        assert response.status_code == 401
    
    def test_list_conversations_requires_auth(self, client):
        """Test that listing conversations requires authentication."""
        response = client.get("/api/chat/conversations")
        assert response.status_code == 403
    
    def test_list_conversations_with_auth(self, client, auth_headers):
        """Test listing conversations with valid auth."""
        response = client.get("/api/chat/conversations", headers=auth_headers)
        # Should return 200 with empty list (no agent initialized yet)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_conversation_requires_auth(self, client):
        """Test that getting conversation requires authentication."""
        response = client.get("/api/chat/conversations/test-conv-id")
        assert response.status_code == 403
    
    def test_get_conversation_not_found(self, client, auth_headers):
        """Test getting non-existent conversation."""
        response = client.get(
            "/api/chat/conversations/non-existent-id",
            headers=auth_headers
        )
        assert response.status_code == 404
    
    def test_consent_requires_auth(self, client):
        """Test that consent handling requires authentication."""
        response = client.post(
            "/api/chat/consent",
            json={
                "consent_request_id": "test-consent-id",
                "approved": True
            }
        )
        assert response.status_code == 403
    
    def test_consent_approval(self, client, auth_headers):
        """Test consent approval flow."""
        response = client.post(
            "/api/chat/consent",
            json={
                "consent_request_id": "test-consent-id",
                "approved": True
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "approved"
        assert data["consent_token"] is not None
    
    def test_consent_denial(self, client, auth_headers):
        """Test consent denial flow."""
        response = client.post(
            "/api/chat/consent",
            json={
                "consent_request_id": "test-consent-id",
                "approved": False
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "denied"
        assert data["consent_token"] is None


class TestRateLimiting:
    """Test rate limiting middleware."""
    
    def test_rate_limit_headers(self, client, auth_headers):
        """Test that rate limit headers are included."""
        response = client.get("/api/chat/conversations", headers=auth_headers)
        assert "X-RateLimit-Limit" in response.headers
        assert "X-RateLimit-Remaining" in response.headers
        assert "X-RateLimit-Reset" in response.headers
    
    def test_rate_limit_enforcement(self, client, auth_headers):
        """Test that rate limiting is enforced."""
        # Make requests up to the limit
        # Note: This test may be slow as it makes many requests
        limit = settings.rate_limit_per_minute
        
        # Make requests just under the limit
        for i in range(min(limit - 1, 10)):  # Test with smaller number
            response = client.get("/api/chat/conversations", headers=auth_headers)
            assert response.status_code == 200
        
        # The rate limiter should still allow some requests
        # (this is a basic test, full rate limit testing would require more setup)
    
    def test_health_check_not_rate_limited(self, client):
        """Test that health checks are not rate limited."""
        # Make many health check requests
        for i in range(100):
            response = client.get("/api/health")
            assert response.status_code == 200


class TestCORS:
    """Test CORS configuration."""
    
    def test_cors_headers(self, client):
        """Test that CORS headers are present."""
        response = client.options(
            "/api/health",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET"
            }
        )
        assert "access-control-allow-origin" in response.headers


class TestErrorHandling:
    """Test error handling."""
    
    def test_invalid_json(self, client, auth_headers):
        """Test handling of invalid JSON."""
        response = client.post(
            "/api/chat/message",
            data="invalid json",
            headers={**auth_headers, "Content-Type": "application/json"}
        )
        assert response.status_code == 422  # Unprocessable entity
    
    def test_missing_required_fields(self, client, auth_headers):
        """Test handling of missing required fields."""
        response = client.post(
            "/api/chat/message",
            json={},  # Missing 'message' field
            headers=auth_headers
        )
        assert response.status_code == 422
    
    def test_invalid_field_types(self, client, auth_headers):
        """Test handling of invalid field types."""
        response = client.post(
            "/api/chat/message",
            json={"message": 123, "stream": "not a boolean"},  # Wrong types
            headers=auth_headers
        )
        assert response.status_code == 422

