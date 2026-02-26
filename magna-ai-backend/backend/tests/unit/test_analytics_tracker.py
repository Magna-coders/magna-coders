"""Unit tests for analytics tracker."""

import pytest
from datetime import datetime, timedelta

from ...analytics.tracker import AnalyticsTracker
from ...models.analytics import InteractionType, SatisfactionLevel


class TestAnalyticsTracker:
    """Test suite for AnalyticsTracker."""
    
    @pytest.fixture
    def tracker(self):
        """Create tracker instance for testing."""
        return AnalyticsTracker()
    
    def test_track_interaction(self, tracker):
        """Test tracking a user interaction."""
        event = tracker.track_interaction(
            user_id="user123",
            conversation_id="conv456",
            interaction_type=InteractionType.RECOMMENDATION_CLICK,
            target_id="job789",
            match_score=0.85
        )
        
        assert event.user_id == "user123"
        assert event.conversation_id == "conv456"
        assert event.interaction_type == InteractionType.RECOMMENDATION_CLICK
        assert event.target_id == "job789"
        assert event.match_score == 0.85
        assert event.id is not None
        assert isinstance(event.timestamp, datetime)
    
    def test_record_satisfaction(self, tracker):
        """Test recording a satisfaction rating."""
        rating = tracker.record_satisfaction(
            user_id="user123",
            conversation_id="conv456",
            rating=SatisfactionLevel.SATISFIED,
            category="opportunity_match",
            feedback_text="Great recommendations!"
        )
        
        assert rating.user_id == "user123"
        assert rating.conversation_id == "conv456"
        assert rating.rating == SatisfactionLevel.SATISFIED
        assert rating.category == "opportunity_match"
        assert rating.feedback_text == "Great recommendations!"
        assert rating.id is not None
        assert isinstance(rating.timestamp, datetime)
    
    def test_get_metrics_empty(self, tracker):
        """Test getting metrics with no data."""
        metrics = tracker.get_metrics()
        
        assert metrics.total_interactions == 0
        assert metrics.total_ratings == 0
        assert metrics.average_satisfaction == 0.0
        assert len(metrics.satisfaction_by_category) == 0
        assert len(metrics.interaction_counts) == 0
    
    def test_get_metrics_with_data(self, tracker):
        """Test getting metrics with interaction and rating data."""
        # Track some interactions
        tracker.track_interaction(
            user_id="user1",
            conversation_id="conv1",
            interaction_type=InteractionType.RECOMMENDATION_CLICK
        )
        tracker.track_interaction(
            user_id="user1",
            conversation_id="conv1",
            interaction_type=InteractionType.APPLICATION_SUBMIT
        )
        
        # Record some ratings
        tracker.record_satisfaction(
            user_id="user1",
            conversation_id="conv1",
            rating=SatisfactionLevel.SATISFIED,
            category="opportunity_match"
        )
        tracker.record_satisfaction(
            user_id="user1",
            conversation_id="conv1",
            rating=SatisfactionLevel.VERY_SATISFIED,
            category="opportunity_match"
        )
        
        metrics = tracker.get_metrics()
        
        assert metrics.total_interactions == 2
        assert metrics.total_ratings == 2
        assert metrics.average_satisfaction == 4.5  # (4 + 5) / 2
        assert "opportunity_match" in metrics.satisfaction_by_category
        assert metrics.satisfaction_by_category["opportunity_match"] == 4.5
        assert metrics.interaction_counts["recommendation_click"] == 1
        assert metrics.interaction_counts["application_submit"] == 1
    
    def test_get_metrics_filtered_by_user(self, tracker):
        """Test getting metrics filtered by user."""
        # Track interactions for different users
        tracker.track_interaction(
            user_id="user1",
            conversation_id="conv1",
            interaction_type=InteractionType.RECOMMENDATION_CLICK
        )
        tracker.track_interaction(
            user_id="user2",
            conversation_id="conv2",
            interaction_type=InteractionType.RECOMMENDATION_CLICK
        )
        
        # Get metrics for user1 only
        metrics = tracker.get_metrics(user_id="user1")
        
        assert metrics.total_interactions == 1
    
    def test_get_metrics_filtered_by_category(self, tracker):
        """Test getting metrics filtered by category."""
        # Record ratings in different categories
        tracker.record_satisfaction(
            user_id="user1",
            conversation_id="conv1",
            rating=SatisfactionLevel.SATISFIED,
            category="opportunity_match"
        )
        tracker.record_satisfaction(
            user_id="user1",
            conversation_id="conv1",
            rating=SatisfactionLevel.DISSATISFIED,
            category="collaboration_match"
        )
        
        # Get metrics for opportunity_match only
        metrics = tracker.get_metrics(category="opportunity_match")
        
        assert metrics.total_ratings == 1
        assert metrics.average_satisfaction == 4.0
    
    def test_get_user_interactions(self, tracker):
        """Test getting user interactions."""
        # Track multiple interactions
        for i in range(5):
            tracker.track_interaction(
                user_id="user1",
                conversation_id="conv1",
                interaction_type=InteractionType.RECOMMENDATION_VIEW
            )
        
        interactions = tracker.get_user_interactions("user1", limit=3)
        
        assert len(interactions) == 3
        # Should be sorted by timestamp descending (most recent first)
        assert interactions[0].timestamp >= interactions[1].timestamp
    
    def test_get_user_ratings(self, tracker):
        """Test getting user ratings."""
        # Record multiple ratings
        for i in range(5):
            tracker.record_satisfaction(
                user_id="user1",
                conversation_id="conv1",
                rating=SatisfactionLevel.SATISFIED
            )
        
        ratings = tracker.get_user_ratings("user1", limit=3)
        
        assert len(ratings) == 3
        # Should be sorted by timestamp descending (most recent first)
        assert ratings[0].timestamp >= ratings[1].timestamp
    
    def test_satisfaction_by_category_multiple_categories(self, tracker):
        """Test satisfaction calculation across multiple categories."""
        # Record ratings in different categories
        tracker.record_satisfaction(
            user_id="user1",
            conversation_id="conv1",
            rating=SatisfactionLevel.VERY_SATISFIED,
            category="opportunity_match"
        )
        tracker.record_satisfaction(
            user_id="user1",
            conversation_id="conv1",
            rating=SatisfactionLevel.SATISFIED,
            category="opportunity_match"
        )
        tracker.record_satisfaction(
            user_id="user1",
            conversation_id="conv1",
            rating=SatisfactionLevel.NEUTRAL,
            category="collaboration_match"
        )
        
        metrics = tracker.get_metrics()
        
        assert len(metrics.satisfaction_by_category) == 2
        assert metrics.satisfaction_by_category["opportunity_match"] == 4.5
        assert metrics.satisfaction_by_category["collaboration_match"] == 3.0
    
    def test_interaction_with_metadata(self, tracker):
        """Test tracking interaction with metadata."""
        metadata = {
            "source": "chat",
            "recommendation_rank": 1,
            "filters_applied": ["remote", "python"]
        }
        
        event = tracker.track_interaction(
            user_id="user1",
            conversation_id="conv1",
            interaction_type=InteractionType.RECOMMENDATION_CLICK,
            metadata=metadata
        )
        
        assert event.metadata == metadata
    
    def test_rating_with_feedback(self, tracker):
        """Test recording rating with feedback text."""
        rating = tracker.record_satisfaction(
            user_id="user1",
            conversation_id="conv1",
            rating=SatisfactionLevel.VERY_SATISFIED,
            feedback_text="Excellent match! Found my dream job.",
            category="opportunity_match"
        )
        
        assert rating.feedback_text == "Excellent match! Found my dream job."
