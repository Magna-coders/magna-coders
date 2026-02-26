# Magna AI Agent Deployment Guide

## Overview

This guide covers deploying the Magna AI Agent backend alongside the existing Magna Coders platform.

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL database (shared with main platform)
- Google Gemini API key
- (Optional) OpenAI API key
- (Optional) AWS S3 credentials
- (Optional) SerpAPI key

## Quick Start (Development)

### 1. Clone and Setup

```bash
cd magna-coders/magna-ai-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

Create `backend/.env`:

```bash
# Database (shared with main platform)
DATABASE_URL=postgresql://user:password@localhost:5432/magna_coders

# LLM Providers
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here  # Optional
OLLAMA_BASE_URL=http://localhost:11434   # Optional

# Security (MUST match main backend)
JWT_SECRET=your_shared_jwt_secret_here
ENCRYPTION_KEY=your_32_byte_encryption_key_here

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:3000

# Optional Services
SERPAPI_API_KEY=your_serpapi_key_here
AWS_ACCESS_KEY_ID=your_aws_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_here
PINECONE_API_KEY=your_pinecone_key_here

# Feature Flags
ENABLE_LOCAL_MODELS=false
ENABLE_ANALYTICS=true
```

### 3. Run Backend

```bash
cd backend
python main.py
```

The API will be available at:
- http://localhost:8000
- Docs: http://localhost:8000/api/docs
- Health: http://localhost:8000/health

## Docker Deployment

### 1. Build Docker Image

```bash
cd magna-coders/magna-ai-backend

docker build -t magna-ai-agent:latest .
```

### 2. Run Container

```bash
docker run -d \
  --name magna-ai-agent \
  -p 8000:8000 \
  -e DATABASE_URL=postgresql://user:password@host.docker.internal:5432/magna_coders \
  -e JWT_SECRET=your_secret_here \
  -e GEMINI_API_KEY=your_key_here \
  -e CORS_ORIGINS=http://localhost:3000 \
  magna-ai-agent:latest
```

### 3. Check Logs

```bash
docker logs -f magna-ai-agent
```

## Docker Compose Integration

### Update Root docker-compose.yml

Add the AI Agent service to the existing `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # Existing services
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: magna_coders
      POSTGRES_USER: magna
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - magna-network

  backend:
    build: ./backend/magna-coders-backend
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://magna:${POSTGRES_PASSWORD}@postgres:5432/magna_coders
      JWT_SECRET: ${JWT_SECRET}
      PORT: 5000
    depends_on:
      - postgres
    networks:
      - magna-network

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:5000
      NEXT_PUBLIC_MAGNA_AI_API_URL: http://localhost:8000
    depends_on:
      - backend
      - ai-agent
    networks:
      - magna-network

  # New AI Agent service
  ai-agent:
    build: ./magna-ai-backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://magna:${POSTGRES_PASSWORD}@postgres:5432/magna_coders
      JWT_SECRET: ${JWT_SECRET}
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      SERPAPI_API_KEY: ${SERPAPI_API_KEY}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
      PINECONE_API_KEY: ${PINECONE_API_KEY}
      CORS_ORIGINS: http://localhost:3000
      API_HOST: 0.0.0.0
      API_PORT: 8000
      LOG_LEVEL: INFO
      ENABLE_ANALYTICS: "true"
    depends_on:
      - postgres
    networks:
      - magna-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  magna-network:
    driver: bridge

volumes:
  postgres_data:
```

### Create .env File

Create `.env` in the root directory:

```bash
# Database
POSTGRES_PASSWORD=your_secure_password_here

# Shared Secrets
JWT_SECRET=your_shared_jwt_secret_here
ENCRYPTION_KEY=your_32_byte_encryption_key_here

# AI Agent API Keys
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
SERPAPI_API_KEY=your_serpapi_key_here

# AWS Credentials
AWS_ACCESS_KEY_ID=your_aws_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_here

# Vector Database
PINECONE_API_KEY=your_pinecone_key_here
```

### Start All Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f ai-agent

# Check status
docker-compose ps

# Stop all services
docker-compose down
```

## Production Deployment

### 1. Use Production WSGI Server

Update Dockerfile to use Gunicorn with Uvicorn workers:

```dockerfile
# Install gunicorn
RUN pip install gunicorn

# Run with gunicorn
CMD ["gunicorn", "backend.main:app", \
     "--workers", "4", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
```

### 2. Configure Nginx Reverse Proxy

Create `nginx.conf`:

