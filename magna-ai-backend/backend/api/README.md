# Magna AI Agent API

FastAPI backend service for the Magna AI Agent with RESTful endpoints, WebSocket support, and rate limiting.

## Overview

This module implements the complete backend API for the Magna AI Agent, providing:

- RESTful HTTP endpoints for chat interactions
- WebSocket endpoint for real-time streaming
- Authentication middleware using JWT tokens
- Rate limiting to prevent abuse
- Health check endpoints for monitoring

## Architecture

```
api/
├── __init__.py          # Module exports
├── models.py            # Pydantic request/response models
├── auth.py              # JWT authentication middleware
├── chat.py              # Chat endpoints (HTTP)
├── websocket.py         # WebSocket endpoint for real-time chat
├── health.py            # Health check endpoints
└── rate_limit.py        # Rate limiting middleware
```

## Endpoints

### Chat Endpoints

#### POST /api/chat/message
Send a message to the AI agent and receive a response.

**Request:**
```json
{
  "message": "Find me Python jobs in San Francisco",
  "conversation_id": "optional-conversation-id",
  "stream": true
}
```

**Response (non-streaming):**
```json
{
  "conversation_id": "uuid",
  "message_id": "uuid",
  "content": "Agent response text",
  "timestamp": "2024-01-01T00:00:00Z",
  "tool_calls": [...],
  "results": [...],
  "requires_consent": {...}
}
```

**Response (streaming):**
Server-Sent Events (SSE) stream with chunks:
```
data: chunk content
data: chunk content
data: [DONE]
```

#### GET /api/chat/conversations
List user's conversation history.

**Query Parameters:**
- `limit` (int, default: 20): Maximum conversations to return
- `offset` (int, default: 0): Number to skip for pagination

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Conversation title",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "message_count": 10,
    "last_message_preview": "Preview text..."
  }
]
```

#### GET /api/chat/conversations/{conversation_id}
Get detailed conversation with all messages.

**Response:**
```json
{
  "id": "uuid",
  "title": "Conversation title",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "Message text",
      "timestamp": "2024-01-01T00:00:00Z",
      "tool_calls": [...],
      "results": [...]
    }
  ]
}
```

#### POST /api/chat/consent
Handle user consent for document submission or data sharing.

**Request:**
```json
{
  "consent_request_id": "uuid",
  "approved": true
}
```

**Response:**
```json
{
  "consent_request_id": "uuid",
  "status": "approved",
  "consent_token": "token-for-approved-action",
  "message": "Consent approved. You may proceed with the action."
}
```

### WebSocket Endpoint

#### WS /ws/chat
Real-time chat with streaming responses.

**Connection:**
```
ws://localhost:8000/ws/chat?token=<jwt-token>
```

**Client Messages:**
```json
{
  "type": "message",
  "message": "User message text",
  "conversation_id": "optional-uuid"
}
```

**Server Messages:**
```json
// Conversation ID
{"type": "conversation_id", "conversation_id": "uuid"}

// Response chunks
{"type": "chunk", "content": "text chunk"}

// Tool calls
{"type": "tool_calls", "tool_calls": [...]}

// Results
{"type": "results", "results": [...]}

// Consent required
{"type": "consent_required", "consent_request": {...}}

// Completion
{"type": "done"}

// Errors
{"type": "error", "error": "error message"}
```

**Ping/Pong:**
```json
// Client ping
{"type": "ping"}

// Server pong
{"type": "pong"}
```

### Health Endpoints

#### GET /api/health
Comprehensive health check with component statuses.

**Response:**
```json
{
  "status": "healthy",
  "service": "magna-ai-agent",
  "version": "1.0.0",
  "llm_providers": {...},
  "database": "connected",
  "vector_db": "connected"
}
```

#### GET /api/ready
Kubernetes readiness probe.

**Response:**
```json
{"status": "ready"}
```

#### GET /api/live
Kubernetes liveness probe.

**Response:**
```json
{"status": "alive"}
```

## Authentication

All endpoints (except health checks) require JWT authentication.

**Header:**
```
Authorization: Bearer <jwt-token>
```

**Token Payload:**
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "username": "username",
  "exp": 1234567890
}
```

The JWT secret is configured via the `JWT_SECRET` environment variable.

## Rate Limiting

Rate limiting is enforced using a token bucket algorithm:

- **Default Limit:** 60 requests per minute per user
- **Identification:** By user ID (from JWT) or IP address (fallback)
- **Response:** 429 Too Many Requests when limit exceeded

**Rate Limit Headers:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1234567890
Retry-After: 30
```

**Configuration:**
Set `RATE_LIMIT_PER_MINUTE` in environment variables to override default.

## Error Handling

All errors return consistent JSON format:

```json
{
  "error": "error_type",
  "message": "Human-readable error message",
  "detail": "Additional details (optional)",
  "request_id": "uuid (optional)"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (no auth header)
- `404` - Not Found
- `422` - Unprocessable Entity (invalid data format)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `503` - Service Unavailable (health check failed)

## CORS Configuration

CORS is configured to allow requests from specified origins:

**Environment Variable:**
```
CORS_ORIGINS=http://localhost:3000,https://app.magna.com
```

**Allowed Methods:** All
**Allowed Headers:** All
**Credentials:** Enabled

## Running the Server

### Development
```bash
cd magna-coders/backend/magna-coders-backend/src/magna_ai/backend
source venv/bin/activate
python main.py
```

Server runs on `http://localhost:8000` by default.

### Production
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Docker
```bash
docker build -t magna-ai-agent .
docker run -p 8000:8000 magna-ai-agent
```

## Configuration

All configuration is managed via environment variables (see `config.py`):

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `GEMINI_API_KEY` - Google Gemini API key
- `JWT_SECRET` - Secret for JWT token validation
- `ENCRYPTION_KEY` - Key for data encryption

**Optional:**
- `OPENAI_API_KEY` - OpenAI API key (fallback LLM)
- `SERPAPI_API_KEY` - SerpAPI key for web search
- `AWS_ACCESS_KEY_ID` - AWS credentials for S3
- `AWS_SECRET_ACCESS_KEY` - AWS credentials for S3
- `PINECONE_API_KEY` - Pinecone API key for vector DB
- `API_HOST` - Server host (default: 0.0.0.0)
- `API_PORT` - Server port (default: 8000)
- `RATE_LIMIT_PER_MINUTE` - Rate limit (default: 60)
- `CORS_ORIGINS` - Allowed CORS origins (default: http://localhost:3000)

## Testing

Run integration tests:
```bash
pytest tests/integration/test_api_basic.py -v
```

Run all tests with coverage:
```bash
pytest tests/ --cov=. --cov-report=html
```

## API Documentation

Interactive API documentation is available at:
- Swagger UI: `http://localhost:8000/api/docs`
- ReDoc: `http://localhost:8000/api/redoc`

## Next Steps

To complete the backend implementation:

1. **Agent Integration:** Wire up the MagnaAgent instance in endpoints
2. **Database:** Implement conversation and message storage
3. **Memory Sync:** Connect memory system to backend storage
4. **Tool Execution:** Enable actual tool calls in agent processing
5. **Monitoring:** Add logging, metrics, and alerting
6. **Deployment:** Configure production environment and CI/CD

## Dependencies

Key dependencies:
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `pydantic` - Data validation
- `python-jose` - JWT handling
- `sse-starlette` - Server-Sent Events
- `structlog` - Structured logging

See `requirements.txt` for complete list.

