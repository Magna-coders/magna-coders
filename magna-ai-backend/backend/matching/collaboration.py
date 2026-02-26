"""
Collaboration Matching Engine

Finds compatible collaborators using vector similarity on profiles.
"""

from typing import List, Optional, Dict, Any
import re
import numpy as np

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False

from ..models.matching import (
    UserProfile,
    CollaborationScore,
    CollaboratorMatch,
)
from ..memory.embeddings import EmbeddingModel


class CollaborationMatcher:
    """
    Matches users with potential collaborators using vector similarity.
    
    Collaboration score calculation considers:
    - Skill overlap (30% weight) - shared expertise
    - Skill complementarity (30% weight) - different but useful skills
    - Interest alignment (20% weight)
    - Availability match (20% weight)
    
    Uses FAISS for efficient vector similarity search on profile embeddings.
    """
    
    def __init__(
        self,
        embedding_model: EmbeddingModel,
        min_match_score: float = 0.6
    ):
        """
        Initialize collaboration matcher.
        
        Args:
            embedding_model: Model for generating profile embeddings
            min_match_score: Minimum match score threshold (0.0-1.0)
            
        Raises:
            ImportError: If FAISS is not installed
        """
        if not FAISS_AVAILABLE:
            raise ImportError(
                "faiss-cpu is not installed. "
                "Install it with: pip install faiss-cpu"
            )
        
        self.embedding_model = embedding_model
        self.min_match_score = min_match_score
        
        # FAISS index for vector similarity search
        # Will be initialized when first profile is indexed
        self.index: Optional[faiss.Index] = None
        
        # Map from FAISS index position to user_id
        self.index_to_user_id: Dict[int, str] = {}
        
        # Cache of user profiles for scoring
        self.user_profiles: Dict[str, UserProfile] = {}
    
    async def index_user_profile(
        self,
        user_id: str,
        profile: UserProfile
    ) -> None:
        """
        Generate and store profile embedding in vector database.
        
        Args:
            user_id: User ID
            profile: User profile to index
        """
        # Create profile text for embedding
        profile_text = self._profile_to_text(profile)
        
        # Generate embedding
        embedding = await self.embedding_model.generate_embedding(profile_text)
        embedding_array = np.array([embedding], dtype=np.float32)
        
        # Initialize FAISS index if needed
        if self.index is None:
            dimension = len(embedding)
            # Use L2 distance for cosine similarity (after normalization)
            self.index = faiss.IndexFlatL2(dimension)
        
        # Normalize embedding for cosine similarity
        faiss.normalize_L2(embedding_array)
        
        # Add to index
        current_size = self.index.ntotal
        self.index.add(embedding_array)
        
        # Store mapping
        self.index_to_user_id[current_size] = user_id
        self.user_profiles[user_id] = profile
    
    async def find_collaborators(
        self,
        user_profile: UserProfile,
        candidates: List[UserProfile],
        criteria: Optional[Dict[str, Any]] = None,
        limit: int = 10
    ) -> List[CollaboratorMatch]:
        """
        Find matching collaborators for user.
        
        Args:
            user_profile: User's profile
            candidates: List of candidate profiles to match against
            criteria: Optional filtering criteria
            limit: Maximum number of matches
            
        Returns:
            List of collaborator matches ranked by score (descending)
        """
        matches = []
        
        for candidate in candidates:
            # Skip self-matching
            if candidate.user_id == user_profile.user_id:
                continue
            
            # Apply filters if provided
            if criteria and not self._passes_criteria(candidate, criteria):
                continue
            
            # Calculate collaboration score
            collab_score = self.calculate_collaboration_score(
                user_profile,
                candidate
            )
            
            # Only include matches above threshold
            if collab_score.total_score >= (self.min_match_score * 100):
                explanation = self.explain_match(collab_score, user_profile, candidate)
                matches.append(
                    CollaboratorMatch(
                        user_profile=candidate,
                        collaboration_score=collab_score,
                        explanation=explanation
                    )
                )
        
        # Sort by total score descending
        matches.sort(
            key=lambda m: m.collaboration_score.total_score,
            reverse=True
        )
        
        # Return top N matches
        return matches[:limit]
    
    def calculate_collaboration_score(
        self,
        user_profile: UserProfile,
        candidate_profile: UserProfile
    ) -> CollaborationScore:
        """
        Calculate collaboration compatibility score.
        
        Considers both overlap (shared skills) and complementarity
        (different but useful skills).
        
        Args:
            user_profile: User's profile
            candidate_profile: Candidate's profile
            
        Returns:
            Collaboration score with breakdown
        """
        # Skill overlap (30% weight) - shared expertise
        overlap_score, shared_skills = self._calculate_overlap_score(
            user_profile.skills,
            candidate_profile.skills
        )
        
        # Skill complementarity (30% weight) - different but useful skills
        complementarity_score, complementary_skills = self._calculate_complementarity_score(
            user_profile.skills,
            candidate_profile.skills,
            user_profile.project_interests or ""
        )
        
        # Interest alignment (20% weight)
        interest_score = self._calculate_interest_score(
            user_profile.project_interests or "",
            candidate_profile.project_interests or ""
        )
        
        # Availability match (20% weight)
        availability_score = self._calculate_availability_score(
            user_profile.availability,
            candidate_profile.availability
        )
        
        # Weighted total
        total_score = (
            overlap_score * 0.3 +
            complementarity_score * 0.3 +
            interest_score * 0.2 +
            availability_score * 0.2
        )
        
        return CollaborationScore(
            total_score=total_score,
            overlap_score=overlap_score,
            complementarity_score=complementarity_score,
            interest_score=interest_score,
            availability_score=availability_score,
            shared_skills=shared_skills,
            complementary_skills=complementary_skills
        )
    
    def explain_match(
        self,
        collab_score: CollaborationScore,
        user_profile: UserProfile,
        candidate_profile: UserProfile
    ) -> str:
        """
        Generate human-readable explanation for collaboration match.
        
        Args:
            collab_score: Calculated collaboration score
            user_profile: User's profile
            candidate_profile: Candidate's profile
            
        Returns:
            Human-readable explanation string
        """
        explanations = []
        
        # Overall match
        explanations.append(
            f"Overall collaboration fit: {collab_score.total_score:.0f}%"
        )
        
        # Shared skills explanation
        if collab_score.shared_skills:
            skills_list = ", ".join(sorted(collab_score.shared_skills[:5]))
            if len(collab_score.shared_skills) > 5:
                skills_list += f" (+{len(collab_score.shared_skills) - 5} more)"
            explanations.append(
                f"Shared expertise ({collab_score.overlap_score:.0f}%): "
                f"Both skilled in {skills_list}"
            )
        else:
            explanations.append(
                f"Shared expertise ({collab_score.overlap_score:.0f}%): "
                f"Limited skill overlap"
            )
        
        # Complementary skills explanation
        if collab_score.complementary_skills:
            comp_list = ", ".join(sorted(collab_score.complementary_skills[:5]))
            if len(collab_score.complementary_skills) > 5:
                comp_list += f" (+{len(collab_score.complementary_skills) - 5} more)"
            explanations.append(
                f"Complementary skills ({collab_score.complementarity_score:.0f}%): "
                f"They bring {comp_list}"
            )
        else:
            explanations.append(
                f"Complementary skills ({collab_score.complementarity_score:.0f}%): "
                f"Few additional skills"
            )
        
        # Interest alignment explanation
        if collab_score.interest_score >= 70:
            explanations.append(
                f"Project interests ({collab_score.interest_score:.0f}%): "
                f"Strong alignment in project goals"
            )
        elif collab_score.interest_score >= 50:
            explanations.append(
                f"Project interests ({collab_score.interest_score:.0f}%): "
                f"Moderate interest overlap"
            )
        else:
            explanations.append(
                f"Project interests ({collab_score.interest_score:.0f}%): "
                f"Different project focus areas"
            )
        
        # Availability explanation
        if collab_score.availability_score >= 80:
            explanations.append(
                f"Availability ({collab_score.availability_score:.0f}%): "
                f"Excellent schedule compatibility"
            )
        elif collab_score.availability_score >= 60:
            explanations.append(
                f"Availability ({collab_score.availability_score:.0f}%): "
                f"Good availability match"
            )
        else:
            explanations.append(
                f"Availability ({collab_score.availability_score:.0f}%): "
                f"Limited schedule overlap"
            )
        
        return ". ".join(explanations) + "."
    
    def _profile_to_text(self, profile: UserProfile) -> str:
        """
        Convert profile to text for embedding generation.
        
        Args:
            profile: User profile
            
        Returns:
            Text representation of profile
        """
        parts = []
        
        # Skills
        if profile.skills:
            parts.append(f"Skills: {', '.join(profile.skills)}")
        
        # Career goals
        if profile.career_goals:
            parts.append(f"Goals: {profile.career_goals}")
        
        # Project interests
        if profile.project_interests:
            parts.append(f"Interests: {profile.project_interests}")
        
        # Experience
        parts.append(f"Experience: {profile.years_experience} years")
        
        # Location
        parts.append(f"Location: {profile.location}")
        
        # Availability
        parts.append(f"Availability: {profile.availability}")
        
        return ". ".join(parts)
    
    def _calculate_overlap_score(
        self,
        user_skills: List[str],
        candidate_skills: List[str]
    ) -> tuple[float, List[str]]:
        """
        Calculate skill overlap score.
        
        Args:
            user_skills: User's skills
            candidate_skills: Candidate's skills
            
        Returns:
            Tuple of (score 0-100, list of shared skills)
        """
        if not user_skills or not candidate_skills:
            return (0.0, [])
        
        # Normalize to lowercase
        user_skills_set = set(s.lower() for s in user_skills)
        candidate_skills_set = set(s.lower() for s in candidate_skills)
        
        # Find shared skills
        shared = user_skills_set & candidate_skills_set
        
        if not shared:
            return (0.0, [])
        
        # Score based on percentage of overlap relative to smaller skill set
        smaller_set_size = min(len(user_skills_set), len(candidate_skills_set))
        score = (len(shared) / smaller_set_size) * 100
        
        return (min(score, 100.0), list(shared))
    
    def _calculate_complementarity_score(
        self,
        user_skills: List[str],
        candidate_skills: List[str],
        user_interests: str
    ) -> tuple[float, List[str]]:
        """
        Calculate skill complementarity score.
        
        Measures how valuable the candidate's unique skills are
        for the user's project interests.
        
        Args:
            user_skills: User's skills
            candidate_skills: Candidate's skills
            user_interests: User's project interests
            
        Returns:
            Tuple of (score 0-100, list of complementary skills)
        """
        if not candidate_skills:
            return (0.0, [])
        
        # Normalize to lowercase
        user_skills_set = set(s.lower() for s in user_skills)
        candidate_skills_set = set(s.lower() for s in candidate_skills)
        
        # Find complementary skills (candidate has but user doesn't)
        complementary = candidate_skills_set - user_skills_set
        
        if not complementary:
            return (0.0, [])
        
        # If no interests specified, give moderate score for any complementary skills
        if not user_interests:
            score = min((len(complementary) / len(candidate_skills_set)) * 70, 70.0)
            return (score, list(complementary))
        
        # Calculate relevance of complementary skills to user's interests
        interests_lower = user_interests.lower()
        interests_words = set(re.findall(r'\b\w+\b', interests_lower))
        
        # Count how many complementary skills are mentioned in interests
        relevant_count = 0
        for skill in complementary:
            skill_words = set(re.findall(r'\b\w+\b', skill))
            if skill_words & interests_words:
                relevant_count += 1
        
        # Score based on relevance
        if relevant_count > 0:
            # High score if complementary skills match interests
            score = min((relevant_count / len(complementary)) * 100, 100.0)
        else:
            # Moderate score for any complementary skills
            score = min((len(complementary) / len(candidate_skills_set)) * 60, 60.0)
        
        return (score, list(complementary))
    
    def _calculate_interest_score(
        self,
        user_interests: str,
        candidate_interests: str
    ) -> float:
        """
        Calculate project interest alignment score.
        
        Args:
            user_interests: User's project interests
            candidate_interests: Candidate's project interests
            
        Returns:
            Score from 0-100
        """
        if not user_interests or not candidate_interests:
            return 50.0  # Neutral score when data missing
        
        # Normalize text
        user_lower = user_interests.lower()
        candidate_lower = candidate_interests.lower()
        
        # Extract keywords
        user_words = set(re.findall(r'\b\w+\b', user_lower))
        candidate_words = set(re.findall(r'\b\w+\b', candidate_lower))
        
        # Remove common stop words
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
            'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
            'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
            'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
        }
        user_words -= stop_words
        candidate_words -= stop_words
        
        # Calculate keyword overlap
        if not user_words:
            return 50.0
        
        overlap = len(user_words & candidate_words)
        score = (overlap / len(user_words)) * 100
        
        return min(score, 100.0)
    
    def _calculate_availability_score(
        self,
        user_availability: str,
        candidate_availability: str
    ) -> float:
        """
        Calculate availability match score.
        
        Args:
            user_availability: User's availability
            candidate_availability: Candidate's availability
            
        Returns:
            Score from 0-100
        """
        # Normalize
        user_avail = user_availability.lower()
        candidate_avail = candidate_availability.lower()
        
        # Exact match
        if user_avail == candidate_avail:
            return 100.0
        
        # Common availability patterns
        full_time_patterns = ['full-time', 'full time', 'fulltime', 'ft']
        part_time_patterns = ['part-time', 'part time', 'parttime', 'pt']
        flexible_patterns = ['flexible', 'negotiable', 'open']
        
        user_is_full = any(p in user_avail for p in full_time_patterns)
        user_is_part = any(p in user_avail for p in part_time_patterns)
        user_is_flex = any(p in user_avail for p in flexible_patterns)
        
        candidate_is_full = any(p in candidate_avail for p in full_time_patterns)
        candidate_is_part = any(p in candidate_avail for p in part_time_patterns)
        candidate_is_flex = any(p in candidate_avail for p in flexible_patterns)
        
        # Flexible availability matches everything well
        if user_is_flex or candidate_is_flex:
            return 90.0
        
        # Same category match
        if (user_is_full and candidate_is_full) or (user_is_part and candidate_is_part):
            return 100.0
        
        # Different categories
        if (user_is_full and candidate_is_part) or (user_is_part and candidate_is_full):
            return 50.0
        
        # Unable to parse - neutral score
        return 60.0
    
    def _passes_criteria(
        self,
        candidate: UserProfile,
        criteria: Dict[str, Any]
    ) -> bool:
        """
        Check if candidate passes filter criteria.
        
        Args:
            candidate: Candidate profile
            criteria: Filter criteria
            
        Returns:
            True if candidate passes all filters
        """
        # Location filter
        if 'location' in criteria:
            filter_location = criteria['location'].lower()
            candidate_location = candidate.location.lower()
            if filter_location not in candidate_location:
                return False
        
        # Required skills filter
        if 'required_skills' in criteria:
            filter_skills = set(s.lower() for s in criteria['required_skills'])
            candidate_skills = set(s.lower() for s in candidate.skills)
            if not (filter_skills & candidate_skills):
                return False
        
        # Availability filter
        if 'availability' in criteria:
            filter_avail = criteria['availability'].lower()
            candidate_avail = candidate.availability.lower()
            if filter_avail not in candidate_avail:
                return False
        
        # Minimum experience filter
        if 'min_experience' in criteria:
            if candidate.years_experience < criteria['min_experience']:
                return False
        
        return True
