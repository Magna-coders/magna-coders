"""
Unit tests for CollaborationMatcher.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock

from ...matching.collaboration import CollaborationMatcher
from ...models.matching import UserProfile, CollaborationScore
from ...memory.embeddings import EmbeddingModel


class MockEmbeddingModel(EmbeddingModel):
    """Mock embedding model for testing."""
    
    async def generate_embedding(self, text: str) -> list[float]:
        """Generate mock embedding based on text length."""
        # Simple mock: use text length to create deterministic embedding
        base = [0.1] * 384
        text_hash = hash(text) % 100
        base[0] = text_hash / 100.0
        return base
    
    @property
    def embedding_dimension(self) -> int:
        """Return mock dimension."""
        return 384


@pytest.fixture
def embedding_model():
    """Create mock embedding model."""
    return MockEmbeddingModel()


@pytest.fixture
def matcher(embedding_model):
    """Create CollaborationMatcher instance."""
    return CollaborationMatcher(
        embedding_model=embedding_model,
        min_match_score=0.5  # Lower threshold for testing
    )


@pytest.fixture
def user_profile():
    """Create sample user profile."""
    return UserProfile(
        user_id="user1",
        skills=["Python", "JavaScript", "React", "FastAPI"],
        location="Nairobi, Kenya",
        career_goals="Build scalable web applications",
        years_experience=3.0,
        availability="full-time",
        project_interests="web development, API design, cloud computing"
    )


@pytest.fixture
def candidate_profile_high_overlap():
    """Create candidate with high skill overlap."""
    return UserProfile(
        user_id="candidate1",
        skills=["Python", "JavaScript", "Django", "PostgreSQL"],
        location="Nairobi, Kenya",
        career_goals="Create innovative web solutions",
        years_experience=4.0,
        availability="full-time",
        project_interests="web development, database design, microservices"
    )


@pytest.fixture
def candidate_profile_complementary():
    """Create candidate with complementary skills."""
    return UserProfile(
        user_id="candidate2",
        skills=["Go", "Kubernetes", "Docker", "AWS"],
        location="Mombasa, Kenya",
        career_goals="Build cloud infrastructure",
        years_experience=5.0,
        availability="part-time",
        project_interests="cloud computing, DevOps, infrastructure"
    )


@pytest.fixture
def candidate_profile_low_match():
    """Create candidate with low match."""
    return UserProfile(
        user_id="candidate3",
        skills=["Java", "Spring", "Android"],
        location="Lagos, Nigeria",
        career_goals="Mobile app development",
        years_experience=2.0,
        availability="flexible",
        project_interests="mobile apps, Android development"
    )


class TestCollaborationScore:
    """Test collaboration score calculation."""
    
    def test_calculate_score_high_overlap(self, matcher, user_profile, candidate_profile_high_overlap):
        """Test score calculation with high skill overlap."""
        score = matcher.calculate_collaboration_score(
            user_profile,
            candidate_profile_high_overlap
        )
        
        # Should have good overlap (Python, JavaScript)
        assert score.overlap_score > 40.0
        assert "python" in score.shared_skills
        assert "javascript" in score.shared_skills
        
        # Should have some complementary skills
        assert len(score.complementary_skills) > 0
        
        # Should have good interest alignment
        assert score.interest_score > 30.0
        
        # Should have perfect availability match
        assert score.availability_score == 100.0
        
        # Total should be weighted combination
        assert 0 <= score.total_score <= 100
    
    def test_calculate_score_complementary(self, matcher, user_profile, candidate_profile_complementary):
        """Test score calculation with complementary skills."""
        score = matcher.calculate_collaboration_score(
            user_profile,
            candidate_profile_complementary
        )
        
        # Should have low overlap (no shared skills)
        assert score.overlap_score < 20.0
        assert len(score.shared_skills) == 0
        
        # Should have high complementarity (cloud skills useful for web dev)
        assert len(score.complementary_skills) > 0
        assert "kubernetes" in score.complementary_skills or "docker" in score.complementary_skills
        
        # Should have some interest alignment (cloud computing)
        assert score.interest_score > 0
        
        # Different availability
        assert score.availability_score < 100.0
    
    def test_calculate_score_low_match(self, matcher, user_profile, candidate_profile_low_match):
        """Test score calculation with low match."""
        score = matcher.calculate_collaboration_score(
            user_profile,
            candidate_profile_low_match
        )
        
        # Should have low overlap
        assert score.overlap_score < 20.0
        
        # Should have low complementarity (mobile skills not relevant to web)
        assert score.complementarity_score < 70.0
        
        # Should have low interest alignment
        assert score.interest_score < 50.0
        
        # Total should be low
        assert score.total_score < 70.0
    
    def test_score_components_sum_correctly(self, matcher, user_profile, candidate_profile_high_overlap):
        """Test that score components are weighted correctly."""
        score = matcher.calculate_collaboration_score(
            user_profile,
            candidate_profile_high_overlap
        )
        
        # Calculate expected total
        expected_total = (
            score.overlap_score * 0.3 +
            score.complementarity_score * 0.3 +
            score.interest_score * 0.2 +
            score.availability_score * 0.2
        )
        
        # Should match (within floating point precision)
        assert abs(score.total_score - expected_total) < 0.01


class TestFindCollaborators:
    """Test finding collaborators."""
    
    @pytest.mark.asyncio
    async def test_find_collaborators_basic(
        self,
        matcher,
        user_profile,
        candidate_profile_high_overlap,
        candidate_profile_complementary
    ):
        """Test basic collaborator finding."""
        candidates = [candidate_profile_high_overlap, candidate_profile_complementary]
        
        matches = await matcher.find_collaborators(
            user_profile=user_profile,
            candidates=candidates,
            limit=10
        )
        
        # Should return at least one match (high overlap candidate should match)
        assert len(matches) >= 1
        
        # Should be sorted by score descending
        for i in range(len(matches) - 1):
            assert matches[i].collaboration_score.total_score >= matches[i + 1].collaboration_score.total_score
        
        # Each match should have explanation
        for match in matches:
            assert match.explanation
            assert len(match.explanation) > 0
    
    @pytest.mark.asyncio
    async def test_find_collaborators_filters_self(
        self,
        matcher,
        user_profile
    ):
        """Test that user doesn't match with themselves."""
        # Create candidate with same user_id
        self_candidate = UserProfile(
            user_id=user_profile.user_id,
            skills=user_profile.skills,
            location=user_profile.location,
            career_goals=user_profile.career_goals,
            years_experience=user_profile.years_experience,
            availability=user_profile.availability,
            project_interests=user_profile.project_interests
        )
        
        matches = await matcher.find_collaborators(
            user_profile=user_profile,
            candidates=[self_candidate],
            limit=10
        )
        
        # Should not match with self
        assert len(matches) == 0
    
    @pytest.mark.asyncio
    async def test_find_collaborators_respects_limit(
        self,
        matcher,
        user_profile
    ):
        """Test that limit parameter is respected."""
        # Create many candidates
        candidates = []
        for i in range(20):
            candidate = UserProfile(
                user_id=f"candidate{i}",
                skills=["Python", "JavaScript"],
                location="Nairobi, Kenya",
                career_goals="Web development",
                years_experience=3.0,
                availability="full-time",
                project_interests="web development"
            )
            candidates.append(candidate)
        
        matches = await matcher.find_collaborators(
            user_profile=user_profile,
            candidates=candidates,
            limit=5
        )
        
        # Should respect limit
        assert len(matches) <= 5
    
    @pytest.mark.asyncio
    async def test_find_collaborators_with_criteria(
        self,
        matcher,
        user_profile,
        candidate_profile_high_overlap,
        candidate_profile_complementary
    ):
        """Test collaborator finding with filter criteria."""
        candidates = [candidate_profile_high_overlap, candidate_profile_complementary]
        
        # Filter by location
        matches = await matcher.find_collaborators(
            user_profile=user_profile,
            candidates=candidates,
            criteria={"location": "Nairobi"},
            limit=10
        )
        
        # Should only include Nairobi candidates
        for match in matches:
            assert "nairobi" in match.user_profile.location.lower()
    
    @pytest.mark.asyncio
    async def test_find_collaborators_min_score_threshold(
        self,
        matcher,
        user_profile,
        candidate_profile_low_match
    ):
        """Test that low-scoring candidates are filtered out."""
        matches = await matcher.find_collaborators(
            user_profile=user_profile,
            candidates=[candidate_profile_low_match],
            limit=10
        )
        
        # All returned matches should be above threshold
        for match in matches:
            assert match.collaboration_score.total_score >= (matcher.min_match_score * 100)