```nginx
upstream magna_backend {
    server backend:5000;
}

upstream magna_ai {
    server ai-agent:8000;
}

server {
    listen 80;
    server_name magna-coders.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name magna-coders.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # Main backend API
    location /api/ {
        proxy_pass http://magna_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # AI Agent API
    location /api/ai/ {
        proxy_pass http://magna_ai/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts for streaming
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    # WebSocket endpoint
    location /ws/ {
        proxy_pass http://magna_ai/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Frontend
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Add Nginx to docker-compose.yml:

```yaml
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - ai-agent
      - frontend
    networks:
      - magna-network
```

### 3. Environment Configuration

Production `.env`:

```bash
# Use production database
DATABASE_URL=postgresql://magna:password@prod-db.example.com:5432/magna_coders

# Production secrets
JWT_SECRET=production_secret_here
ENCRYPTION_KEY=production_key_here

# Production URLs
CORS_ORIGINS=https://magna-coders.com

# Logging
LOG_LEVEL=WARNING
LOG_FORMAT=json

# Performance
API_WORKERS=4
RATE_LIMIT_PER_MINUTE=100

# Features
ENABLE_ANALYTICS=true
ENABLE_MEMORY_SYNC=true
```

### 4. Database Migrations

Run migrations before deployment:

```bash
# Using Alembic (if configured)
alembic upgrade head

# Or using Prisma (from main backend)
cd backend/magna-coders-backend
npx prisma migrate deploy
```

### 5. Health Checks

Configure health checks for monitoring:

```yaml
  ai-agent:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### 6. Monitoring and Logging

#### Centralized Logging

Use a logging service like ELK Stack or CloudWatch:

```python
# In backend/utils/logging.py
import logging
from pythonjsonlogger import jsonlogger

def setup_logging():
    logger = logging.getLogger()
    handler = logging.StreamHandler()
    formatter = jsonlogger.JsonFormatter()
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
```

#### Metrics Collection

Use Prometheus for metrics:

```yaml
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    networks:
      - magna-network
```

## Scaling

### Horizontal Scaling

Scale AI Agent instances:

```bash
docker-compose up -d --scale ai-agent=3
```

### Load Balancing

Use Nginx or HAProxy for load balancing:

```nginx
upstream magna_ai_cluster {
    least_conn;
    server ai-agent-1:8000;
    server ai-agent-2:8000;
    server ai-agent-3:8000;
}
```

### Database Connection Pooling

Configure connection pooling:

```python
# In config.py
database_pool_size: int = 20
database_max_overflow: int = 10
```

## Backup and Recovery

### Database Backups

```bash
# Backup
docker exec postgres pg_dump -U magna magna_coders > backup.sql

# Restore
docker exec -i postgres psql -U magna magna_coders < backup.sql
```

### Configuration Backups

```bash
# Backup environment variables
cp .env .env.backup

# Backup docker-compose
cp docker-compose.yml docker-compose.yml.backup
```

## Troubleshooting

### Check Service Status

```bash
docker-compose ps
docker-compose logs ai-agent
```

### Test API Connectivity

```bash
# Health check
curl http://localhost:8000/health

# Test with auth
curl -X POST http://localhost:8000/api/chat/message \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "stream": false}'
```

### Database Connection Issues

```bash
# Test database connection
docker exec ai-agent python -c "
from backend.config import settings
import psycopg2
conn = psycopg2.connect(settings.database_url)
print('Database connection successful')
"
```

### Memory Issues

```bash
# Check memory usage
docker stats ai-agent

# Increase memory limit
docker-compose.yml:
  ai-agent:
    deploy:
      resources:
        limits:
          memory: 2G
```

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Rotate JWT secrets regularly
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Enable database SSL
- [ ] Implement request validation
- [ ] Set up monitoring and alerts
- [ ] Regular security updates
- [ ] Backup encryption keys

## Monitoring Checklist

- [ ] Health check endpoint working
- [ ] Logs being collected
- [ ] Metrics being tracked
- [ ] Alerts configured
- [ ] Database performance monitored
- [ ] API response times tracked
- [ ] Error rates monitored
- [ ] LLM token usage tracked

## Next Steps

1. ✅ Configure environment variables
2. ✅ Build Docker image
3. ⏳ Test locally with Docker Compose
4. ⏳ Deploy to staging environment
5. ⏳ Run integration tests
6. ⏳ Configure monitoring
7. ⏳ Deploy to production
8. ⏳ Monitor and optimize
