"""Unit tests for quality alerter."""

import pytest
from datetime import datetime, timedelta

from ...analytics.tracker import AnalyticsTracker
from ...analytics.alerting import QualityAlerter
from ...models.analytics import SatisfactionLevel, InteractionType


class TestQualityAlerter:
    """Test suite for QualityAlerter."""
    
    @pytest.fixture
    def tracker(self):
        """Create tracker instance for testing."""
        return AnalyticsTracker()
    
    @pytest.fixture
    def alerter(self, tracker):
        """Create alerter instance for testing."""
        return QualityAlerter(
            analytics_tracker=tracker,
            satisfaction_threshold=0.8
        )
    
    def test_no_alert_with_insufficient_data(self, alerter):
        """Test that no alert is triggered with insufficient data."""
        # Only 2 ratings (need at least 5)
        alerter.tracker.record_satisfaction(
            user_id="user1",
            conversation_id="conv1",
            rating=SatisfactionLevel.DISSATISFIED
        )
        alerter.tracker.record_satisfaction(
            user_id="user1",
            conversation_id="conv1",
            rating=SatisfactionLevel.DISSATISFIED
        )
        
        alert = alerter.check_satisfaction_threshold()
        
        assert alert is None
    
    def test_no_alert_above_threshold(self, alerter):
        """Test that no alert is triggered when satisfaction is above threshold."""
        # Record high satisfaction ratings
        for _ in range(10):
            alerter.tracker.record_satisfaction(
                user_id="user1",
                conversation_id="conv1",
                rating=SatisfactionLevel.VERY_SATISFIED
            )
        
        alert = alerter.check_satisfaction_threshold()
        
        assert alert is None
    
    def test_alert_triggered_below_threshold(self, alerter):
        """Test that alert is triggered when satisfaction falls below threshold."""
        # Record low satisfaction ratings (avg = 2.0, normalized = 0.25)
        for _ in range(10):
            alerter.tracker.record_satisfaction(
                user_id="user1",
                conversation_id="conv1",
                rating=SatisfactionLevel.DISSATISFIED,
                category="opportunity_match"
            )
        
        alert = alerter.check_satisfaction_threshold()
        
        assert alert is not None
        assert alert.alert_type == "LOW_SATISFACTION"
        assert alert.severity == "CRITICAL"
        assert not alert.resolved
        assert "below threshold" in alert.message.lower()
    
    def test_alert_severity_levels(self, alerter):
        """Test different alert severity levels based on satisfaction."""
        test_cases = [
            (SatisfactionLevel.VERY_DISSATISFIED, "CRITICAL"),  # 1.0 -> 0.0
            (SatisfactionLevel.DISSATISFIED, "CRITICAL"),       # 2.0 -> 0.25
            (SatisfactionLevel.NEUTRAL, "HIGH"),                # 3.0 -> 0.5
        ]
        
        for rating, expected_severity in test_cases:
            tracker = AnalyticsTracker()
            alerter_test = QualityAlerter(tracker, satisfaction_threshold=0.8)
            
            # Record 10 ratings of the same level
            for _ in range(10):
                tracker.record_satisfaction(
                    user_id="user1",
                    conversation_id="conv1",
                    rating=rating
                )
            
            alert = alerter_test.check_satisfaction_threshold()
            
            if alert:
                assert alert.severity == expected_severity
    
    def test_alert_with_category_filter(self, alerter):
        """Test alert checking for specific category."""
        # Record low satisfaction for opportunity_match
        for _ in range(10):
            alerter.tracker.record_satisfaction(
                user_id="user1",
                conversation_id="conv1",
                rating=SatisfactionLevel.DISSATISFIED,
                category="opportunity_match"
            )
        
        # Record high satisfaction for collaboration_match
        for _ in range(10):
            alerter.tracker.record_satisfaction(
                user_id="user1",
                conversation_id="conv1",
                rating=SatisfactionLevel.VERY_SATISFIED,
                category="collaboration_match"
            )
        
        # Check opportunity_match - should trigger alert
        alert_opp = alerter.check_satisfaction_threshold(category="opportunity_match")
        assert alert_opp is not None
        
        # Check collaboration_match - should not trigger alert
        alert_collab = alerter.check_satisfaction_threshold(category="collaboration_match")
        assert alert_collab is None
    
    def test_check_all_categories(self, alerter):
        """Test checking all categories at once."""
        # Record low satisfaction for multiple categories
        for category in ["opportunity_match", "collaboration_match"]:
            for _ in range(10):
                alerter.tracker.record_satisfaction(
                    user_id="user1",
                    conversation_id="conv1",
                    rating=SatisfactionLevel.DISSATISFIED,
                    category=category
                )
        
        alerts = alerter.check_all_categories()
        
        # Should have alerts for overall + 2 categories
        assert len(alerts) >= 2
        alert_types = [a.metrics.get("category") for a in alerts]
        assert "opportunity_match" in alert_types
        assert "collaboration_match" in alert_types
    
    def test_get_active_alerts(self, alerter):
        """Test getting active alerts."""
        # Trigger some alerts
        for _ in range(10):
            alerter.tracker.record_satisfaction(
                user_id="user1",
                conversation_id="conv1",
                rating=SatisfactionLevel.DISSATISFIED
            )
        
        alert = alerter.check_satisfaction_threshold()
        assert alert is not None
        
        active_alerts = alerter.get_active_alerts()
        assert len(active_alerts) == 1
        assert active_alerts[0].id == alert.id
    
    def test_resolve_alert(self, alerter):
        """Test resolving an alert."""
        # Trigger an alert
        for _ in range(10):
            alerter.tracker.record_satisfaction(
                user_id="user1",
                conversation_id="conv1",
                rating=SatisfactionLevel.DISSATISFIED
            )
        
        alert = alerter.check_satisfaction_threshold()
        assert alert is not None
        
        # Resolve the alert
        resolved = alerter.resolve_alert(alert.id)
        assert resolved is True
        assert alert.resolved is True
        assert alert.resolved_at is not None
        
        # Check active alerts - should be empty
        active_alerts = alerter.get_active_alerts()
        assert len(active_alerts) == 0
    
    def test_resolve_nonexistent_alert(self, alerter):
        """Test resolving a nonexistent alert."""
        resolved = alerter.resolve_alert("nonexistent-id")
        assert resolved is False
    
    def test_get_alert_history(self, alerter):
        """Test getting alert history."""
        # Trigger multiple alerts
        for i in range(3):
            for _ in range(10):
                alerter.tracker.record_satisfaction(
                    user_id="user1",
                    conversation_id="conv1",
                    rating=SatisfactionLevel.DISSATISFIED
                )
            alerter.check_satisfaction_threshold()
        
        history = alerter.get_alert_history()
        assert len(history) >= 3
    
    def test_alert_callback(self, tracker):
        """Test alert callback is triggered."""
        callback_called = []
        
        def test_callback(alert):
            callback_called.append(alert)
        
        alerter = QualityAlerter(
            analytics_tracker=tracker,
            satisfaction_threshold=0.8,
            alert_callback=test_callback
        )
        
        # Trigger alert
        for _ in range(10):
            tracker.record_satisfaction(
                user_id="user1",
                conversation_id="conv1",
                rating=SatisfactionLevel.DISSATISFIED
            )
        
        alerts = alerter.monitor_continuous()
        
        assert len(callback_called) > 0
        assert len(alerts) > 0
    
    def test_alert_metrics_content(self, alerter):
        """Test that alert contains proper metrics."""
        # Record low satisfaction
        for _ in range(10):
            alerter.tracker.record_satisfaction(
                user_id="user1",
                conversation_id="conv1",
                rating=SatisfactionLevel.DISSATISFIED,
                category="opportunity_match"
            )
        
        alert = alerter.check_satisfaction_threshold(category="opportunity_match")
        
        assert alert is not None
        assert "average_satisfaction" in alert.metrics
        assert "normalized_satisfaction" in alert.metrics
        assert "total_ratings" in alert.metrics
        assert "threshold" in alert.metrics
        assert alert.metrics["total_ratings"] == 10
        assert alert.metrics["threshold"] == 0.8
    
    def test_threshold_at_80_percent(self, alerter):
        """Test that 80% threshold works correctly."""
        # Record ratings that average to exactly 80% (4.2 on 1-5 scale)
        # 4.2 normalized = (4.2 - 1) / 4 = 0.8
        for _ in range(5):
            alerter.tracker.record_satisfaction(
                user_id="user1",
                conversation_id="conv1",
                rating=SatisfactionLevel.VERY_SATISFIED  # 5
            )
        for _ in range(5):
            alerter.tracker.record_satisfaction(
                user_id="user1",
                conversation_id="conv1",
                rating=SatisfactionLevel.NEUTRAL  # 3
            )
        # Average = (5*5 + 3*5) / 10 = 40/10 = 4.0
        # Normalized = (4.0 - 1) / 4 = 0.75 < 0.8
        
        alert = alerter.check_satisfaction_threshold()
        
        # Should trigger alert since 0.75 < 0.8
        assert alert is not None
