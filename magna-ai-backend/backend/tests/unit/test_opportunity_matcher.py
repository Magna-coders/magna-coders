"""
Unit tests for OpportunityMatcher.
"""

import pytest
from ...matching.opportunity import OpportunityMatcher
from ...models.matching import (
    UserProfile,
    Opportunity,
    OpportunityType,
    MatchScore,
)


@pytest.fixture
def sample_user_profile():
    """Create a sample user profile for testing."""
    return UserProfile(
        user_id="user123",
        skills=["Python", "JavaScript", "React", "FastAPI"],
        location="Nairobi, Kenya",
        career_goals="Build scalable web applications and grow as a full-stack developer",
        years_experience=3.5,
        availability="full-time"
    )


@pytest.fixture
def sample_opportunity():
    """Create a sample opportunity for testing."""
    return Opportunity(
        id="opp123",
        title="Full Stack Developer",
        description="Build modern web applications using Python and React",
        required_skills=["Python", "React", "PostgreSQL"],
        location="Nairobi, Kenya",
        remote=False,
        experience_required="2-5 years",
        opportunity_type=OpportunityType.JOB,
        company="Tech Corp",
        salary_range="$50k-$70k"
    )


@pytest.fixture
def matcher():
    """Create OpportunityMatcher instance."""
    return OpportunityMatcher(min_match_score=0.7)


class TestCalculateMatchScore:
    """Tests for calculate_match_score method."""
    
    def test_perfect_match(self, matcher, sample_user_profile):
        """Test perfect match scenario."""
        opportunity = Opportunity(
            id="opp1",
            title="Python Developer",
            description="Build scalable web applications using Python and FastAPI",
            required_skills=["Python", "FastAPI"],
            location="Nairobi, Kenya",
            remote=False,
            experience_required="3-4 years",
            opportunity_type=OpportunityType.JOB
        )
        
        score = matcher.calculate_match_score(sample_user_profile, opportunity)
        
        assert score.total_score >= 90.0
        assert score.skills_score == 100.0  # Has all required skills
        assert score.location_score == 100.0  # Exact location match
        assert score.experience_score >= 90.0  # Experience in range
    
    def test_remote_opportunity_location_score(self, matcher, sample_user_profile):
        """Test that remote opportunities get perfect location score."""
        opportunity = Opportunity(
            id="opp2",
            title="Remote Developer",
            description="Remote work opportunity",
            required_skills=["Python"],
            location="San Francisco, USA",
            remote=True,
            experience_required="3 years",
            opportunity_type=OpportunityType.JOB
        )
        
        score = matcher.calculate_match_score(sample_user_profile, opportunity)
        
        assert score.location_score == 100.0
    
    def test_no_skill_overlap(self, matcher, sample_user_profile):
        """Test opportunity with no matching skills."""
        opportunity = Opportunity(
            id="opp3",
            title="Java Developer",
            description="Java backend development",
            required_skills=["Java", "Spring", "Hibernate"],
            location="Nairobi, Kenya",
            remote=False,
            experience_required="3 years",
            opportunity_type=OpportunityType.JOB
        )
        
        score = matcher.calculate_match_score(sample_user_profile, opportunity)
        
        assert score.skills_score == 0.0
        assert score.total_score < 70.0  # Should be below threshold
    
    def test_partial_skill_match(self, matcher, sample_user_profile):
        """Test opportunity with partial skill overlap."""
        opportunity = Opportunity(
            id="opp4",
            title="Full Stack Developer",
            description="Full stack development",
            required_skills=["Python", "React", "Docker", "Kubernetes"],
            location="Nairobi, Kenya",
            remote=False,
            experience_required="3 years",
            opportunity_type=OpportunityType.JOB
        )
        
        score = matcher.calculate_match_score(sample_user_profile, opportunity)
        
        # User has 2 out of 4 required skills
        assert score.skills_score == 50.0


class TestSkillsScore:
    """Tests for _calculate_skills_score method."""
    
    def test_all_skills_match(self, matcher):
        """Test when user has all required skills."""
        user_skills = ["Python", "JavaScript", "React"]
        required_skills = ["Python", "React"]
        
        score = matcher._calculate_skills_score(user_skills, required_skills)
        
        assert score == 100.0
    
    def test_no_skills_match(self, matcher):
        """Test when user has no required skills."""
        user_skills = ["Python", "JavaScript"]
        required_skills = ["Java", "C++"]
        
        score = matcher._calculate_skills_score(user_skills, required_skills)
        
        assert score == 0.0
    
    def test_partial_skills_match(self, matcher):
        """Test when user has some required skills."""
        user_skills = ["Python", "JavaScript"]
        required_skills = ["Python", "Java", "C++"]
        
        score = matcher._calculate_skills_score(user_skills, required_skills)
        
        # 1 out of 3 required skills
        assert score == pytest.approx(33.33, rel=0.1)
    
    def test_case_insensitive_matching(self, matcher):
        """Test that skill matching is case-insensitive."""
        user_skills = ["python", "JAVASCRIPT"]
        required_skills = ["Python", "JavaScript"]
        
        score = matcher._calculate_skills_score(user_skills, required_skills)
        
        assert score == 100.0
    
    def test_empty_required_skills(self, matcher):
        """Test when no skills are required."""
        user_skills = ["Python"]
        required_skills = []
        
        score = matcher._calculate_skills_score(user_skills, required_skills)
        
        assert score == 100.0
    
    def test_empty_user_skills(self, matcher):
        """Test when user has no skills."""
        user_skills = []
        required_skills = ["Python"]
        
        score = matcher._calculate_skills_score(user_skills, required_skills)
        
        assert score == 0.0


