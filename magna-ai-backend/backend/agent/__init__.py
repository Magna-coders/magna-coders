"""Agent module for Magna AI.

This module contains the core agent implementation using the ReAct pattern.
"""

from .core import (
    MagnaAgent,
    AgentResponse,
    Context,
    Analysis,
    ActionPlan,
    ActionResults,
)

__all__ = [
    "MagnaAgent",
    "AgentResponse",
    "Context",
    "Analysis",
    "ActionPlan",
    "ActionResults",
]