class TestExplanation:
    """Test match explanation generation."""
    
    def test_explain_match_high_overlap(self, matcher, user_profile, candidate_profile_high_overlap):
        """Test explanation for high overlap match."""
        score = matcher.calculate_collaboration_score(
            user_profile,
            candidate_profile_high_overlap
        )
        
        explanation = matcher.explain_match(score, user_profile, candidate_profile_high_overlap)
        
        # Should mention overall fit
        assert "collaboration fit" in explanation.lower()
        
        # Should mention shared skills
        assert "shared expertise" in explanation.lower()
        
        # Should mention complementary skills
        assert "complementary skills" in explanation.lower()
        
        # Should mention interests
        assert "interests" in explanation.lower()
        
        # Should mention availability
        assert "availability" in explanation.lower()
    
    def test_explain_match_includes_skill_names(self, matcher, user_profile, candidate_profile_high_overlap):
        """Test that explanation includes actual skill names."""
        score = matcher.calculate_collaboration_score(
            user_profile,
            candidate_profile_high_overlap
        )
        
        explanation = matcher.explain_match(score, user_profile, candidate_profile_high_overlap)
        
        # Should mention at least one shared skill
        has_skill = any(skill.lower() in explanation.lower() for skill in score.shared_skills)
        assert has_skill or len(score.shared_skills) == 0


