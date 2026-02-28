"""Analytics tracker for user interactions and satisfaction."""

import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from collections import defaultdict

from ..models.analytics import (
    InteractionEvent,
    SatisfactionRating,
    InteractionType,
    SatisfactionLevel,
    AnalyticsMetrics
)


class AnalyticsTracker:
    """Tracks user interactions and satisfaction ratings.
    
    Handles:
    - Recording user interactions with recommendations
    - Collecting explicit satisfaction ratings
    - Computing aggregated metrics
    - Providing analytics data for quality monitoring
    """
    
    def __init__(self, storage_backend: Optional[Any] = None):
        """Initialize analytics tracker.
        
        Args:
            storage_backend: Optional database connection for persistence
        """
        self.storage = storage_backend
        # In-memory storage for development/testing
        self._interactions: List[InteractionEvent] = []
        self._ratings: List[SatisfactionRating] = []
    
    def track_interaction(
        self,
        user_id: str,
        conversation_id: str,
        interaction_type: InteractionType,
        target_id: Optional[str] = None,
        match_score: Optional[float] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> InteractionEvent:
        """Track a user interaction event.
        
        Args:
            user_id: User identifier
            conversation_id: Conversation identifier
            interaction_type: Type of interaction
            target_id: Optional ID of target (opportunity, collaborator, etc.)
            match_score: Optional match score if applicable
            metadata: Additional metadata
            
        Returns:
            Created InteractionEvent
        """
        event = InteractionEvent(
            id=str(uuid.uuid4()),
            user_id=user_id,
            conversation_id=conversation_id,
            interaction_type=interaction_type,
            timestamp=datetime.utcnow(),
            target_id=target_id,
            match_score=match_score,
            metadata=metadata or {}
        )
        
        self._interactions.append(event)
        
        # Persist to database if available
        if self.storage:
            self._persist_interaction(event)
        
        return event
    
    def record_satisfaction(
        self,
        user_id: str,
        conversation_id: str,
        rating: SatisfactionLevel,
        interaction_event_id: Optional[str] = None,
        feedback_text: Optional[str] = None,
        category: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> SatisfactionRating:
        """Record a user satisfaction rating.
        
        Args:
            user_id: User identifier
            conversation_id: Conversation identifier
            rating: Satisfaction level (1-5)
            interaction_event_id: Optional related interaction event
            feedback_text: Optional text feedback
            category: Optional category (opportunity_match, collaboration_match, etc.)
            metadata: Additional metadata
            
        Returns:
            Created SatisfactionRating
        """
        satisfaction = SatisfactionRating(
            id=str(uuid.uuid4()),
            user_id=user_id,
            conversation_id=conversation_id,
            interaction_event_id=interaction_event_id,
            rating=rating,
            timestamp=datetime.utcnow(),
            feedback_text=feedback_text,
            category=category,
            metadata=metadata or {}
        )
        
        self._ratings.append(satisfaction)
        
        # Persist to database if available
        if self.storage:
            self._persist_rating(satisfaction)
        
        return satisfaction
    
    def get_metrics(
        self,
        user_id: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        category: Optional[str] = None
    ) -> AnalyticsMetrics:
        """Get aggregated analytics metrics.
        
        Args:
            user_id: Optional filter by user
            start_time: Optional start of time period
            end_time: Optional end of time period
            category: Optional filter by category
            
        Returns:
            AnalyticsMetrics with aggregated data
        """
        # Default time period: last 30 days
        if not end_time:
            end_time = datetime.utcnow()
        if not start_time:
            start_time = end_time - timedelta(days=30)
        
        # Filter interactions
        filtered_interactions = [
            i for i in self._interactions
            if (not user_id or i.user_id == user_id)
            and start_time <= i.timestamp <= end_time
        ]
        
        # Filter ratings
        filtered_ratings = [
            r for r in self._ratings
            if (not user_id or r.user_id == user_id)
            and start_time <= r.timestamp <= end_time
            and (not category or r.category == category)
        ]
        
        # Calculate average satisfaction
        if filtered_ratings:
            avg_satisfaction = sum(r.rating.value for r in filtered_ratings) / len(filtered_ratings)
        else:
            avg_satisfaction = 0.0
        
        # Calculate satisfaction by category
        satisfaction_by_category = {}
        category_ratings = defaultdict(list)
        for rating in filtered_ratings:
            if rating.category:
                category_ratings[rating.category].append(rating.rating.value)
        
        for cat, ratings in category_ratings.items():
            satisfaction_by_category[cat] = sum(ratings) / len(ratings)
        
        # Count interactions by type
        interaction_counts = defaultdict(int)
        for interaction in filtered_interactions:
            interaction_counts[interaction.interaction_type.value] += 1
        
        return AnalyticsMetrics(
            total_interactions=len(filtered_interactions),
            total_ratings=len(filtered_ratings),
            average_satisfaction=avg_satisfaction,
            satisfaction_by_category=satisfaction_by_category,
            interaction_counts=dict(interaction_counts),
            time_period_start=start_time,
            time_period_end=end_time
        )
    
    def get_user_interactions(
        self,
        user_id: str,
        limit: int = 100
    ) -> List[InteractionEvent]:
        """Get recent interactions for a user.
        
        Args:
            user_id: User identifier
            limit: Maximum number of interactions to return
            
        Returns:
            List of InteractionEvent objects
        """
        user_interactions = [
            i for i in self._interactions
            if i.user_id == user_id
        ]
        # Sort by timestamp descending
        user_interactions.sort(key=lambda x: x.timestamp, reverse=True)
        return user_interactions[:limit]
    
    def get_user_ratings(
        self,
        user_id: str,
        limit: int = 100
    ) -> List[SatisfactionRating]:
        """Get recent satisfaction ratings for a user.
        
        Args:
            user_id: User identifier
            limit: Maximum number of ratings to return
            
        Returns:
            List of SatisfactionRating objects
        """
        user_ratings = [
            r for r in self._ratings
            if r.user_id == user_id
        ]
        # Sort by timestamp descending
        user_ratings.sort(key=lambda x: x.timestamp, reverse=True)
        return user_ratings[:limit]
    
    def _persist_interaction(self, event: InteractionEvent) -> None:
        """Persist interaction to database.
        
        Args:
            event: InteractionEvent to persist
        """
        # TODO: Implement database persistence
        # This would use Prisma or SQLAlchemy to save to PostgreSQL
        pass
    
    def _persist_rating(self, rating: SatisfactionRating) -> None:
        """Persist satisfaction rating to database.
        
        Args:
            rating: SatisfactionRating to persist
        """
        # TODO: Implement database persistence
        # This would use Prisma or SQLAlchemy to save to PostgreSQL
        pass
