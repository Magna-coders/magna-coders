"""
Matching data models for opportunity and collaboration scoring.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from enum import Enum


class OpportunityType(str, Enum):
    """Type of opportunity."""
    JOB = "job"
    PROJECT = "project"
    GIG = "gig"


@dataclass
class UserProfile:
    """User profile for matching."""
    user_id: str
    skills: List[str]
    location: str
    career_goals: str
    years_experience: float
    availability: str
    project_interests: Optional[str] = None
    work_history: Optional[List[str]] = None


@dataclass
class Opportunity:
    """Opportunity details for matching."""
    id: str
    title: str
    description: str
    required_skills: List[str]
    location: str
    remote: bool
    experience_required: str  # e.g., "2-5 years", "senior", "junior"
    opportunity_type: OpportunityType
    company: Optional[str] = None
    salary_range: Optional[str] = None


@dataclass
class MatchScore:
    """
    Match score breakdown between user and opportunity.
    
    All scores are 0-100 scale.
    """
    total_score: float
    skills_score: float
    location_score: float
    goals_score: float
    experience_score: float
    
    def to_dict(self) -> Dict[str, float]:
        """Convert to dictionary."""
        return {
            "total_score": self.total_score,
            "skills_score": self.skills_score,
            "location_score": self.location_score,
            "goals_score": self.goals_score,
            "experience_score": self.experience_score,
        }


@dataclass
class OpportunityMatch:
    """
    A matched opportunity with score and explanation.
    """
    opportunity: Opportunity
    match_score: MatchScore
    explanation: str
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "opportunity": {
                "id": self.opportunity.id,
                "title": self.opportunity.title,
                "description": self.opportunity.description,
                "required_skills": self.opportunity.required_skills,
                "location": self.opportunity.location,
                "remote": self.opportunity.remote,
                "experience_required": self.opportunity.experience_required,
                "opportunity_type": self.opportunity.opportunity_type.value,
                "company": self.opportunity.company,
                "salary_range": self.opportunity.salary_range,
            },
            "match_score": self.match_score.to_dict(),
            "explanation": self.explanation,
        }


@dataclass
class CollaborationScore:
    """
    Collaboration compatibility score breakdown.
    
    All scores are 0-100 scale.
    """
    total_score: float
    overlap_score: float
    complementarity_score: float
    interest_score: float
    availability_score: float
    shared_skills: List[str] = field(default_factory=list)
    complementary_skills: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "total_score": self.total_score,
            "overlap_score": self.overlap_score,
            "complementarity_score": self.complementarity_score,
            "interest_score": self.interest_score,
            "availability_score": self.availability_score,
            "shared_skills": self.shared_skills,
            "complementary_skills": self.complementary_skills,
        }


@dataclass
class CollaboratorMatch:
    """
    A matched collaborator with score and explanation.
    """
    user_profile: UserProfile
    collaboration_score: CollaborationScore
    explanation: str
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "user_profile": {
                "user_id": self.user_profile.user_id,
                "skills": self.user_profile.skills,
                "location": self.user_profile.location,
                "availability": self.user_profile.availability,
            },
            "collaboration_score": self.collaboration_score.to_dict(),
            "explanation": self.explanation,
        }
