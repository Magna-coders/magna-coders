"""Data models for document management system.

This module defines the data structures used for document management,
including document metadata, submission records, and consent requests.
"""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional


class DocumentType(Enum):
    """Types of documents supported by the system."""
    RESUME = "RESUME"
    COVER_LETTER = "COVER_LETTER"
    PORTFOLIO = "PORTFOLIO"


class SubmissionStatus(Enum):
    """Status of document submission."""
    PENDING = "PENDING"
    SUBMITTED = "SUBMITTED"
    FAILED = "FAILED"


class ConsentStatus(Enum):
    """Status of consent request."""
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    DENIED = "DENIED"
    EXPIRED = "EXPIRED"


class ConsentActionType(Enum):
    """Types of actions requiring consent."""
    DOCUMENT_SUBMIT = "DOCUMENT_SUBMIT"
    DATA_SHARE = "DATA_SHARE"


@dataclass
class Document:
    """Complete document record with all metadata."""
    id: str
    user_id: str
    filename: str
    document_type: DocumentType
    file_size_bytes: int
    mime_type: str
    s3_url: str
    s3_key: str
    s3_bucket: str
    file_hash: str
    uploaded_at: datetime
    last_modified: datetime


@dataclass
class DocumentMetadata:
    """Public document metadata returned to users."""
    document_id: str
    user_id: str
    filename: str
    document_type: DocumentType
    file_size_bytes: int
    mime_type: str
    s3_url: str
    uploaded_at: datetime


@dataclass
class DocumentSubmission:
    """Record of document submission to an opportunity."""
    id: str
    document_id: str
    opportunity_id: str
    user_id: str
    submitted_at: datetime
    consent_token: str
    status: SubmissionStatus
    confirmation: Optional[str] = None


@dataclass
class ConsentRequest:
    """Request for user consent to perform an action."""
    id: str
    user_id: str
    action_type: ConsentActionType
    action_description: str
    required_data: list[str]
    target: str  # Opportunity ID or recipient
    created_at: datetime
    expires_at: datetime
    status: ConsentStatus


@dataclass
class ConsentResponse:
    """User's response to a consent request."""
    consent_request_id: str
    approved: bool
    consent_token: Optional[str]  # Generated if approved
    timestamp: datetime


@dataclass
class SubmissionResult:
    """Result of document submission operation."""
    success: bool
    submission_id: Optional[str] = None
    document_id: Optional[str] = None
    opportunity_id: Optional[str] = None
    submitted_at: Optional[datetime] = None
    confirmation: Optional[str] = None
    error: Optional[str] = None
