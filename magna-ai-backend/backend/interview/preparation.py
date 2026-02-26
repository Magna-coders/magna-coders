"""
Interview Preparation Module

Generates tailored interview questions and provides feedback on responses.
"""

from typing import List, Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum
import logging

from ..llm.orchestrator import LLMOrchestrator
from ..models.matching import UserProfile

logger = logging.getLogger(__name__)


class DifficultyLevel(str, Enum):
    """Interview question difficulty level."""
    JUNIOR = "junior"
    INTERMEDIATE = "intermediate"
    SENIOR = "senior"
    EXPERT = "expert"


class QuestionCategory(str, Enum):
    """Interview question category."""
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    PROBLEM_SOLVING = "problem_solving"
    ROLE_SPECIFIC = "role_specific"


@dataclass
class InterviewQuestion:
    """
    A single interview question with metadata.
    """
    question: str
    category: QuestionCategory
    difficulty: DifficultyLevel
    what_interviewer_looks_for: str
    key_points: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "question": self.question,
            "category": self.category.value,
            "difficulty": self.difficulty.value,
            "what_interviewer_looks_for": self.what_interviewer_looks_for,
            "key_points": self.key_points,
        }


@dataclass
class ResponseEvaluation:
    """
    Evaluation of a user's interview response.
    """
    score: float  # 0-100
    strengths: List[str]
    areas_for_improvement: List[str]
    constructive_feedback: str
    suggested_improvements: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "score": self.score,
            "strengths": self.strengths,
            "areas_for_improvement": self.areas_for_improvement,
            "constructive_feedback": self.constructive_feedback,
            "suggested_improvements": self.suggested_improvements,
        }


@dataclass
class ResumeAnalysis:
    """
    Analysis of a user's resume with improvement tips.
    """
    overall_score: float  # 0-100
    strengths: List[str]
    weaknesses: List[str]
    improvement_tips: List[str]
    missing_elements: List[str]
    formatting_suggestions: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "overall_score": self.overall_score,
            "strengths": self.strengths,
            "weaknesses": self.weaknesses,
            "improvement_tips": self.improvement_tips,
            "missing_elements": self.missing_elements,
            "formatting_suggestions": self.formatting_suggestions,
        }


@dataclass
class MockSessionResult:
    """
    Result of a complete mock interview session.
    """
    questions_asked: List[InterviewQuestion]
    responses: List[str]
    evaluations: List[ResponseEvaluation]
    overall_performance: float  # 0-100
    session_summary: str
    recommendations: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "questions_asked": [q.to_dict() for q in self.questions_asked],
            "responses": self.responses,
            "evaluations": [e.to_dict() for e in self.evaluations],
            "overall_performance": self.overall_performance,
            "session_summary": self.session_summary,
            "recommendations": self.recommendations,
        }


