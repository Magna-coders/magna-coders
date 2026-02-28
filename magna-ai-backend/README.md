# Magna AI Agent

Intelligent career assistant for the Magna platform providing personalized opportunity recommendations, collaboration matching, interview preparation, and document submission automation.

## Architecture

The Magna AI Agent is built with a privacy-first approach using:
- **Multi-Model LLM Support**: Gemini (primary), GPT-4 (fallback), Ollama (local)
- **Device-Side Memory**: Local storage with optional encrypted sync
- **ReAct Pattern**: Structured reasoning (Analyze → Plan → Act → Respond)
- **Tool-Augmented Intelligence**: External APIs extend agent capabilities

## Directory Structure

```
magna_ai/
├── backend/              # Python FastAPI service
│   ├── agent/           # Core agent implementation
│   ├── llm/             # LLM orchestration
│   ├── memory/          # Memory system
│   ├── tools/           # Tool registry and implementations
│   ├── matching/        # Opportunity and collaboration matching
│   ├── interview/       # Interview preparation module
│   ├── documents/       # Document management
│   ├── api/             # FastAPI endpoints
│   ├── models/          # Data models
│   ├── utils/           # Utility functions
│   └── tests/           # Backend tests
└── frontend/            # React components (in main frontend/)
    ├── components/      # Chat UI components
    ├── hooks/           # Custom hooks
    ├── services/        # API client
    └── tests/           # Frontend tests
```

## Getting Started

### Backend Setup

1. Create conda environment (recommended):
```bash
cd magna-coders/magna-ai-backend
bash setup_conda.sh
conda activate magna_ai
```

2. Install dependencies (if not using setup script):
```bash
pip install -r requirements.txt
```

3. Configure environment variables in `backend/.env`:
```env
GEMINI_API_KEY=your_api_key_here
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_32_char_encryption_key
DATABASE_URL=sqlite:///./magna_ai.db
environment=development
```

4. Start development server:
```bash
bash start.sh
# Or manually: uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The server will start on `http://localhost:8000`

### Development Mode

The backend runs in development mode by default (`environment=development` in `.env`), which:
- Accepts invalid or missing JWT tokens
- Uses a default dev user for all requests
- Allows frontend testing without authentication setup

For production, set `environment=production` to enforce authentication.

### API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/api/docs`
- ReDoc: `http://localhost:8000/api/redoc`
- Health Check: `http://localhost:8000/health`

### Frontend Setup

Frontend components are integrated into the main Next.js application at `magna-coders/frontend/src/magna-ai/`.

## Testing

### Backend Tests
```bash
# Unit tests
pytest tests/unit/

# Property-based tests
pytest tests/property/

# Integration tests
pytest tests/integration/

# All tests
pytest
```

### Frontend Tests
```bash
cd magna-coders/frontend
npm test
```

## Documentation

- [Requirements](/.kiro/specs/magna-ai-agent/requirements.md)
- [Design](/.kiro/specs/magna-ai-agent/design.md)
- [Tasks](/.kiro/specs/magna-ai-agent/tasks.md)
