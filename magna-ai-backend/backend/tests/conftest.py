"""
Pytest configuration and fixtures for Magna AI Agent tests.
"""

import pytest
from typing import AsyncGenerator
from httpx import AsyncClient
from fastapi import FastAPI


@pytest.fixture
def app() -> FastAPI:
    """Create FastAPI application instance for testing."""
    from ..main import app
    return app


@pytest.fixture
async def client(app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    """Create async HTTP client for testing API endpoints."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def mock_user_id() -> str:
    """Mock user ID for testing."""
    return "test-user-123"


@pytest.fixture
def mock_conversation_id() -> str:
    """Mock conversation ID for testing."""
    return "test-conv-456"


# Add more fixtures as needed for testing
