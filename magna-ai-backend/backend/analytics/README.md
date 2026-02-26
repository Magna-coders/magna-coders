# Analytics and Monitoring System

This module provides analytics tracking and quality monitoring for the Magna AI Agent.

## Components

### AnalyticsTracker

Tracks user interactions and satisfaction ratings.

**Features:**
- Track user interactions with recommendations (clicks, applications, views)
- Record explicit satisfaction ratings (1-5 scale)
- Compute aggregated metrics by user, category, and time period
- Support for metadata and feedback text

**Usage:**

```python
from analytics import AnalyticsTracker
from models.analytics import InteractionType, SatisfactionLevel

# Initialize tracker
tracker = AnalyticsTracker()

# Track an interaction
tracker.track_interaction(
    user_id="user123",
    conversation_id="conv456",
    interaction_type=InteractionType.RECOMMENDATION_CLICK,
    target_id="job789",
    match_score=0.85,
    metadata={"source": "chat", "rank": 1}
)

# Record satisfaction rating
tracker.record_satisfaction(
    user_id="user123",
    conversation_id="conv456",
    rating=SatisfactionLevel.SATISFIED,
    category="opportunity_match",
    feedback_text="Great recommendations!"
)

# Get metrics
metrics = tracker.get_metrics(
    user_id="user123",
    category="opportunity_match"
)
print(f"Average satisfaction: {metrics.average_satisfaction}")
print(f"Total interactions: {metrics.total_interactions}")
```

### QualityAlerter

Monitors quality metrics and triggers alerts when satisfaction falls below thresholds.

**Features:**
- Monitor average match satisfaction
- Trigger alerts when satisfaction falls below 80%
- Support for category-specific monitoring
- Alert severity levels (LOW, MEDIUM, HIGH, CRITICAL)
- Alert lifecycle management (creation, resolution)
- Callback notifications for stakeholders

**Usage:**

```python
from analytics import AnalyticsTracker, QualityAlerter

# Initialize
tracker = AnalyticsTracker()
alerter = QualityAlerter(
    analytics_tracker=tracker,
    satisfaction_threshold=0.8,  # 80%
    alert_callback=send_alert_notification
)

# Check satisfaction threshold
alert = alerter.check_satisfaction_threshold(
    category="opportunity_match",
    time_window_hours=24
)

if alert:
    print(f"Alert triggered: {alert.message}")
    print(f"Severity: {alert.severity}")

# Check all categories
alerts = alerter.check_all_categories(time_window_hours=24)
for alert in alerts:
    print(f"Category: {alert.metrics.get('category')}")
    print(f"Satisfaction: {alert.metrics['normalized_satisfaction']:.2%}")

# Continuous monitoring (call periodically via cron/scheduler)
new_alerts = alerter.monitor_continuous(
    check_interval_hours=1,
    time_window_hours=24
)

# Get active alerts
active_alerts = alerter.get_active_alerts()

# Resolve an alert
alerter.resolve_alert(alert.id)
```

## Data Models

### InteractionType

Types of user interactions:
- `RECOMMENDATION_VIEW`: User viewed a recommendation
- `RECOMMENDATION_CLICK`: User clicked on a recommendation
- `APPLICATION_SUBMIT`: User submitted an application
- `COLLABORATION_VIEW`: User viewed a collaborator profile
- `COLLABORATION_CONTACT`: User contacted a collaborator
- `INTERVIEW_QUESTION_VIEW`: User viewed interview questions
- `INTERVIEW_RESPONSE_SUBMIT`: User submitted interview response
- `DOCUMENT_UPLOAD`: User uploaded a document
- `DOCUMENT_SUBMIT`: User submitted a document

### SatisfactionLevel

User satisfaction ratings (1-5 scale):
- `VERY_DISSATISFIED` = 1
- `DISSATISFIED` = 2
- `NEUTRAL` = 3
- `SATISFIED` = 4
- `VERY_SATISFIED` = 5

### AnalyticsMetrics

Aggregated metrics:
- `total_interactions`: Total number of interactions
- `total_ratings`: Total number of satisfaction ratings
- `average_satisfaction`: Average satisfaction (1-5 scale)
- `satisfaction_by_category`: Average satisfaction per category
- `interaction_counts`: Count of interactions by type
- `time_period_start`: Start of time period
- `time_period_end`: End of time period

