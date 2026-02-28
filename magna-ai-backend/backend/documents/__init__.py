"""Document management system for Magna AI Agent.

This package provides document upload, retrieval, and submission capabilities
with consent enforcement and S3 integration.
"""

from .consent import ConsentManager
from .manager import DocumentManager
from .models import (
    ConsentActionType,
    ConsentRequest,
    ConsentResponse,
    ConsentStatus,
    Document,
    DocumentMetadata,
    DocumentSubmission,
    DocumentType,
    SubmissionResult,
    SubmissionStatus,
)

__all__ = [
    "DocumentManager",
    "ConsentManager",
    "Document",
    "DocumentMetadata",
    "DocumentSubmission",
    "DocumentType",
    "SubmissionStatus",
    "ConsentRequest",
    "ConsentResponse",
    "ConsentStatus",
    "ConsentActionType",
    "SubmissionResult",
]
