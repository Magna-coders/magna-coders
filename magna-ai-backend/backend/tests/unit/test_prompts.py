"""
Unit tests for system prompt templates.

**Validates: Requirements 12.1, 12.3, 12.4, 12.5, 12.6**
"""

import pytest
from ...agent.prompts import (
    BASE_SYSTEM_PROMPT,
    INTERVIEW_PREP_ADDITION,
    COLLABORATION_MATCHING_ADDITION,
    DOCUMENT_REVIEW_ADDITION,
    build_system_prompt,
    get_analysis_prompt,
    get_planning_prompt,
)


class TestBaseSystemPrompt:
    """Test the base system prompt contains required elements."""
    
    def test_contains_persona_definition(self):
        """Base prompt should define professional career coach persona."""
        assert "professional career coach" in BASE_SYSTEM_PROMPT.lower()
        assert "career advisor" in BASE_SYSTEM_PROMPT.lower()
        
    def test_contains_core_traits(self):
        """Base prompt should define core personality traits."""
        prompt_lower = BASE_SYSTEM_PROMPT.lower()
        assert "helpful" in prompt_lower
        assert "proactive" in prompt_lower
        assert "empathetic" in prompt_lower
        assert "data-driven" in prompt_lower
        
    def test_contains_safety_constraints(self):
        """Base prompt should include safety constraints preventing data fabrication."""
        prompt_lower = BASE_SYSTEM_PROMPT.lower()
        assert "no data fabrication" in prompt_lower or "never fabricate" in prompt_lower
        assert "never invent" in prompt_lower or "never hallucinate" in prompt_lower
        assert "verify" in prompt_lower
        
    def test_contains_ethical_guidelines(self):
        """Base prompt should include ethical matching guidelines."""
        prompt_lower = BASE_SYSTEM_PROMPT.lower()
        assert "ethical" in prompt_lower
        assert "discrimination" in prompt_lower
        assert "skills-based" in prompt_lower or "skills" in prompt_lower
        assert "fairness" in prompt_lower or "fair" in prompt_lower
        
    def test_contains_consent_requirements(self):
        """Base prompt should include consent requirements for actions."""
        prompt_lower = BASE_SYSTEM_PROMPT.lower()
        assert "consent" in prompt_lower
        assert "explicit" in prompt_lower
        # Check for either "permission" or "without consent" phrasing
        assert ("permission" in prompt_lower or "without consent" in prompt_lower or 
                "explicit user consent" in prompt_lower)
        
    def test_contains_memory_integration(self):
        """Base prompt should include memory integration instructions."""
        prompt_lower = BASE_SYSTEM_PROMPT.lower()
        assert "memory" in prompt_lower or "context" in prompt_lower
        assert "previous conversation" in prompt_lower or "conversation history" in prompt_lower
        assert "reference" in prompt_lower or "recall" in prompt_lower
        
    def test_contains_tool_usage_guidelines(self):
        """Base prompt should explain how to use tools."""
        prompt_lower = BASE_SYSTEM_PROMPT.lower()
        assert "tool" in prompt_lower
        assert "json" in prompt_lower
        
    def test_prohibits_unauthorized_actions(self):
        """Base prompt should explicitly prohibit unauthorized actions."""
        prompt_lower = BASE_SYSTEM_PROMPT.lower()
        assert "never" in prompt_lower
        # Check for prohibition of actions without consent
        assert ("without consent" in prompt_lower or "without explicit" in prompt_lower or
                "unauthorized" in prompt_lower)
        
    def test_requires_data_verification(self):
        """Base prompt should require data verification before presenting."""
        prompt_lower = BASE_SYSTEM_PROMPT.lower()
        assert "verify" in prompt_lower or "validate" in prompt_lower
        assert "actual data" in prompt_lower or "database" in prompt_lower
        
    def test_includes_example_interactions(self):
        """Base prompt should include example interactions for guidance."""
        assert "example" in BASE_SYSTEM_PROMPT.lower()
        assert "good response" in BASE_SYSTEM_PROMPT.lower()