class TestLocationScore:
    """Tests for _calculate_location_score method."""
    
    def test_exact_location_match(self, matcher):
        """Test exact location match."""
        score = matcher._calculate_location_score(
            "Nairobi, Kenya",
            "Nairobi, Kenya",
            False
        )
        
        assert score == 100.0
    
    def test_remote_opportunity(self, matcher):
        """Test remote opportunity gets perfect score."""
        score = matcher._calculate_location_score(
            "Nairobi, Kenya",
            "San Francisco, USA",
            True
        )
        
        assert score == 100.0
    
    def test_partial_location_match(self, matcher):
        """Test partial location match."""
        score = matcher._calculate_location_score(
            "Nairobi",
            "Nairobi, Kenya",
            False
        )
        
        assert score == 75.0
    
    def test_no_location_match(self, matcher):
        """Test no location match."""
        score = matcher._calculate_location_score(
            "Nairobi, Kenya",
            "Lagos, Nigeria",
            False
        )
        
        assert score == 30.0
    
    def test_case_insensitive_location(self, matcher):
        """Test case-insensitive location matching."""
        score = matcher._calculate_location_score(
            "nairobi, kenya",
            "Nairobi, Kenya",
            False
        )
        
        assert score == 100.0


class TestExperienceScore:
    """Tests for _calculate_experience_score method."""
    
    def test_experience_in_range(self, matcher):
        """Test experience within required range."""
        score = matcher._calculate_experience_score(3.5, "2-5 years")
        
        assert score == 100.0
    
    def test_experience_below_range(self, matcher):
        """Test experience below required range."""
        score = matcher._calculate_experience_score(1.0, "3-5 years")
        
        # 2 years below minimum, penalized 15 points per year
        assert score == pytest.approx(70.0, rel=0.1)
    
    def test_experience_above_range(self, matcher):
        """Test experience above required range."""
        score = matcher._calculate_experience_score(8.0, "2-5 years")
        
        # 3 years above maximum, penalized 10 points per year
        assert score == pytest.approx(70.0, rel=0.1)
    
    def test_junior_level(self, matcher):
        """Test junior level requirement."""
        score = matcher._calculate_experience_score(1.0, "junior")
        
        assert score == 100.0
    
    def test_senior_level(self, matcher):
        """Test senior level requirement."""
        score = matcher._calculate_experience_score(7.0, "senior")
        
        assert score == 100.0
    
    def test_mid_level(self, matcher):
        """Test mid-level requirement."""
        score = matcher._calculate_experience_score(3.5, "mid-level")
        
        assert score == 100.0
    
    def test_single_year_requirement(self, matcher):
        """Test single year requirement."""
        score = matcher._calculate_experience_score(3.0, "3 years")
        
        assert score == 100.0
    
    def test_unclear_requirement(self, matcher):
        """Test unclear experience requirement."""
        score = matcher._calculate_experience_score(3.0, "some experience")
        
        assert score == 70.0  # Neutral score


