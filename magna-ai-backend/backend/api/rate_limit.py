"""
Rate limiting middleware for Magna AI Agent API.

Implements token bucket algorithm for rate limiting per user.
"""

import time
from typing import Dict, Optional
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
from threading import Lock

from ..config import settings
from ..utils.logging import get_logger

logger = get_logger(__name__)


class TokenBucket:
    """
    Token bucket implementation for rate limiting.
    
    Tokens are added at a constant rate. Each request consumes one token.
    If no tokens available, request is rejected.
    """
    
    def __init__(self, capacity: int, refill_rate: float):
        """
        Initialize token bucket.
        
        Args:
            capacity: Maximum number of tokens (burst size)
            refill_rate: Tokens added per second
        """
        self.capacity = capacity
        self.refill_rate = refill_rate
        self.tokens = capacity
        self.last_refill = time.time()
        self.lock = Lock()
    
    def consume(self, tokens: int = 1) -> bool:
        """
        Try to consume tokens from bucket.
        
        Args:
            tokens: Number of tokens to consume
            
        Returns:
            True if tokens consumed successfully, False if insufficient tokens
        """
        with self.lock:
            # Refill tokens based on time elapsed
            now = time.time()
            elapsed = now - self.last_refill
            self.tokens = min(
                self.capacity,
                self.tokens + elapsed * self.refill_rate
            )
            self.last_refill = now
            
            # Try to consume tokens
            if self.tokens >= tokens:
                self.tokens -= tokens
                return True
            else:
                return False
    
    def get_wait_time(self, tokens: int = 1) -> float:
        """
        Calculate time to wait until tokens available.
        
        Args:
            tokens: Number of tokens needed
            
        Returns:
            Seconds to wait
        """
        with self.lock:
            if self.tokens >= tokens:
                return 0.0
            
            tokens_needed = tokens - self.tokens
            return tokens_needed / self.refill_rate


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware using token bucket algorithm.
    
    Limits requests per user based on JWT token.
    """
    
    def __init__(self, app, requests_per_minute: int = 60):
        """
        Initialize rate limiter.
        
        Args:
            app: FastAPI application
            requests_per_minute: Maximum requests per minute per user
        """
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.buckets: Dict[str, TokenBucket] = defaultdict(
            lambda: TokenBucket(
                capacity=requests_per_minute,
                refill_rate=requests_per_minute / 60.0  # tokens per second
            )
        )
        self.cleanup_interval = 300  # Cleanup every 5 minutes
        self.last_cleanup = time.time()
        logger.info(f"Rate limiting enabled: {requests_per_minute} requests/minute")
    
    def extract_user_id(self, request: Request) -> Optional[str]:
        """
        Extract user ID from request.
        
        Tries to get user ID from:
        1. JWT token in Authorization header
        2. IP address as fallback
        
        Args:
            request: FastAPI request
            
        Returns:
            User identifier or None
        """
        # Try to get from Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                from jose import jwt
                payload = jwt.decode(
                    token,
                    settings.jwt_secret,
                    algorithms=["HS256"]
                )
                user_id = payload.get("sub")
                if user_id:
                    return f"user:{user_id}"
            except Exception:
                pass
        
        # Fallback to IP address
        client_ip = request.client.host if request.client else "unknown"
        return f"ip:{client_ip}"
    
    def cleanup_old_buckets(self):
        """Remove inactive token buckets to prevent memory leak."""
        now = time.time()
        if now - self.last_cleanup > self.cleanup_interval:
            # Remove buckets that haven't been used recently
            inactive_threshold = now - 600  # 10 minutes
            to_remove = [
                user_id for user_id, bucket in self.buckets.items()
                if bucket.last_refill < inactive_threshold
            ]
            for user_id in to_remove:
                del self.buckets[user_id]
            
            if to_remove:
                logger.debug(f"Cleaned up {len(to_remove)} inactive rate limit buckets")
            
            self.last_cleanup = now
    
    async def dispatch(self, request: Request, call_next):
        """
        Process request with rate limiting.
        
        Args:
            request: Incoming request
            call_next: Next middleware/handler
            
        Returns:
            Response or 429 if rate limited
        """
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/api/health", "/api/ready", "/api/live"]:
            return await call_next(request)
        
        # Extract user identifier
        user_id = self.extract_user_id(request)
        
        if user_id is None:
            # No user ID, allow request but log warning
            logger.warning("Rate limit: Could not identify user")
            return await call_next(request)
        
        # Get or create token bucket for user
        bucket = self.buckets[user_id]
        
        # Try to consume token
        if bucket.consume():
            # Request allowed
            response = await call_next(request)
            
            # Add rate limit headers
            response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
            response.headers["X-RateLimit-Remaining"] = str(int(bucket.tokens))
            response.headers["X-RateLimit-Reset"] = str(
                int(time.time() + bucket.get_wait_time(1))
            )
            
            # Periodic cleanup
            self.cleanup_old_buckets()
            
            return response
        else:
            # Rate limit exceeded
            wait_time = bucket.get_wait_time(1)
            retry_after = int(wait_time) + 1
            
            logger.warning(
                f"Rate limit exceeded for {user_id}. "
                f"Retry after {retry_after} seconds"
            )
            
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "rate_limit_exceeded",
                    "message": f"Too many requests. Please try again in {retry_after} seconds.",
                    "retry_after": retry_after
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(self.requests_per_minute),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time() + wait_time))
                }
            )


def create_rate_limit_middleware(requests_per_minute: Optional[int] = None):
    """
    Factory function to create rate limit middleware.
    
    Args:
        requests_per_minute: Override default rate limit
        
    Returns:
        RateLimitMiddleware instance
    """
    rpm = requests_per_minute or settings.rate_limit_per_minute
    return lambda app: RateLimitMiddleware(app, requests_per_minute=rpm)

