"""
Data Models Module

Pydantic models for request/response validation and data structures.
"""

from .memory import MemoryEntry, MemoryMetadata, MemoryType
from .matching import (
    OpportunityType,
    UserProfile,
    Opportunity,
    MatchScore,
    OpportunityMatch,
    CollaborationScore,
    CollaboratorMatch,
)

__all__ = [
    "MemoryEntry",
    "MemoryMetadata",
    "MemoryType",
    "OpportunityType",
    "UserProfile",
    "Opportunity",
    "MatchScore",
    "OpportunityMatch",
    "CollaborationScore",
    "CollaboratorMatch",
]
