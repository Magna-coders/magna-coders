"""
Opportunity Matching Engine

Scores and ranks opportunities based on user profile compatibility.
"""

from typing import List, Optional, Dict, Any
import re

from ..models.matching import (
    UserProfile,
    Opportunity,
    MatchScore,
    OpportunityMatch,
    OpportunityType,
)


class OpportunityMatcher:
    """
    Matches users with opportunities using weighted scoring algorithm.
    
    Match score calculation considers:
    - Skills compatibility (40% weight)
    - Location compatibility (20% weight)
    - Career goals alignment (20% weight)
    - Experience level match (20% weight)
    
    Only opportunities with match scores > 70% are recommended.
    """
    
    def __init__(
        self,
        min_match_score: float = 0.7
    ):
        """
        Initialize opportunity matcher.
        
        Args:
            min_match_score: Minimum match score threshold (0.0-1.0)
        """
        self.min_match_score = min_match_score
    
    def calculate_match_score(
        self,
        user_profile: UserProfile,
        opportunity: Opportunity
    ) -> MatchScore:
        """
        Calculate compatibility score between user and opportunity.
        
        Args:
            user_profile: User's profile with skills, location, goals, experience
            opportunity: Opportunity details
            
        Returns:
            MatchScore with total and breakdown by factor
        """
        # Skills compatibility (40% weight)
        skills_score = self._calculate_skills_score(
            user_profile.skills,
            opportunity.required_skills
        )
        
        # Location compatibility (20% weight)
        location_score = self._calculate_location_score(
            user_profile.location,
            opportunity.location,
            opportunity.remote
        )
        
        # Career goals alignment (20% weight)
        goals_score = self._calculate_goals_score(
            user_profile.career_goals,
            opportunity.description
        )
        
        # Experience level match (20% weight)
        experience_score = self._calculate_experience_score(
            user_profile.years_experience,
            opportunity.experience_required
        )
        
        # Weighted total
        total_score = (
            skills_score * 0.4 +
            location_score * 0.2 +
            goals_score * 0.2 +
            experience_score * 0.2
        )
        
        return MatchScore(
            total_score=total_score,
            skills_score=skills_score,
            location_score=location_score,
            goals_score=goals_score,
            experience_score=experience_score
        )
    
    def find_matches(
        self,
        user_profile: UserProfile,
        opportunities: List[Opportunity],
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 10
    ) -> List[OpportunityMatch]:
        """
        Find and rank matching opportunities for user.
        
        Args:
            user_profile: User's profile
            opportunities: List of available opportunities
            filters: Optional filters (opportunity_type, location, etc.)
            limit: Maximum number of matches to return
            
        Returns:
            List of OpportunityMatch objects ranked by score (descending)
        """
        matches = []
        
        for opportunity in opportunities:
            # Apply filters if provided
            if filters and not self._passes_filters(opportunity, filters):
                continue
            
            # Calculate match score
            match_score = self.calculate_match_score(user_profile, opportunity)
            
            # Only include matches above threshold
            if match_score.total_score >= (self.min_match_score * 100):
                explanation = self.explain_match(match_score, user_profile, opportunity)
                matches.append(
                    OpportunityMatch(
                        opportunity=opportunity,
                        match_score=match_score,
                        explanation=explanation
                    )
                )
        
        # Sort by total score descending
        matches.sort(key=lambda m: m.match_score.total_score, reverse=True)
        
        # Return top N matches
        return matches[:limit]
    
    def explain_match(
        self,
        match_score: MatchScore,
        user_profile: UserProfile,
        opportunity: Opportunity
    ) -> str:
        """
        Generate human-readable explanation for match.
        
        Args:
            match_score: Calculated match score
            user_profile: User's profile
            opportunity: Opportunity details
            
        Returns:
            Human-readable explanation string
        """
        explanations = []
        
        # Overall match
        explanations.append(
            f"Overall match: {match_score.total_score:.0f}% compatibility"
        )
        
        # Skills explanation
        user_skills = set(s.lower() for s in user_profile.skills)
        required_skills = set(s.lower() for s in opportunity.required_skills)
        matching_skills = user_skills & required_skills
        
        if matching_skills:
            skills_list = ", ".join(sorted(matching_skills))
            explanations.append(
                f"Skills match ({match_score.skills_score:.0f}%): "
                f"You have {len(matching_skills)}/{len(required_skills)} "
                f"required skills ({skills_list})"
            )
        else:
            explanations.append(
                f"Skills match ({match_score.skills_score:.0f}%): "
                f"Limited skill overlap with requirements"
            )
        
        # Location explanation
        if opportunity.remote:
            explanations.append(
                f"Location match ({match_score.location_score:.0f}%): "
                f"Remote position - location flexible"
            )
        elif user_profile.location.lower() == opportunity.location.lower():
            explanations.append(
                f"Location match ({match_score.location_score:.0f}%): "
                f"Perfect location match in {opportunity.location}"
            )
        else:
            explanations.append(
                f"Location match ({match_score.location_score:.0f}%): "
                f"Position in {opportunity.location}"
            )
        
        # Goals explanation
        if match_score.goals_score >= 70:
            explanations.append(
                f"Career goals alignment ({match_score.goals_score:.0f}%): "
                f"Strong alignment with your career objectives"
            )
        elif match_score.goals_score >= 50:
            explanations.append(
                f"Career goals alignment ({match_score.goals_score:.0f}%): "
                f"Moderate alignment with your career path"
            )
        else:
            explanations.append(
                f"Career goals alignment ({match_score.goals_score:.0f}%): "
                f"May not fully align with stated goals"
            )
        
        # Experience explanation
        if match_score.experience_score >= 80:
            explanations.append(
                f"Experience match ({match_score.experience_score:.0f}%): "
                f"Your experience level is ideal for this role"
            )
        elif match_score.experience_score >= 60:
            explanations.append(
                f"Experience match ({match_score.experience_score:.0f}%): "
                f"Your experience is suitable for this position"
            )
        else:
            explanations.append(
                f"Experience match ({match_score.experience_score:.0f}%): "
                f"Experience level may differ from requirements"
            )
        
        return ". ".join(explanations) + "."
    
    def _calculate_skills_score(
        self,
        user_skills: List[str],
        required_skills: List[str]
    ) -> float:
        """
        Calculate skills compatibility score.
        
        Args:
            user_skills: User's skill list
            required_skills: Required skills for opportunity
            
        Returns:
            Score from 0-100
        """
        if not required_skills:
            return 100.0
        
        if not user_skills:
            return 0.0
        
        # Normalize to lowercase for comparison
        user_skills_set = set(s.lower() for s in user_skills)
        required_skills_set = set(s.lower() for s in required_skills)
        
        # Calculate overlap
        skills_overlap = len(user_skills_set & required_skills_set)
        
        # Score based on percentage of required skills matched
        score = (skills_overlap / len(required_skills_set)) * 100
        
        return min(score, 100.0)
    
    def _calculate_location_score(
        self,
        user_location: str,
        opportunity_location: str,
        is_remote: bool
    ) -> float:
        """
        Calculate location compatibility score.
        
        Args:
            user_location: User's location
            opportunity_location: Opportunity location
            is_remote: Whether opportunity is remote
            
        Returns:
            Score from 0-100
        """
        # Remote positions get perfect score
        if is_remote:
            return 100.0
        
        # Exact location match
        if user_location.lower() == opportunity_location.lower():
            return 100.0
        
        # Partial match (e.g., same city or region)
        # Simple heuristic: check if one location contains the other
        user_loc_lower = user_location.lower()
        opp_loc_lower = opportunity_location.lower()
        
        if user_loc_lower in opp_loc_lower or opp_loc_lower in user_loc_lower:
            return 75.0
        
        # No match - could be improved with geocoding/distance calculation
        return 30.0
    
    def _calculate_goals_score(
        self,
        career_goals: str,
        opportunity_description: str
    ) -> float:
        """
        Calculate career goals alignment score using keyword matching.
        
        Args:
            career_goals: User's career goals text
            opportunity_description: Opportunity description
            
        Returns:
            Score from 0-100
        """
        if not career_goals or not opportunity_description:
            return 50.0  # Neutral score when data missing
        
        # Normalize text
        goals_lower = career_goals.lower()
        desc_lower = opportunity_description.lower()
        
        # Extract keywords (simple word tokenization)
        goals_words = set(re.findall(r'\b\w+\b', goals_lower))
        desc_words = set(re.findall(r'\b\w+\b', desc_lower))
        
        # Remove common stop words
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
            'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
            'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
            'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
        }
        goals_words -= stop_words
        desc_words -= stop_words
        
        # Calculate keyword overlap
        if not goals_words:
            return 50.0
        
        overlap = len(goals_words & desc_words)
        score = (overlap / len(goals_words)) * 100
        
        # Cap at 100
        return min(score, 100.0)
    
    def _calculate_experience_score(
        self,
        user_experience: float,
        required_experience: str
    ) -> float:
        """
        Calculate experience level match score.
        
        Args:
            user_experience: User's years of experience
            required_experience: Required experience description
            
        Returns:
            Score from 0-100
        """
        # Parse required experience
        required_years = self._parse_experience_requirement(required_experience)
        
        if required_years is None:
            return 70.0  # Neutral score when requirement unclear
        
        # Calculate score based on how close user's experience is
        if isinstance(required_years, tuple):
            # Range specified (e.g., "2-5 years")
            min_years, max_years = required_years
            
            if min_years <= user_experience <= max_years:
                return 100.0  # Perfect match
            elif user_experience < min_years:
                # Under-qualified
                gap = min_years - user_experience
                score = max(100 - (gap * 15), 20)  # Penalize 15 points per year
                return score
            else:
                # Over-qualified
                gap = user_experience - max_years
                score = max(100 - (gap * 10), 40)  # Penalize 10 points per year
                return score
        else:
            # Single value specified
            target_years = required_years
            difference = abs(user_experience - target_years)
            
            if difference == 0:
                return 100.0
            elif difference <= 1:
                return 90.0
            elif difference <= 2:
                return 75.0
            elif difference <= 3:
                return 60.0
            else:
                return max(60 - (difference * 10), 20)
    
    def _parse_experience_requirement(
        self,
        requirement: str
    ) -> Optional[float | tuple[float, float]]:
        """
        Parse experience requirement string into years.
        
        Args:
            requirement: Experience requirement text
            
        Returns:
            Single float, tuple of (min, max), or None if unparseable
        """
        req_lower = requirement.lower()
        
        # Look for range patterns like "2-5 years", "2 to 5 years"
        range_match = re.search(r'(\d+)\s*[-to]+\s*(\d+)', req_lower)
        if range_match:
            min_years = float(range_match.group(1))
            max_years = float(range_match.group(2))
            return (min_years, max_years)
        
        # Look for single number like "3 years", "5+ years"
        single_match = re.search(r'(\d+)\+?\s*years?', req_lower)
        if single_match:
            years = float(single_match.group(1))
            return years
        
        # Level-based requirements
        if 'junior' in req_lower or 'entry' in req_lower:
            return (0.0, 2.0)
        elif 'mid' in req_lower or 'intermediate' in req_lower:
            return (2.0, 5.0)
        elif 'senior' in req_lower:
            return (5.0, 10.0)
        elif 'lead' in req_lower or 'principal' in req_lower:
            return (8.0, 15.0)
        
        # Unable to parse
        return None
    
    def _passes_filters(
        self,
        opportunity: Opportunity,
        filters: Dict[str, Any]
    ) -> bool:
        """
        Check if opportunity passes filter criteria.
        
        Args:
            opportunity: Opportunity to check
            filters: Filter criteria
            
        Returns:
            True if opportunity passes all filters
        """
        # Opportunity type filter
        if 'opportunity_type' in filters:
            filter_type = filters['opportunity_type']
            if isinstance(filter_type, str):
                filter_type = OpportunityType(filter_type)
            if opportunity.opportunity_type != filter_type:
                return False
        
        # Location filter
        if 'location' in filters:
            filter_location = filters['location'].lower()
            opp_location = opportunity.location.lower()
            if not opportunity.remote and filter_location not in opp_location:
                return False
        
        # Remote filter
        if 'remote_only' in filters and filters['remote_only']:
            if not opportunity.remote:
                return False
        
        # Skills filter (must have at least one required skill)
        if 'required_skills' in filters:
            filter_skills = set(s.lower() for s in filters['required_skills'])
            opp_skills = set(s.lower() for s in opportunity.required_skills)
            if not (filter_skills & opp_skills):
                return False
        
        return True
