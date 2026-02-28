"""
Unit tests for Interview Preparation Module.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock
import json

from ...interview.preparation import (
    InterviewPreparationModule,
    DifficultyLevel,
    QuestionCategory,
    InterviewQuestion,
    ResponseEvaluation,
    ResumeAnalysis,
    MockSessionResult,
)
from ...models.matching import UserProfile
from ...llm.orchestrator import LLMOrchestrator


@pytest.fixture
def mock_llm_orchestrator():
    """Create a mock LLM orchestrator."""
    orchestrator = MagicMock(spec=LLMOrchestrator)
    return orchestrator


@pytest.fixture
def interview_module(mock_llm_orchestrator):
    """Create an interview preparation module with mocked LLM."""
    return InterviewPreparationModule(llm_orchestrator=mock_llm_orchestrator)


@pytest.fixture
def sample_user_profile():
    """Create a sample user profile."""
    return UserProfile(
        user_id="test_user_123",
        skills=["Python", "JavaScript", "React", "FastAPI"],
        location="Nairobi, Kenya",
        career_goals="Become a senior full-stack developer",
        years_experience=3.5,
        availability="Full-time",
        work_history=["Junior Developer at TechCorp", "Developer at StartupXYZ"]
    )


class TestDifficultyDetermination:
    """Test difficulty level determination based on experience."""
    
    def test_junior_level_for_new_developer(self, interview_module):
        """Test that junior difficulty is assigned for <2 years experience."""
        difficulty = interview_module._determine_difficulty(1.5)
        assert difficulty == DifficultyLevel.JUNIOR
    
    def test_intermediate_level_for_mid_developer(self, interview_module):
        """Test that intermediate difficulty is assigned for 2-5 years."""
        difficulty = interview_module._determine_difficulty(3.5)
        assert difficulty == DifficultyLevel.INTERMEDIATE
    
    def test_senior_level_for_experienced_developer(self, interview_module):
        """Test that senior difficulty is assigned for 5-10 years."""
        difficulty = interview_module._determine_difficulty(7.0)
        assert difficulty == DifficultyLevel.SENIOR
    
    def test_expert_level_for_very_experienced_developer(self, interview_module):
        """Test that expert difficulty is assigned for 10+ years."""
        difficulty = interview_module._determine_difficulty(12.0)
        assert difficulty == DifficultyLevel.EXPERT


class TestQuestionGeneration:
    """Test interview question generation."""
    
    @pytest.mark.asyncio
    async def test_generate_questions_success(
        self,
        interview_module,
        mock_llm_orchestrator,
        sample_user_profile
    ):
        """Test successful question generation."""
        # Mock LLM response
        mock_response = json.dumps([
            {
                "question": "Explain the difference between let and const in JavaScript",
                "category": "technical",
                "what_interviewer_looks_for": "Understanding of variable scoping",
                "key_points": ["Block scope", "Reassignment", "Hoisting"]
            },
            {
                "question": "Tell me about a challenging project you worked on",
                "category": "behavioral",
                "what_interviewer_looks_for": "Problem-solving and communication",
                "key_points": ["Situation", "Actions taken", "Results"]
            }
        ])
        
        # Mock the async generator
        async def mock_generate(*args, **kwargs):
            yield mock_response
        
        mock_llm_orchestrator.generate = mock_generate
        
        # Generate questions
        questions = await interview_module.generate_questions(
            user_profile=sample_user_profile,
            target_role="Full Stack Developer",
            count=2
        )
        
        # Assertions
        assert len(questions) == 2
        assert isinstance(questions[0], InterviewQuestion)
        assert questions[0].category == QuestionCategory.TECHNICAL
        assert questions[1].category == QuestionCategory.BEHAVIORAL
        assert questions[0].difficulty == DifficultyLevel.INTERMEDIATE
    
    @pytest.mark.asyncio
    async def test_generate_questions_with_explicit_difficulty(
        self,
        interview_module,
        mock_llm_orchestrator,
        sample_user_profile
    ):
        """Test question generation with explicit difficulty override."""
        mock_response = json.dumps([
            {
                "question": "What is a closure in JavaScript?",
                "category": "technical",
                "what_interviewer_looks_for": "Basic understanding",
                "key_points": ["Function scope", "Variable access"]
            }
        ])
        
        async def mock_generate(*args, **kwargs):
            yield mock_response
        
        mock_llm_orchestrator.generate = mock_generate
        
        questions = await interview_module.generate_questions(
            user_profile=sample_user_profile,
            target_role="Junior Developer",
            difficulty=DifficultyLevel.JUNIOR,
            count=1
        )
        
        assert questions[0].difficulty == DifficultyLevel.JUNIOR
    
    @pytest.mark.asyncio
    async def test_generate_questions_invalid_count(
        self,
        interview_module,
        sample_user_profile
    ):
        """Test that invalid question count raises ValueError."""
        with pytest.raises(ValueError, match="Question count must be between 1 and 20"):
            await interview_module.generate_questions(
                user_profile=sample_user_profile,
                target_role="Developer",
                count=0
            )
        
        with pytest.raises(ValueError, match="Question count must be between 1 and 20"):
            await interview_module.generate_questions(
                user_profile=sample_user_profile,
                target_role="Developer",
                count=25
            )
    
    @pytest.mark.asyncio
    async def test_generate_questions_with_markdown_json(
        self,
        interview_module,
        mock_llm_orchestrator,
        sample_user_profile
    ):
        """Test parsing questions from markdown-wrapped JSON."""
        mock_response = """```json
[
    {
        "question": "What is React?",
        "category": "technical",
        "what_interviewer_looks_for": "Framework knowledge",
        "key_points": ["Component-based", "Virtual DOM"]
    }
]
```"""
        
        async def mock_generate(*args, **kwargs):
            yield mock_response
        
        mock_llm_orchestrator.generate = mock_generate
        
        questions = await interview_module.generate_questions(
            user_profile=sample_user_profile,
            target_role="Frontend Developer",
            count=1
        )
        
        assert len(questions) == 1
        assert "React" in questions[0].question


class TestResponseEvaluation:
    """Test response evaluation functionality."""
    
    @pytest.mark.asyncio
    async def test_evaluate_response_success(
        self,
        interview_module,
        mock_llm_orchestrator
    ):
        """Test successful response evaluation."""
        question = InterviewQuestion(
            question="What is a closure in JavaScript?",
            category=QuestionCategory.TECHNICAL,
            difficulty=DifficultyLevel.INTERMEDIATE,
            what_interviewer_looks_for="Understanding of scope and functions",
            key_points=["Function scope", "Variable access", "Lexical environment"]
        )
        
        user_response = "A closure is a function that has access to variables in its outer scope."
        
        mock_evaluation = json.dumps({
            "score": 75,
            "strengths": ["Correct basic definition", "Clear explanation"],
            "areas_for_improvement": ["Could mention lexical environment", "Add practical example"],
            "constructive_feedback": "Good understanding of the basics. Consider adding more depth.",
            "suggested_improvements": ["Provide a code example", "Explain use cases"]
        })
        
        async def mock_generate(*args, **kwargs):
            yield mock_evaluation
        
        mock_llm_orchestrator.generate = mock_generate
        
        evaluation = await interview_module.evaluate_response(question, user_response)
        
        assert isinstance(evaluation, ResponseEvaluation)
        assert evaluation.score == 75
        assert len(evaluation.strengths) == 2
        assert len(evaluation.suggested_improvements) == 2
        assert "Good understanding" in evaluation.constructive_feedback
    
    @pytest.mark.asyncio
    async def test_evaluate_empty_response(
        self,
        interview_module
    ):
        """Test that empty response raises ValueError."""
        question = InterviewQuestion(
            question="Test question",
            category=QuestionCategory.TECHNICAL,
            difficulty=DifficultyLevel.JUNIOR,
            what_interviewer_looks_for="Test",
            key_points=["Test"]
        )
        
        with pytest.raises(ValueError, match="User response cannot be empty"):
            await interview_module.evaluate_response(question, "")
        
        with pytest.raises(ValueError, match="User response cannot be empty"):
            await interview_module.evaluate_response(question, "   ")


class TestResumeAnalysis:
    """Test resume analysis functionality."""
    
    @pytest.mark.asyncio
    async def test_analyze_resume_success(
        self,
        interview_module,
        mock_llm_orchestrator,
        sample_user_profile
    ):
        """Test successful resume analysis."""
        resume_text = """
        John Doe
        Full Stack Developer
        
        Experience:
        - Developer at TechCorp (2020-2023)
        - Built web applications using React and Python
        
        Skills: Python, JavaScript, React, FastAPI
        """
        
        mock_analysis = json.dumps({
            "overall_score": 70,
            "strengths": ["Clear structure", "Relevant skills listed"],
            "weaknesses": ["Missing quantifiable achievements", "No education section"],
            "improvement_tips": [
                "Add metrics to demonstrate impact",
                "Include education and certifications",
                "Add a professional summary"
            ],
            "missing_elements": ["Education", "Certifications", "Projects"],
            "formatting_suggestions": ["Use bullet points consistently", "Add section headers"]
        })
        
        async def mock_generate(*args, **kwargs):
            yield mock_analysis
        
        mock_llm_orchestrator.generate = mock_generate
        
        analysis = await interview_module.analyze_resume(
            user_profile=sample_user_profile,
            resume_text=resume_text
        )
        
        assert isinstance(analysis, ResumeAnalysis)
        assert analysis.overall_score == 70
        assert len(analysis.strengths) == 2
        assert len(analysis.improvement_tips) == 3
        assert "Education" in analysis.missing_elements
    
    @pytest.mark.asyncio
    async def test_analyze_empty_resume(
        self,
        interview_module,
        sample_user_profile
    ):
        """Test that empty resume raises ValueError."""
        with pytest.raises(ValueError, match="Resume text cannot be empty"):
            await interview_module.analyze_resume(sample_user_profile, "")


class TestMockSession:
    """Test mock interview session functionality."""
    
    @pytest.mark.asyncio
    async def test_conduct_mock_session_success(
        self,
        interview_module,
        mock_llm_orchestrator,
        sample_user_profile
    ):
        """Test successful mock session initialization."""
        mock_questions = json.dumps([
            {
                "question": "Question 1",
                "category": "technical",
                "what_interviewer_looks_for": "Test",
                "key_points": ["Point 1"]
            },
            {
                "question": "Question 2",
                "category": "behavioral",
                "what_interviewer_looks_for": "Test",
                "key_points": ["Point 2"]
            },
            {
                "question": "Question 3",
                "category": "problem_solving",
                "what_interviewer_looks_for": "Test",
                "key_points": ["Point 3"]
            }
        ])
        
        async def mock_generate(*args, **kwargs):
            yield mock_questions
        
        mock_llm_orchestrator.generate = mock_generate
        
        result = await interview_module.conduct_mock_session(
            user_profile=sample_user_profile,
            target_role="Full Stack Developer",
            duration_minutes=30
        )
        
        assert isinstance(result, MockSessionResult)
        assert len(result.questions_asked) == 3
        assert len(result.recommendations) > 0
        assert "STAR method" in result.session_summary or any(
            "STAR" in rec for rec in result.recommendations
        )
    
    @pytest.mark.asyncio
    async def test_conduct_mock_session_with_explicit_count(
        self,
        interview_module,
        mock_llm_orchestrator,
        sample_user_profile
    ):
        """Test mock session with explicit question count."""
        mock_questions = json.dumps([
            {
                "question": f"Question {i}",
                "category": "technical",
                "what_interviewer_looks_for": "Test",
                "key_points": ["Point"]
            }
            for i in range(5)
        ])
        
        async def mock_generate(*args, **kwargs):
            yield mock_questions
        
        mock_llm_orchestrator.generate = mock_generate
        
        result = await interview_module.conduct_mock_session(
            user_profile=sample_user_profile,
            target_role="Developer",
            question_count=5
        )
        
        assert len(result.questions_asked) == 5
    
    @pytest.mark.asyncio
    async def test_conduct_mock_session_invalid_duration(
        self,
        interview_module,
        sample_user_profile
    ):
        """Test that invalid duration raises ValueError."""
        with pytest.raises(ValueError, match="Duration must be between 10 and 120 minutes"):
            await interview_module.conduct_mock_session(
                user_profile=sample_user_profile,
                target_role="Developer",
                duration_minutes=5
            )


class TestContextManagement:
    """Test conversation context management."""
    
    def test_add_to_context(self, interview_module):
        """Test adding interaction to context."""
        session_id = "test_session_123"
        
        question = InterviewQuestion(
            question="Test question",
            category=QuestionCategory.TECHNICAL,
            difficulty=DifficultyLevel.INTERMEDIATE,
            what_interviewer_looks_for="Test",
            key_points=["Point 1"]
        )
        
        response = "Test response"
        
        evaluation = ResponseEvaluation(
            score=80,
            strengths=["Good"],
            areas_for_improvement=["Could improve"],
            constructive_feedback="Well done",
            suggested_improvements=["Add more detail"]
        )
        
        interview_module.add_to_context(session_id, question, response, evaluation)
        
        context = interview_module.get_session_context(session_id)
        assert len(context) == 1
        assert context[0]["response"] == response
        assert context[0]["evaluation"]["score"] == 80
    
    def test_get_empty_context(self, interview_module):
        """Test getting context for non-existent session."""
        context = interview_module.get_session_context("non_existent_session")
        assert context == []
    
    def test_clear_context(self, interview_module):
        """Test clearing session context."""
        session_id = "test_session_456"
        
        question = InterviewQuestion(
            question="Test",
            category=QuestionCategory.TECHNICAL,
            difficulty=DifficultyLevel.JUNIOR,
            what_interviewer_looks_for="Test",
            key_points=["Test"]
        )
        
        evaluation = ResponseEvaluation(
            score=70,
            strengths=[],
            areas_for_improvement=[],
            constructive_feedback="Test",
            suggested_improvements=[]
        )
        
        interview_module.add_to_context(session_id, question, "response", evaluation)
        assert len(interview_module.get_session_context(session_id)) == 1
        
        interview_module.clear_session_context(session_id)
        assert len(interview_module.get_session_context(session_id)) == 0


class TestDataModels:
    """Test data model serialization."""
    
    def test_interview_question_to_dict(self):
        """Test InterviewQuestion serialization."""
        question = InterviewQuestion(
            question="What is Python?",
            category=QuestionCategory.TECHNICAL,
            difficulty=DifficultyLevel.JUNIOR,
            what_interviewer_looks_for="Basic knowledge",
            key_points=["Programming language", "Interpreted", "High-level"]
        )
        
        data = question.to_dict()
        assert data["question"] == "What is Python?"
        assert data["category"] == "technical"
        assert data["difficulty"] == "junior"
        assert len(data["key_points"]) == 3
    
    def test_response_evaluation_to_dict(self):
        """Test ResponseEvaluation serialization."""
        evaluation = ResponseEvaluation(
            score=85,
            strengths=["Clear", "Concise"],
            areas_for_improvement=["Add examples"],
            constructive_feedback="Good job overall",
            suggested_improvements=["Practice more"]
        )
        
        data = evaluation.to_dict()
        assert data["score"] == 85
        assert len(data["strengths"]) == 2
        assert "Good job" in data["constructive_feedback"]
    
    def test_resume_analysis_to_dict(self):
        """Test ResumeAnalysis serialization."""
        analysis = ResumeAnalysis(
            overall_score=75,
            strengths=["Well structured"],
            weaknesses=["Missing metrics"],
            improvement_tips=["Add achievements"],
            missing_elements=["Education"],
            formatting_suggestions=["Use bullet points"]
        )
        
        data = analysis.to_dict()
        assert data["overall_score"] == 75
        assert "Education" in data["missing_elements"]