class TestSpecializedPrompts:
    """Test specialized prompt additions for specific contexts."""
    
    def test_interview_prep_addition_exists(self):
        """Interview prep addition should exist and contain relevant content."""
        assert len(INTERVIEW_PREP_ADDITION) > 0
        prompt_lower = INTERVIEW_PREP_ADDITION.lower()
        assert "interview" in prompt_lower
        assert "question" in prompt_lower
        assert "feedback" in prompt_lower
        
    def test_collaboration_addition_exists(self):
        """Collaboration matching addition should exist and contain relevant content."""
        assert len(COLLABORATION_MATCHING_ADDITION) > 0
        prompt_lower = COLLABORATION_MATCHING_ADDITION.lower()
        assert "collaboration" in prompt_lower or "collaborator" in prompt_lower
        assert "match" in prompt_lower
        assert "skills" in prompt_lower
        
    def test_document_review_addition_exists(self):
        """Document review addition should exist and contain relevant content."""
        assert len(DOCUMENT_REVIEW_ADDITION) > 0
        prompt_lower = DOCUMENT_REVIEW_ADDITION.lower()
        assert "document" in prompt_lower or "resume" in prompt_lower
        assert "review" in prompt_lower or "feedback" in prompt_lower


class TestBuildSystemPrompt:
    """Test the build_system_prompt function."""
    
    def test_default_prompt(self):
        """Building with no arguments should return base prompt."""
        prompt = build_system_prompt()
        assert prompt == BASE_SYSTEM_PROMPT
        
    def test_interview_prep_mode(self):
        """Building with interview_prep mode should include interview addition."""
        prompt = build_system_prompt(context_mode="interview_prep")
        assert BASE_SYSTEM_PROMPT in prompt
        assert INTERVIEW_PREP_ADDITION in prompt
        
    def test_collaboration_mode(self):
        """Building with collaboration mode should include collaboration addition."""
        prompt = build_system_prompt(context_mode="collaboration")
        assert BASE_SYSTEM_PROMPT in prompt
        assert COLLABORATION_MATCHING_ADDITION in prompt
        
    def test_document_review_mode(self):
        """Building with document_review mode should include document addition."""
        prompt = build_system_prompt(context_mode="document_review")
        assert BASE_SYSTEM_PROMPT in prompt
        assert DOCUMENT_REVIEW_ADDITION in prompt
        
    def test_custom_additions(self):
        """Building with custom additions should append them."""
        custom = "\n\nCustom instruction for testing."
        prompt = build_system_prompt(custom_additions=custom)
        assert BASE_SYSTEM_PROMPT in prompt
        assert custom in prompt
        
    def test_combined_mode_and_custom(self):
        """Building with both mode and custom additions should include both."""
        custom = "\n\nCustom instruction."
        prompt = build_system_prompt(
            context_mode="interview_prep",
            custom_additions=custom
        )
        assert BASE_SYSTEM_PROMPT in prompt
        assert INTERVIEW_PREP_ADDITION in prompt
        assert custom in prompt
        
    def test_custom_base_prompt(self):
        """Building with custom base prompt should use it."""
        custom_base = "This is a custom base prompt."
        prompt = build_system_prompt(base_prompt=custom_base)
        assert prompt == custom_base


class TestAnalysisPrompt:
    """Test the analysis phase prompt."""
    
    def test_analysis_prompt_exists(self):
        """Analysis prompt should exist and be non-empty."""
        prompt = get_analysis_prompt()
        assert len(prompt) > 0
        
    def test_analysis_prompt_specifies_json_output(self):
        """Analysis prompt should require JSON output."""
        prompt = get_analysis_prompt()
        assert "json" in prompt.lower()
        
    def test_analysis_prompt_lists_intents(self):
        """Analysis prompt should list common intents."""
        prompt = get_analysis_prompt()
        prompt_lower = prompt.lower()
        assert "intent" in prompt_lower
        assert "find_opportunities" in prompt_lower or "opportunities" in prompt_lower
        assert "interview" in prompt_lower
        
    def test_analysis_prompt_requires_confidence(self):
        """Analysis prompt should require confidence score."""
        prompt = get_analysis_prompt()
        assert "confidence" in prompt.lower()