class TestFindMatches:
    """Tests for find_matches method."""
    
    def test_find_matches_above_threshold(self, matcher, sample_user_profile):
        """Test finding matches above threshold."""
        opportunities = [
            Opportunity(
                id="opp1",
                title="Python Developer",
                description="Python development",
                required_skills=["Python", "FastAPI"],
                location="Nairobi, Kenya",
                remote=False,
                experience_required="3 years",
                opportunity_type=OpportunityType.JOB
            ),
            Opportunity(
                id="opp2",
                title="Java Developer",
                description="Java development",
                required_skills=["Java", "Spring"],
                location="Nairobi, Kenya",
                remote=False,
                experience_required="3 years",
                opportunity_type=OpportunityType.JOB
            ),
        ]
        
        matches = matcher.find_matches(sample_user_profile, opportunities)
        
        # Only Python opportunity should match (Java has no skill overlap)
        assert len(matches) == 1
        assert matches[0].opportunity.id == "opp1"
        assert matches[0].match_score.total_score >= 70.0
    
    def test_matches_sorted_by_score(self, matcher, sample_user_profile):
        """Test that matches are sorted by score descending."""
        opportunities = [
            Opportunity(
                id="opp1",
                title="Python Developer",
                description="Python development",
                required_skills=["Python"],
                location="Nairobi, Kenya",
                remote=False,
                experience_required="3 years",
                opportunity_type=OpportunityType.JOB
            ),
            Opportunity(
                id="opp2",
                title="Full Stack Developer",
                description="Full stack development",
                required_skills=["Python", "React", "FastAPI"],
                location="Nairobi, Kenya",
                remote=False,
                experience_required="3 years",
                opportunity_type=OpportunityType.JOB
            ),
        ]
        
        matches = matcher.find_matches(sample_user_profile, opportunities)
        
        # opp2 should rank higher (more skill matches)
        assert len(matches) == 2
        assert matches[0].opportunity.id == "opp2"
        assert matches[0].match_score.total_score > matches[1].match_score.total_score
    
    def test_limit_results(self, matcher, sample_user_profile):
        """Test limiting number of results."""
        opportunities = [
            Opportunity(
                id=f"opp{i}",
                title=f"Developer {i}",
                description="Development work",
                required_skills=["Python"],
                location="Nairobi, Kenya",
                remote=False,
                experience_required="3 years",
                opportunity_type=OpportunityType.JOB
            )
            for i in range(20)
        ]
        
        matches = matcher.find_matches(sample_user_profile, opportunities, limit=5)
        
        assert len(matches) == 5
    
    def test_filter_by_opportunity_type(self, matcher, sample_user_profile):
        """Test filtering by opportunity type."""
        opportunities = [
            Opportunity(
                id="opp1",
                title="Python Job",
                description="Python development",
                required_skills=["Python"],
                location="Nairobi, Kenya",
                remote=False,
                experience_required="3 years",
                opportunity_type=OpportunityType.JOB
            ),
            Opportunity(
                id="opp2",
                title="Python Project",
                description="Python development",
                required_skills=["Python"],
                location="Nairobi, Kenya",
                remote=False,
                experience_required="3 years",
                opportunity_type=OpportunityType.PROJECT
            ),
        ]
        
        filters = {"opportunity_type": OpportunityType.JOB}
        matches = matcher.find_matches(sample_user_profile, opportunities, filters=filters)
        
        assert len(matches) == 1
        assert matches[0].opportunity.opportunity_type == OpportunityType.JOB
    
    def test_filter_remote_only(self, matcher, sample_user_profile):
        """Test filtering for remote opportunities only."""
        opportunities = [
            Opportunity(
                id="opp1",
                title="Remote Python Developer",
                description="Python development",
                required_skills=["Python"],
                location="San Francisco, USA",
                remote=True,
                experience_required="3 years",
                opportunity_type=OpportunityType.JOB
            ),
            Opportunity(
                id="opp2",
                title="On-site Python Developer",
                description="Python development",
                required_skills=["Python"],
                location="Nairobi, Kenya",
                remote=False,
                experience_required="3 years",
                opportunity_type=OpportunityType.JOB
            ),
        ]
        
        filters = {"remote_only": True}
        matches = matcher.find_matches(sample_user_profile, opportunities, filters=filters)
        
        assert len(matches) == 1
        assert matches[0].opportunity.remote is True


class TestExplainMatch:
    """Tests for explain_match method."""
    
    def test_explanation_includes_all_factors(self, matcher, sample_user_profile, sample_opportunity):
        """Test that explanation includes all scoring factors."""
        score = matcher.calculate_match_score(sample_user_profile, sample_opportunity)
        explanation = matcher.explain_match(score, sample_user_profile, sample_opportunity)
        
        # Check that explanation mentions all factors
        assert "Overall match" in explanation
        assert "Skills match" in explanation
        assert "Location match" in explanation
        assert "Career goals" in explanation
        assert "Experience match" in explanation
    
    def test_explanation_mentions_matching_skills(self, matcher, sample_user_profile):
        """Test that explanation lists matching skills."""
        opportunity = Opportunity(
            id="opp1",
            title="Python Developer",
            description="Python development",
            required_skills=["Python", "React"],
            location="Nairobi, Kenya",
            remote=False,
            experience_required="3 years",
            opportunity_type=OpportunityType.JOB
        )
        
        score = matcher.calculate_match_score(sample_user_profile, opportunity)
        explanation = matcher.explain_match(score, sample_user_profile, opportunity)
        
        assert "python" in explanation.lower()
        assert "react" in explanation.lower()
    
    def test_explanation_for_remote_position(self, matcher, sample_user_profile):
        """Test explanation for remote position."""
        opportunity = Opportunity(
            id="opp1",
            title="Remote Developer",
            description="Remote work",
            required_skills=["Python"],
            location="San Francisco, USA",
            remote=True,
            experience_required="3 years",
            opportunity_type=OpportunityType.JOB
        )
        
        score = matcher.calculate_match_score(sample_user_profile, opportunity)
        explanation = matcher.explain_match(score, sample_user_profile, opportunity)
        
        assert "remote" in explanation.lower()
        assert "location flexible" in explanation.lower()