class InterviewPreparationModule:
    """
    Generates tailored interview questions and provides feedback on responses.
    
    This module helps users prepare for interviews by:
    - Generating role-specific interview questions
    - Evaluating user responses with constructive feedback
    - Analyzing resumes and providing improvement tips
    - Conducting full mock interview sessions
    
    Question difficulty is adapted based on user's experience level.
    Conversation context is maintained throughout preparation sessions.
    """
    
    # System prompts for different operations
    QUESTION_GENERATION_PROMPT = """You are an expert technical interviewer helping candidates prepare for job interviews.

Generate {count} interview questions for a {target_role} position.

Candidate background:
- Skills: {skills}
- Experience: {years_experience} years
- Previous roles: {work_history}
- Career goals: {career_goals}

Difficulty level: {difficulty}

Question distribution:
- Technical skills: 40% of questions
- Behavioral: 30% of questions
- Problem-solving: 20% of questions
- Role-specific: 10% of questions

For each question, provide:
1. The question text
2. What the interviewer is looking for
3. Key points to cover in a strong answer

Format your response as a JSON array with this structure:
[
  {{
    "question": "question text",
    "category": "technical|behavioral|problem_solving|role_specific",
    "what_interviewer_looks_for": "what they're assessing",
    "key_points": ["point 1", "point 2", "point 3"]
  }}
]

Make questions relevant to the candidate's background and the target role."""

    RESPONSE_EVALUATION_PROMPT = """You are an expert interview coach evaluating a candidate's response.

Interview Question:
{question}

What the interviewer looks for:
{what_interviewer_looks_for}

Key points to cover:
{key_points}

Candidate's Response:
{user_response}

Evaluate this response and provide:
1. A score from 0-100
2. Strengths in the response (specific examples)
3. Areas for improvement
4. Constructive feedback (be encouraging but honest)
5. Specific suggestions for improvement

Format your response as JSON:
{{
  "score": 85,
  "strengths": ["strength 1", "strength 2"],
  "areas_for_improvement": ["area 1", "area 2"],
  "constructive_feedback": "overall feedback text",
  "suggested_improvements": ["suggestion 1", "suggestion 2"]
}}

Be constructive and encouraging while providing honest assessment."""

    RESUME_ANALYSIS_PROMPT = """You are an expert resume reviewer helping a candidate improve their resume.

Candidate Profile:
- Skills: {skills}
- Experience: {years_experience} years
- Career goals: {career_goals}
- Work history: {work_history}

Resume Content:
{resume_text}

Analyze this resume and provide:
1. Overall score (0-100)
2. Strengths (what's done well)
3. Weaknesses (what needs improvement)
4. Specific improvement tips
5. Missing elements that should be added
6. Formatting suggestions

Format your response as JSON:
{{
  "overall_score": 75,
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "improvement_tips": ["tip 1", "tip 2", "tip 3"],
  "missing_elements": ["element 1", "element 2"],
  "formatting_suggestions": ["suggestion 1", "suggestion 2"]
}}

Focus on actionable advice that will help the candidate stand out."""

    def __init__(
        self,
        llm_orchestrator: LLMOrchestrator
    ):
        """
        Initialize interview preparation module.
        
        Args:
            llm_orchestrator: LLM orchestrator for generating questions and feedback
        """
        self.llm_orchestrator = llm_orchestrator
        self._conversation_context: Dict[str, List[Dict[str, Any]]] = {}
    
    def _determine_difficulty(self, years_experience: float) -> DifficultyLevel:
        """
        Determine appropriate difficulty level based on experience.
        
        Args:
            years_experience: Years of professional experience
            
        Returns:
            Appropriate difficulty level
        """
        if years_experience < 2:
            return DifficultyLevel.JUNIOR
        elif years_experience < 5:
            return DifficultyLevel.INTERMEDIATE
        elif years_experience < 10:
            return DifficultyLevel.SENIOR
        else:
            return DifficultyLevel.EXPERT
    
    async def generate_questions(
        self,
        user_profile: UserProfile,
        target_role: str,
        difficulty: Optional[DifficultyLevel] = None,
        count: int = 5
    ) -> List[InterviewQuestion]:
        """
        Generate tailored interview questions for a target role.
        
        Questions are adapted based on:
        - User's experience level (determines difficulty)
        - User's skills and background
        - Target role requirements
        
        Args:
            user_profile: User's profile with skills and experience
            target_role: Target job role/position
            difficulty: Optional difficulty override (auto-determined if None)
            count: Number of questions to generate
            
        Returns:
            List of InterviewQuestion objects
            
        Raises:
            ValueError: If count is invalid or generation fails
        """
        if count < 1 or count > 20:
            raise ValueError("Question count must be between 1 and 20")
        
        # Determine difficulty if not provided
        if difficulty is None:
            difficulty = self._determine_difficulty(user_profile.years_experience)
        
        logger.info(
            f"Generating {count} {difficulty.value} questions for {target_role}"
        )
        
        # Format work history
        work_history_str = ", ".join(user_profile.work_history) if user_profile.work_history else "Not specified"
        
        # Build prompt
        prompt = self.QUESTION_GENERATION_PROMPT.format(
            count=count,
            target_role=target_role,
            skills=", ".join(user_profile.skills),
            years_experience=user_profile.years_experience,
            work_history=work_history_str,
            career_goals=user_profile.career_goals,
            difficulty=difficulty.value
        )
        
        # Generate questions using LLM
        response_chunks = []
        async for chunk in self.llm_orchestrator.generate(
            prompt=prompt,
            temperature=0.8,  # Higher creativity for diverse questions
            max_tokens=2048
        ):
            response_chunks.append(chunk)
        
        response_text = "".join(response_chunks)
        
        # Parse JSON response
        questions = self._parse_questions_response(
            response_text,
            difficulty
        )
        
        logger.info(f"Successfully generated {len(questions)} questions")
        
        return questions
    
    def _parse_questions_response(
        self,
        response_text: str,
        difficulty: DifficultyLevel
    ) -> List[InterviewQuestion]:
        """
        Parse LLM response into InterviewQuestion objects.
        
        Args:
            response_text: Raw LLM response
            difficulty: Difficulty level for questions
            
        Returns:
            List of parsed InterviewQuestion objects
        """
        import json
        import re
        
        # Extract JSON from response (handle markdown code blocks)
        json_match = re.search(r'```(?:json)?\s*(\[.*?\])\s*```', response_text, re.DOTALL)
        if json_match:
            json_text = json_match.group(1)
        else:
            # Try to find JSON array directly
            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if json_match:
                json_text = json_match.group(0)
            else:
                logger.error(f"Could not extract JSON from response: {response_text[:200]}")
                raise ValueError("Failed to parse questions from LLM response")
        
        try:
            questions_data = json.loads(json_text)
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}")
            raise ValueError(f"Invalid JSON in LLM response: {e}")
        
        questions = []
        for q_data in questions_data:
            try:
                category = QuestionCategory(q_data.get("category", "technical"))
            except ValueError:
                category = QuestionCategory.TECHNICAL
            
            question = InterviewQuestion(
                question=q_data["question"],
                category=category,
                difficulty=difficulty,
                what_interviewer_looks_for=q_data["what_interviewer_looks_for"],
                key_points=q_data["key_points"]
            )
            questions.append(question)
        
        return questions
    
    async def evaluate_response(
        self,
        question: InterviewQuestion,
        user_response: str
    ) -> ResponseEvaluation:
        """
        Evaluate user's answer to an interview question.
        
        Provides constructive feedback including:
        - Numerical score (0-100)
        - Specific strengths in the response
        - Areas for improvement
        - Actionable suggestions
        
        Args:
            question: The interview question that was asked
            user_response: User's answer to the question
            
        Returns:
            ResponseEvaluation with score and feedback
            
        Raises:
            ValueError: If response is empty or evaluation fails
        """
        if not user_response or not user_response.strip():
            raise ValueError("User response cannot be empty")
        
        logger.info(f"Evaluating response to question: {question.question[:50]}...")
        
        # Build evaluation prompt
        prompt = self.RESPONSE_EVALUATION_PROMPT.format(
            question=question.question,
            what_interviewer_looks_for=question.what_interviewer_looks_for,
            key_points="\n".join(f"- {point}" for point in question.key_points),
            user_response=user_response
        )
        
        # Generate evaluation using LLM
        response_chunks = []
        async for chunk in self.llm_orchestrator.generate(
            prompt=prompt,
            temperature=0.7,
            max_tokens=1024
        ):
            response_chunks.append(chunk)
        
        response_text = "".join(response_chunks)
        
        # Parse evaluation
        evaluation = self._parse_evaluation_response(response_text)
        
        logger.info(f"Evaluation complete. Score: {evaluation.score}")
        
        return evaluation
    
    def _parse_evaluation_response(
        self,
        response_text: str
    ) -> ResponseEvaluation:
        """
        Parse LLM response into ResponseEvaluation object.
        
        Args:
            response_text: Raw LLM response
            
        Returns:
            Parsed ResponseEvaluation object
        """
        import json
        import re
        
        # Extract JSON from response
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
        if json_match:
            json_text = json_match.group(1)
        else:
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_text = json_match.group(0)
            else:
                logger.error(f"Could not extract JSON from response: {response_text[:200]}")
                raise ValueError("Failed to parse evaluation from LLM response")
        
        try:
            eval_data = json.loads(json_text)
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}")
            raise ValueError(f"Invalid JSON in LLM response: {e}")
        
        return ResponseEvaluation(
            score=float(eval_data["score"]),
            strengths=eval_data["strengths"],
            areas_for_improvement=eval_data["areas_for_improvement"],
            constructive_feedback=eval_data["constructive_feedback"],
            suggested_improvements=eval_data["suggested_improvements"]
        )
    
    async def analyze_resume(
        self,
        user_profile: UserProfile,
        resume_text: str
    ) -> ResumeAnalysis:
        """
        Analyze resume and provide improvement tips.
        
        Analysis considers:
        - User's profile and career goals
        - Resume content and structure
        - Industry best practices
        - Missing elements
        
        Args:
            user_profile: User's profile for context
            resume_text: Resume content as text
            
        Returns:
            ResumeAnalysis with score and improvement tips
            
        Raises:
            ValueError: If resume text is empty or analysis fails
        """
        if not resume_text or not resume_text.strip():
            raise ValueError("Resume text cannot be empty")
        
        logger.info(f"Analyzing resume for user {user_profile.user_id}")
        
        # Format work history
        work_history_str = ", ".join(user_profile.work_history) if user_profile.work_history else "Not specified"
        
        # Build analysis prompt
        prompt = self.RESUME_ANALYSIS_PROMPT.format(
            skills=", ".join(user_profile.skills),
            years_experience=user_profile.years_experience,
            career_goals=user_profile.career_goals,
            work_history=work_history_str,
            resume_text=resume_text[:3000]  # Limit to avoid token limits
        )
        
        # Generate analysis using LLM
        response_chunks = []
        async for chunk in self.llm_orchestrator.generate(
            prompt=prompt,
            temperature=0.7,
            max_tokens=1536
        ):
            response_chunks.append(chunk)
        
        response_text = "".join(response_chunks)
        
        # Parse analysis
        analysis = self._parse_resume_analysis_response(response_text)
        
        logger.info(f"Resume analysis complete. Score: {analysis.overall_score}")
        
        return analysis
    
    def _parse_resume_analysis_response(
        self,
        response_text: str
    ) -> ResumeAnalysis:
        """
        Parse LLM response into ResumeAnalysis object.
        
        Args:
            response_text: Raw LLM response
            
        Returns:
            Parsed ResumeAnalysis object
        """
        import json
        import re
        
        # Extract JSON from response
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
        if json_match:
            json_text = json_match.group(1)
        else:
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_text = json_match.group(0)
            else:
                logger.error(f"Could not extract JSON from response: {response_text[:200]}")
                raise ValueError("Failed to parse resume analysis from LLM response")
        
        try:
            analysis_data = json.loads(json_text)
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}")
            raise ValueError(f"Invalid JSON in LLM response: {e}")
        
        return ResumeAnalysis(
            overall_score=float(analysis_data["overall_score"]),
            strengths=analysis_data["strengths"],
            weaknesses=analysis_data["weaknesses"],
            improvement_tips=analysis_data["improvement_tips"],
            missing_elements=analysis_data["missing_elements"],
            formatting_suggestions=analysis_data["formatting_suggestions"]
        )
    
    async def conduct_mock_session(
        self,
        user_profile: UserProfile,
        target_role: str,
        duration_minutes: int = 30,
        question_count: Optional[int] = None
    ) -> MockSessionResult:
        """
        Conduct a full mock interview session.
        
        This simulates a complete interview with:
        - Multiple questions across different categories
        - Evaluation of each response
        - Overall performance assessment
        - Recommendations for improvement
        
        The session maintains conversation context throughout.
        
        Args:
            user_profile: User's profile
            target_role: Target job role
            duration_minutes: Approximate session duration (affects question count)
            question_count: Optional override for number of questions
            
        Returns:
            MockSessionResult with complete session data
            
        Raises:
            ValueError: If parameters are invalid
        """
        if duration_minutes < 10 or duration_minutes > 120:
            raise ValueError("Duration must be between 10 and 120 minutes")
        
        # Calculate question count based on duration (roughly 6 minutes per question)
        if question_count is None:
            question_count = max(3, min(10, duration_minutes // 6))
        
        logger.info(
            f"Starting mock interview session: {question_count} questions "
            f"for {target_role}"
        )
        
        # Initialize session context
        session_id = f"{user_profile.user_id}_{target_role}"
        self._conversation_context[session_id] = []
        
        # Generate questions
        questions = await self.generate_questions(
            user_profile=user_profile,
            target_role=target_role,
            count=question_count
        )
        
        # Note: In a real implementation, this would be interactive
        # For now, we return the questions and structure for the session
        # The actual Q&A would happen through the chat interface
        
        return MockSessionResult(
            questions_asked=questions,
            responses=[],  # Would be filled during interactive session
            evaluations=[],  # Would be filled as responses are evaluated
            overall_performance=0.0,  # Would be calculated after all responses
            session_summary="Mock session initialized. Questions generated.",
            recommendations=[
                "Practice answering each question out loud",
                "Focus on providing specific examples from your experience",
                "Structure your answers using the STAR method (Situation, Task, Action, Result)",
                "Time yourself to ensure concise responses (2-3 minutes per question)"
            ]
        )
    
    def add_to_context(
        self,
        session_id: str,
        question: InterviewQuestion,
        response: str,
        evaluation: ResponseEvaluation
    ) -> None:
        """
        Add interaction to conversation context.
        
        This maintains context throughout the preparation session,
        allowing the module to reference earlier questions and responses.
        
        Args:
            session_id: Unique session identifier
            question: The question that was asked
            response: User's response
            evaluation: Evaluation of the response
        """
        if session_id not in self._conversation_context:
            self._conversation_context[session_id] = []
        
        self._conversation_context[session_id].append({
            "question": question.to_dict(),
            "response": response,
            "evaluation": evaluation.to_dict()
        })
        
        logger.debug(
            f"Added interaction to context for session {session_id}. "
            f"Total interactions: {len(self._conversation_context[session_id])}"
        )
    
    def get_session_context(
        self,
        session_id: str
    ) -> List[Dict[str, Any]]:
        """
        Retrieve conversation context for a session.
        
        Args:
            session_id: Unique session identifier
            
        Returns:
            List of interaction dictionaries
        """
        return self._conversation_context.get(session_id, [])
    
    def clear_session_context(
        self,
        session_id: str
    ) -> None:
        """
        Clear conversation context for a session.
        
        Args:
            session_id: Unique session identifier
        """
        if session_id in self._conversation_context:
            del self._conversation_context[session_id]
            logger.info(f"Cleared context for session {session_id}")
