"""Data models for analytics and monitoring."""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Dict, Any, Optional, List


class InteractionType(Enum):
    """Types of user interactions to track."""
    RECOMMENDATION_VIEW = "recommendation_view"
    RECOMMENDATION_CLICK = "recommendation_click"
    APPLICATION_SUBMIT = "application_submit"
    COLLABORATION_VIEW = "collaboration_view"
    COLLABORATION_CONTACT = "collaboration_contact"
    INTERVIEW_QUESTION_VIEW = "interview_question_view"
    INTERVIEW_RESPONSE_SUBMIT = "interview_response_submit"
    DOCUMENT_UPLOAD = "document_upload"
    DOCUMENT_SUBMIT = "document_submit"


class SatisfactionLevel(Enum):
    """User satisfaction levels."""
    VERY_DISSATISFIED = 1
    DISSATISFIED = 2
    NEUTRAL = 3
    SATISFIED = 4
    VERY_SATISFIED = 5


@dataclass
class InteractionEvent:
    """Represents a user interaction event."""
    id: str
    user_id: str
    conversation_id: str
    interaction_type: InteractionType
    timestamp: datetime
    target_id: Optional[str] = None  # ID of opportunity, collaborator, etc.
    match_score: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class SatisfactionRating:
    """Represents a user satisfaction rating."""
    id: str
    user_id: str
    conversation_id: str
    interaction_event_id: Optional[str]
    rating: SatisfactionLevel
    timestamp: datetime
    feedback_text: Optional[str] = None
    category: Optional[str] = None  # opportunity_match, collaboration_match, etc.
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class AnalyticsMetrics:
    """Aggregated analytics metrics."""
    total_interactions: int
    total_ratings: int
    average_satisfaction: float
    satisfaction_by_category: Dict[str, float]
    interaction_counts: Dict[str, int]
    time_period_start: datetime
    time_period_end: datetime


@dataclass
class QualityAlert:
    """Represents a quality alert."""
    id: str
    alert_type: str
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    message: str
    triggered_at: datetime
    metrics: Dict[str, Any]
    threshold_violated: str
    resolved: bool = False
    resolved_at: Optional[datetime] = None
