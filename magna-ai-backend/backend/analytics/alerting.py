"""Quality alerting system for monitoring match satisfaction."""

import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Callable

from ..models.analytics import QualityAlert, AnalyticsMetrics
from .tracker import AnalyticsTracker


class QualityAlerter:
    """Monitors quality metrics and triggers alerts.
    
    Handles:
    - Monitoring average match satisfaction
    - Triggering alerts when thresholds are violated
    - Managing alert lifecycle (creation, resolution)
    - Notifying stakeholders of quality issues
    """
    
    def __init__(
        self,
        analytics_tracker: AnalyticsTracker,
        satisfaction_threshold: float = 0.8,
        alert_callback: Optional[Callable[[QualityAlert], None]] = None
    ):
        """Initialize quality alerter.
        
        Args:
            analytics_tracker: AnalyticsTracker instance for metrics
            satisfaction_threshold: Minimum acceptable satisfaction (0-1 scale)
            alert_callback: Optional callback function for alert notifications
        """
        self.tracker = analytics_tracker
        self.satisfaction_threshold = satisfaction_threshold
        self.alert_callback = alert_callback
        self._alerts: List[QualityAlert] = []
    
    def check_satisfaction_threshold(
        self,
        category: Optional[str] = None,
        time_window_hours: int = 24
    ) -> Optional[QualityAlert]:
        """Check if satisfaction is below threshold.
        
        Args:
            category: Optional category to check (opportunity_match, etc.)
            time_window_hours: Time window for metrics calculation
            
        Returns:
            QualityAlert if threshold violated, None otherwise
        """
        # Get metrics for time window
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=time_window_hours)
        
        metrics = self.tracker.get_metrics(
            start_time=start_time,
            end_time=end_time,
            category=category
        )
        
        # Check if we have enough data
        if metrics.total_ratings < 5:
            # Not enough data to trigger alert
            return None
        
        # Convert satisfaction to 0-1 scale (from 1-5 scale)
        normalized_satisfaction = (metrics.average_satisfaction - 1) / 4
        
        # Check threshold
        if normalized_satisfaction < self.satisfaction_threshold:
            alert = self._create_alert(
                alert_type="LOW_SATISFACTION",
                severity=self._calculate_severity(normalized_satisfaction),
                message=self._format_alert_message(
                    normalized_satisfaction,
                    category,
                    time_window_hours
                ),
                metrics={
                    "average_satisfaction": metrics.average_satisfaction,
                    "normalized_satisfaction": normalized_satisfaction,
                    "total_ratings": metrics.total_ratings,
                    "threshold": self.satisfaction_threshold,
                    "category": category,
                    "time_window_hours": time_window_hours
                },
                threshold_violated=f"satisfaction < {self.satisfaction_threshold}"
            )
            
            return alert
        
        return None
    
    def check_all_categories(
        self,
        time_window_hours: int = 24
    ) -> List[QualityAlert]:
        """Check satisfaction thresholds for all categories.
        
        Args:
            time_window_hours: Time window for metrics calculation
            
        Returns:
            List of QualityAlert objects for violations
        """
        alerts = []
        
        # Get overall metrics
        overall_alert = self.check_satisfaction_threshold(
            category=None,
            time_window_hours=time_window_hours
        )
        if overall_alert:
            alerts.append(overall_alert)
        
        # Check specific categories
        categories = [
            "opportunity_match",
            "collaboration_match",
            "interview_preparation",
            "document_submission"
        ]
        
        for category in categories:
            category_alert = self.check_satisfaction_threshold(
                category=category,
                time_window_hours=time_window_hours
            )
            if category_alert:
                alerts.append(category_alert)
        
        return alerts
    
    def monitor_continuous(
        self,
        check_interval_hours: int = 1,
        time_window_hours: int = 24
    ) -> List[QualityAlert]:
        """Perform continuous monitoring check.
        
        This should be called periodically (e.g., via cron job or scheduler).
        
        Args:
            check_interval_hours: How often to check (for logging)
            time_window_hours: Time window for metrics calculation
            
        Returns:
            List of new alerts triggered
        """
        new_alerts = self.check_all_categories(time_window_hours)
        
        # Trigger callbacks for new alerts
        for alert in new_alerts:
            if self.alert_callback:
                self.alert_callback(alert)
        
        return new_alerts
    
    def get_active_alerts(self) -> List[QualityAlert]:
        """Get all active (unresolved) alerts.
        
        Returns:
            List of active QualityAlert objects
        """
        return [a for a in self._alerts if not a.resolved]
    
    def resolve_alert(self, alert_id: str) -> bool:
        """Mark an alert as resolved.
        
        Args:
            alert_id: Alert identifier
            
        Returns:
            True if alert was found and resolved, False otherwise
        """
        for alert in self._alerts:
            if alert.id == alert_id and not alert.resolved:
                alert.resolved = True
                alert.resolved_at = datetime.utcnow()
                return True
        return False
    
    def get_alert_history(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        include_resolved: bool = True
    ) -> List[QualityAlert]:
        """Get alert history for a time period.
        
        Args:
            start_time: Optional start of time period
            end_time: Optional end of time period
            include_resolved: Whether to include resolved alerts
            
        Returns:
            List of QualityAlert objects
        """
        if not end_time:
            end_time = datetime.utcnow()
        if not start_time:
            start_time = end_time - timedelta(days=30)
        
        alerts = [
            a for a in self._alerts
            if start_time <= a.triggered_at <= end_time
            and (include_resolved or not a.resolved)
        ]
        
        # Sort by triggered_at descending
        alerts.sort(key=lambda x: x.triggered_at, reverse=True)
        return alerts
    
    def _create_alert(
        self,
        alert_type: str,
        severity: str,
        message: str,
        metrics: Dict[str, Any],
        threshold_violated: str
    ) -> QualityAlert:
        """Create a new quality alert.
        
        Args:
            alert_type: Type of alert
            severity: Severity level
            message: Alert message
            metrics: Metrics that triggered the alert
            threshold_violated: Description of violated threshold
            
        Returns:
            Created QualityAlert
        """
        alert = QualityAlert(
            id=str(uuid.uuid4()),
            alert_type=alert_type,
            severity=severity,
            message=message,
            triggered_at=datetime.utcnow(),
            metrics=metrics,
            threshold_violated=threshold_violated
        )
        
        self._alerts.append(alert)
        return alert
    
    def _calculate_severity(self, satisfaction: float) -> str:
        """Calculate alert severity based on satisfaction level.
        
        Args:
            satisfaction: Normalized satisfaction (0-1 scale)
            
        Returns:
            Severity level string
        """
        if satisfaction < 0.5:
            return "CRITICAL"
        elif satisfaction < 0.65:
            return "HIGH"
        elif satisfaction < 0.75:
            return "MEDIUM"
        else:
            return "LOW"
    
    def _format_alert_message(
        self,
        satisfaction: float,
        category: Optional[str],
        time_window_hours: int
    ) -> str:
        """Format alert message.
        
        Args:
            satisfaction: Normalized satisfaction (0-1 scale)
            category: Optional category
            time_window_hours: Time window
            
        Returns:
            Formatted alert message
        """
        satisfaction_pct = satisfaction * 100
        threshold_pct = self.satisfaction_threshold * 100
        
        category_str = f" for {category}" if category else ""
        
        return (
            f"Match satisfaction{category_str} has fallen below threshold. "
            f"Current: {satisfaction_pct:.1f}%, Threshold: {threshold_pct:.1f}% "
            f"(last {time_window_hours} hours)"
        )