class TestIndexing:
    """Test profile indexing with FAISS."""
    
    @pytest.mark.asyncio
    async def test_index_user_profile(self, matcher, user_profile):
        """Test indexing a user profile."""
        await matcher.index_user_profile(user_profile.user_id, user_profile)
        
        # Index should be initialized
        assert matcher.index is not None
        assert matcher.index.ntotal == 1
        
        # Mapping should be stored
        assert 0 in matcher.index_to_user_id
        assert matcher.index_to_user_id[0] == user_profile.user_id
        
        # Profile should be cached
        assert user_profile.user_id in matcher.user_profiles
    
    @pytest.mark.asyncio
    async def test_index_multiple_profiles(self, matcher, user_profile, candidate_profile_high_overlap):
        """Test indexing multiple profiles."""
        await matcher.index_user_profile(user_profile.user_id, user_profile)
        await matcher.index_user_profile(
            candidate_profile_high_overlap.user_id,
            candidate_profile_high_overlap
        )
        
        # Should have 2 profiles indexed
        assert matcher.index.ntotal == 2
        assert len(matcher.index_to_user_id) == 2
        assert len(matcher.user_profiles) == 2


class TestAvailabilityScoring:
    """Test availability matching logic."""
    
    def test_exact_match(self, matcher):
        """Test exact availability match."""
        score = matcher._calculate_availability_score("full-time", "full-time")
        assert score == 100.0
    
    def test_full_time_match(self, matcher):
        """Test full-time variations match."""
        score = matcher._calculate_availability_score("full-time", "fulltime")
        assert score == 100.0
    
    def test_flexible_availability(self, matcher):
        """Test flexible availability matches well."""
        score = matcher._calculate_availability_score("flexible", "full-time")
        assert score >= 90.0
    
    def test_different_availability(self, matcher):
        """Test different availability types."""
        score = matcher._calculate_availability_score("full-time", "part-time")
        assert score < 100.0


class TestCriteriaFiltering:
    """Test criteria filtering logic."""
    
    def test_location_filter(self, matcher, candidate_profile_high_overlap):
        """Test location filtering."""
        # Should pass Nairobi filter
        assert matcher._passes_criteria(
            candidate_profile_high_overlap,
            {"location": "Nairobi"}
        )
        
        # Should not pass Lagos filter
        assert not matcher._passes_criteria(
            candidate_profile_high_overlap,
            {"location": "Lagos"}
        )
    
    def test_required_skills_filter(self, matcher, candidate_profile_high_overlap):
        """Test required skills filtering."""
        # Should pass Python filter
        assert matcher._passes_criteria(
            candidate_profile_high_overlap,
            {"required_skills": ["Python"]}
        )
        
        # Should not pass Go filter
        assert not matcher._passes_criteria(
            candidate_profile_high_overlap,
            {"required_skills": ["Go"]}
        )
    
    def test_min_experience_filter(self, matcher, candidate_profile_high_overlap):
        """Test minimum experience filtering."""
        # Should pass 3 years filter
        assert matcher._passes_criteria(
            candidate_profile_high_overlap,
            {"min_experience": 3.0}
        )
        
        # Should not pass 5 years filter
        assert not matcher._passes_criteria(
            candidate_profile_high_overlap,
            {"min_experience": 5.0}
        )
