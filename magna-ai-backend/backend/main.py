"""
Magna AI Agent FastAPI Application

Main entry point for the Magna AI Agent backend service.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .utils.logging import setup_logging, get_logger

# Setup logging
setup_logging()
logger = get_logger(__name__)

# Create FastAPI application
app = FastAPI(
    title="Magna AI Agent API",
    description="Intelligent career assistant for the Magna platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add rate limiting middleware
from .api.rate_limit import RateLimitMiddleware
app.add_middleware(
    RateLimitMiddleware,
    requests_per_minute=settings.rate_limit_per_minute
)


@app.on_event("startup")
async def startup_event():
    """Initialize services on application startup."""
    logger.info("Starting Magna AI Agent API...")
    logger.info(f"Environment: {settings.log_level}")
    logger.info(f"CORS Origins: {settings.cors_origins_list}")
    
    # Initialize all components
    from .integration import initialize_integration
    try:
        await initialize_integration()
        logger.info("All components initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize components: {e}", exc_info=True)
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown."""
    logger.info("Shutting down Magna AI Agent API...")
    
    # Shutdown all components
    from .integration import shutdown_integration
    try:
        await shutdown_integration()
        logger.info("All components shut down successfully")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}", exc_info=True)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "Magna AI Agent API",
        "version": "1.0.0",
        "status": "operational"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "magna-ai-agent",
        "version": "1.0.0"
    }


# Register API routers
from .api import chat_router, health_router, websocket_router, user_data_router, user_router
from .api.models_api import router as models_router

app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(health_router, prefix="/api", tags=["health"])
app.include_router(websocket_router, tags=["websocket"])
app.include_router(models_router, prefix="/api", tags=["models"])
app.include_router(user_data_router, prefix="/api/user", tags=["user-data"])
app.include_router(user_router, prefix="/api/user", tags=["user"])


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "backend.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True,
        log_level=settings.log_level.lower()
    )