class TestPlanningPrompt:
    """Test the planning phase prompt."""
    
    def test_planning_prompt_exists(self):
        """Planning prompt should exist and be non-empty."""
        prompt = get_planning_prompt()
        assert len(prompt) > 0
        
    def test_planning_prompt_specifies_json_output(self):
        """Planning prompt should require JSON output."""
        prompt = get_planning_prompt()
        assert "json" in prompt.lower()
        
    def test_planning_prompt_mentions_tools(self):
        """Planning prompt should mention available tools."""
        prompt = get_planning_prompt()
        prompt_lower = prompt.lower()
        assert "tool" in prompt_lower
        assert "profile_retrieval" in prompt_lower or "profile" in prompt_lower
        assert "opportunity_match" in prompt_lower or "opportunity" in prompt_lower
        
    def test_planning_prompt_mentions_execution_strategy(self):
        """Planning prompt should mention execution strategies."""
        prompt = get_planning_prompt()
        prompt_lower = prompt.lower()
        assert "sequential" in prompt_lower or "parallel" in prompt_lower
        assert "execution" in prompt_lower


class TestPromptSafetyRequirements:
    """Test that prompts enforce critical safety requirements."""
    
    def test_no_fabrication_explicitly_stated(self):
        """Prompt must explicitly prohibit data fabrication."""
        prompt_lower = BASE_SYSTEM_PROMPT.lower()
        # Should contain strong prohibitions
        assert any(phrase in prompt_lower for phrase in [
            "never fabricate",
            "never invent",
            "never hallucinate",
            "no data fabrication",
            "do not fabricate"
        ])
        
    def test_consent_explicitly_required(self):
        """Prompt must explicitly require consent for actions."""
        prompt_lower = BASE_SYSTEM_PROMPT.lower()
        assert "explicit consent" in prompt_lower or "explicit user consent" in prompt_lower
        # Check for prohibition of actions without consent
        assert ("without consent" in prompt_lower or "without explicit" in prompt_lower or
                "never perform" in prompt_lower)
        
    def test_privacy_protection_stated(self):
        """Prompt must include privacy protection guidelines."""
        prompt_lower = BASE_SYSTEM_PROMPT.lower()
        assert "privacy" in prompt_lower
        assert any(phrase in prompt_lower for phrase in [
            "never share",
            "do not share",
            "don't share",
            "unauthorized"
        ])
        
    def test_verification_required(self):
        """Prompt must require verification before presenting data."""
        prompt_lower = BASE_SYSTEM_PROMPT.lower()
        assert "verify" in prompt_lower or "validate" in prompt_lower
        assert "before" in prompt_lower
        
    def test_no_discrimination_stated(self):
        """Prompt must prohibit discrimination."""
        prompt_lower = BASE_SYSTEM_PROMPT.lower()
        assert "discrimination" in prompt_lower or "discriminate" in prompt_lower
        assert "never" in prompt_lower or "no" in prompt_lower


class TestPromptStructure:
    """Test the overall structure and organization of prompts."""
    
    def test_base_prompt_has_sections(self):
        """Base prompt should be organized into clear sections."""
        # Check for section headers (marked with ##)
        assert "## Your Role" in BASE_SYSTEM_PROMPT or "## Role" in BASE_SYSTEM_PROMPT
        assert "## Safety Constraints" in BASE_SYSTEM_PROMPT or "## Safety" in BASE_SYSTEM_PROMPT
        assert "## Ethical" in BASE_SYSTEM_PROMPT
        assert "## Consent" in BASE_SYSTEM_PROMPT
        assert "## Memory" in BASE_SYSTEM_PROMPT
        
    def test_base_prompt_reasonable_length(self):
        """Base prompt should be comprehensive but not excessively long."""
        # Should be substantial (at least 2000 chars) but not too long (under 15000 chars)
        assert 2000 <= len(BASE_SYSTEM_PROMPT) <= 15000
        
    def test_specialized_additions_reasonable_length(self):
        """Specialized additions should be focused and concise."""
        assert len(INTERVIEW_PREP_ADDITION) < 3000
        assert len(COLLABORATION_MATCHING_ADDITION) < 3000
        assert len(DOCUMENT_REVIEW_ADDITION) < 3000


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
