"""
Matching Engines Module

Opportunity and collaboration matching with scoring algorithms.
"""

from .opportunity import OpportunityMatcher
from .collaboration import CollaborationMatcher

__all__ = ["OpportunityMatcher", "CollaborationMatcher"]