### QualityAlert

Alert information:
- `id`: Unique alert identifier
- `alert_type`: Type of alert (e.g., "LOW_SATISFACTION")
- `severity`: Severity level (LOW, MEDIUM, HIGH, CRITICAL)
- `message`: Human-readable alert message
- `triggered_at`: When the alert was triggered
- `metrics`: Metrics that triggered the alert
- `threshold_violated`: Description of violated threshold
- `resolved`: Whether the alert has been resolved
- `resolved_at`: When the alert was resolved

## Integration with Agent

The analytics system should be integrated into the agent workflow:

```python
from agent.core import MagnaAgent
from analytics import AnalyticsTracker, QualityAlerter

# Initialize analytics
tracker = AnalyticsTracker()
alerter = QualityAlerter(tracker, satisfaction_threshold=0.8)

# Initialize agent with analytics
agent = MagnaAgent(
    llm_orchestrator=llm,
    memory_system=memory,
    tool_registry=tools,
    analytics_tracker=tracker
)

# Track interactions in agent responses
async def process_with_analytics(user_id, message):
    response = await agent.process_message(user_id, message)
    
    # Track interaction if recommendation was provided
    if response.contains_recommendations:
        for rec in response.recommendations:
            tracker.track_interaction(
                user_id=user_id,
                conversation_id=response.conversation_id,
                interaction_type=InteractionType.RECOMMENDATION_VIEW,
                target_id=rec.id,
                match_score=rec.match_score
            )
    
    return response

# Periodic monitoring (run via scheduler)
def monitor_quality():
    alerts = alerter.monitor_continuous(
        check_interval_hours=1,
        time_window_hours=24
    )
    
    if alerts:
        # Send notifications to team
        for alert in alerts:
            notify_team(alert)
```

## Alert Severity Calculation

Severity is calculated based on normalized satisfaction (0-1 scale):

- **CRITICAL**: satisfaction < 0.5 (very low)
- **HIGH**: 0.5 ≤ satisfaction < 0.65
- **MEDIUM**: 0.65 ≤ satisfaction < 0.75
- **LOW**: 0.75 ≤ satisfaction < threshold (0.8)

## Database Schema

The analytics system requires the following database tables:

```sql
-- Interaction events
CREATE TABLE ai_interaction_events (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    conversation_id UUID NOT NULL,
    interaction_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    target_id VARCHAR(255),
    match_score FLOAT,
    metadata JSONB
);

-- Satisfaction ratings
CREATE TABLE ai_satisfaction_ratings (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    conversation_id UUID NOT NULL,
    interaction_event_id UUID,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    timestamp TIMESTAMPTZ NOT NULL,
    feedback_text TEXT,
    category VARCHAR(100),
    metadata JSONB
);

-- Quality alerts
CREATE TABLE ai_quality_alerts (
    id UUID PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    triggered_at TIMESTAMPTZ NOT NULL,
    metrics JSONB NOT NULL,
    threshold_violated VARCHAR(255) NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_interaction_events_user ON ai_interaction_events(user_id);
CREATE INDEX idx_interaction_events_timestamp ON ai_interaction_events(timestamp);
CREATE INDEX idx_satisfaction_ratings_user ON ai_satisfaction_ratings(user_id);
CREATE INDEX idx_satisfaction_ratings_category ON ai_satisfaction_ratings(category);
CREATE INDEX idx_quality_alerts_status ON ai_quality_alerts(resolved);
```

## Testing

Run the test suite:

```bash
# Test analytics tracker
python -m pytest tests/unit/test_analytics_tracker.py -v

# Test quality alerter
python -m pytest tests/unit/test_quality_alerter.py -v

# Run all analytics tests
python -m pytest tests/unit/test_analytics*.py -v
```

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 14.1**: Track user satisfaction ratings for recommendations ✓
- **Requirement 14.4**: Trigger alerts when match quality falls below 80% ✓
- **Requirement 14.6**: Collect implicit feedback through user interactions ✓

## Future Enhancements

- Database persistence (currently in-memory for development)
- Real-time dashboard for metrics visualization
- Advanced analytics (cohort analysis, trend detection)
- Machine learning for predictive quality monitoring
- Integration with external monitoring tools (Datadog, New Relic)
