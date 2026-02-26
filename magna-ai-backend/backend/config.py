"""
Configuration management for Magna AI Agent.
"""

import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


# Get the directory where this config.py file is located (backend/)
BACKEND_DIR = Path(__file__).parent
ENV_FILE = BACKEND_DIR / ".env"


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # Main Backend Integration (REQUIRED)
    backend_api_url: str
    backend_api_key: str
    
    # Database
    database_url: str
    
    # LLM Providers
    gemini_api_key: str
    openai_api_key: str = ""
    nvidia_nim_api_key: str = ""
    nvidia_nim_model: str = "meta/llama-3.1-8b-instruct"  # Fast model by default
    ollama_base_url: str = "http://localhost:11434"
    
    # Search
    serpapi_api_key: str = ""
    
    # AWS S3
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    s3_bucket_name: str = "magna-ai-documents"
    
    # Vector Database (Pinecone)
    pinecone_api_key: str = ""
    pinecone_environment: str = "us-east-1-aws"
    pinecone_index_name: str = "magna-ai-profiles"
    
    # Security
    jwt_secret: str
    encryption_key: str
    
    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_workers: int = 4
    cors_origins: str = "http://localhost:3000"
    environment: str = "development"  # development or production
    
    # Rate Limiting
    rate_limit_per_minute: int = 60
    
    # Memory Configuration
    max_memory_size_mb: int = 5
    memory_prune_threshold_mb: float = 4.5
    
    # LLM Configuration
    llm_temperature: float = 0.7
    llm_top_p: float = 0.9
    llm_max_tokens: int = 2048
    llm_timeout_seconds: int = 30
    
    # Logging
    log_level: str = "INFO"
    log_format: str = "json"
    
    # Feature Flags
    enable_local_models: bool = False
    enable_memory_sync: bool = True
    enable_analytics: bool = True
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins.split(",")]


def validate_settings(settings: Settings) -> None:
    """
    Validate critical settings on startup.
    Raises ValueError if any required settings are invalid.
    """
    errors = []
    warnings = []
    
    # Validate backend integration
    if not settings.backend_api_url:
        errors.append("BACKEND_API_URL is required")
    
    if not settings.backend_api_key:
        errors.append("BACKEND_API_KEY is required")
    elif len(settings.backend_api_key) < 32:
        warnings.append("BACKEND_API_KEY should be at least 32 characters for security")
    
    # Validate security keys
    if not settings.jwt_secret:
        errors.append("JWT_SECRET is required")
    elif len(settings.jwt_secret) < 32:
        warnings.append("JWT_SECRET should be at least 32 characters for security")
    
    if not settings.encryption_key:
        errors.append("ENCRYPTION_KEY is required")
    elif len(settings.encryption_key) != 32:
        warnings.append("ENCRYPTION_KEY should be exactly 32 characters")
    
    # Check for default values in production
    if settings.environment == "production":
        if "change" in settings.jwt_secret.lower():
            errors.append("JWT_SECRET is using default value in production")
        if "change" in settings.backend_api_key.lower():
            errors.append("BACKEND_API_KEY is using default value in production")
    
    # Log warnings
    if warnings:
        print("⚠️  Configuration Warnings:")
        for warning in warnings:
            print(f"   - {warning}")
    
    # Raise errors
    if errors:
        print("❌ Configuration Errors:")
        for error in errors:
            print(f"   - {error}")
        raise ValueError("Invalid configuration. Please check your .env file.")
    
    print("✅ Configuration validated successfully")


# Global settings instance
settings = Settings()

# Validate settings on import
validate_settings(settings)
