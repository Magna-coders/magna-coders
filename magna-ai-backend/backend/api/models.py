"""
API request and response models for Magna AI Agent.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from enum import Enum
from pydantic import BaseModel, Field


class MessageRole(str, Enum):
    """Message role enumeration."""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ConsentStatus(str, Enum):
    """Consent request status."""
    PENDING = "pending"
    APPROVED = "approved"
    DENIED = "denied"
    EXPIRED = "expired"


class ChatMessageRequest(BaseModel):
    """Request model for sending a chat message."""
    message: str = Field(..., min_length=1, max_length=10000, description="User message content")
    conversation_id: Optional[str] = Field(None, description="Existing conversation ID or None for new conversation")
    stream: bool = Field(True, description="Whether to stream the response")


class ChatMessageResponse(BaseModel):
    """Response model for chat message."""
    conversation_id: str = Field(..., description="Conversation identifier")
    message_id: str = Field(..., description="Message identifier")
    content: str = Field(..., description="Agent response content")
    timestamp: datetime = Field(..., description="Response timestamp")
    tool_calls: Optional[List[Dict[str, Any]]] = Field(None, description="Tools called during processing")
    results: Optional[List[Dict[str, Any]]] = Field(None, description="Structured results (jobs, collaborators, etc.)")
    requires_consent: Optional[Dict[str, Any]] = Field(None, description="Consent request if action requires approval")


class ConversationSummary(BaseModel):
    """Summary of a conversation."""
    id: str = Field(..., description="Conversation identifier")
    title: str = Field(..., description="Conversation title")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    message_count: int = Field(..., description="Number of messages in conversation")
    last_message_preview: Optional[str] = Field(None, description="Preview of last message")


class Message(BaseModel):
    """Individual message in a conversation."""
    id: str = Field(..., description="Message identifier")
    role: MessageRole = Field(..., description="Message role (user/assistant/system)")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(..., description="Message timestamp")
    tool_calls: Optional[List[Dict[str, Any]]] = Field(None, description="Tools called")
    results: Optional[List[Dict[str, Any]]] = Field(None, description="Structured results")


class ConversationDetail(BaseModel):
    """Detailed conversation with all messages."""
    id: str = Field(..., description="Conversation identifier")
    title: str = Field(..., description="Conversation title")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    messages: List[Message] = Field(..., description="All messages in conversation")


class ConsentRequest(BaseModel):
    """Consent request for user approval."""
    id: str = Field(..., description="Consent request identifier")
    action_type: str = Field(..., description="Type of action requiring consent")
    action_description: str = Field(..., description="Human-readable description of action")
    required_data: List[str] = Field(..., description="Data that will be shared/modified")
    target: str = Field(..., description="Target of the action (opportunity ID, etc.)")
    created_at: datetime = Field(..., description="Request creation timestamp")
    expires_at: datetime = Field(..., description="Expiration timestamp")


class ConsentResponse(BaseModel):
    """User response to consent request."""
    consent_request_id: str = Field(..., description="Consent request identifier")
    approved: bool = Field(..., description="Whether user approved the action")


class ConsentResult(BaseModel):
    """Result of consent processing."""
    consent_request_id: str = Field(..., description="Consent request identifier")
    status: ConsentStatus = Field(..., description="Updated consent status")
    consent_token: Optional[str] = Field(None, description="Token for approved actions")
    message: str = Field(..., description="Result message")


class HealthStatus(BaseModel):
    """Health check response."""
    status: str = Field(..., description="Overall health status")
    service: str = Field(..., description="Service name")
    version: str = Field(..., description="Service version")
    llm_providers: Optional[Dict[str, str]] = Field(None, description="LLM provider statuses")
    database: Optional[str] = Field(None, description="Database connection status")
    vector_db: Optional[str] = Field(None, description="Vector database status")


class ErrorResponse(BaseModel):
    """Error response model."""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
    request_id: Optional[str] = Field(None, description="Request identifier for tracking")

