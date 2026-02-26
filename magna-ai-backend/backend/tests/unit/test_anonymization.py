"""
Unit tests for data anonymization utilities.

Tests PII removal functionality to ensure user privacy protection
when sending data to external LLM providers.

Feature: magna-ai-agent
Validates: Requirement 11.3 - Data anonymization before LLM transmission
"""

import pytest
from ...utils.anonymization import (
    anonymize_data,
    sanitize_for_llm,
    is_pii_present,
    AnonymizationResult
)


class TestStringAnonymization:
    """Test anonymization of string data."""
    
    def test_email_removal(self):
        """Email addresses should be redacted."""
        text = "Contact me at john.doe@example.com for details"
        result = anonymize_data(text)
        
        assert "john.doe@example.com" not in result.anonymized_data
        assert "[EMAIL_REDACTED]" in result.anonymized_data
        assert result.pii_found is True
        assert "email" in result.pii_types_removed
    
    def test_multiple_emails_removal(self):
        """Multiple email addresses should all be redacted."""
        text = "Email john@example.com or jane@test.org"
        result = anonymize_data(text)
        
        assert "john@example.com" not in result.anonymized_data
        assert "jane@test.org" not in result.anonymized_data
        assert result.anonymized_data.count("[EMAIL_REDACTED]") == 2
    
    def test_phone_number_removal(self):
        """Phone numbers should be redacted."""
        test_cases = [
            "Call me at 555-123-4567",
            "Phone: (555) 123-4567",
            "Contact: 555.123.4567",
            "Mobile: +1-555-123-4567"
        ]
        
        for text in test_cases:
            result = anonymize_data(text)
            assert "[PHONE_REDACTED]" in result.anonymized_data
            assert result.pii_found is True
            assert "phone" in result.pii_types_removed
    
    def test_address_removal(self):
        """Street addresses should be redacted."""
        test_cases = [
            "I live at 123 Main Street",
            "Address: 456 Oak Avenue",
            "Located at 789 Elm Road",
            "Visit us at 321 Park Boulevard"
        ]
        
        for text in test_cases:
            result = anonymize_data(text)
            assert "[ADDRESS_REDACTED]" in result.anonymized_data
            assert result.pii_found is True
            assert "address" in result.pii_types_removed
    
    def test_zip_code_removal(self):
        """Zip codes should be redacted."""
        test_cases = [
            "Zip code: 12345",
            "Located in 90210",
            "Mail to 12345-6789"
        ]
        
        for text in test_cases:
            result = anonymize_data(text)
            assert "[ZIP_REDACTED]" in result.anonymized_data
            assert result.pii_found is True
            assert "zip_code" in result.pii_types_removed
    
    def test_ip_address_removal(self):
        """IP addresses should be redacted."""
        text = "Server IP: 192.168.1.1"
        result = anonymize_data(text)
        
        assert "192.168.1.1" not in result.anonymized_data
        assert "[IP_REDACTED]" in result.anonymized_data
        assert result.pii_found is True
        assert "ip_address" in result.pii_types_removed
    
    def test_credit_card_removal(self):
        """Credit card numbers should be redacted."""
        test_cases = [
            "Card: 1234-5678-9012-3456",
            "CC: 1234 5678 9012 3456",
            "Number: 1234567890123456"
        ]
        
        for text in test_cases:
            result = anonymize_data(text)
            assert "[CARD_REDACTED]" in result.anonymized_data
            assert result.pii_found is True
            assert "credit_card" in result.pii_types_removed
    
    def test_no_pii_in_clean_text(self):
        """Clean text without PII should remain unchanged."""
        text = "I love Python programming and AI development"
        result = anonymize_data(text)
        
        assert result.anonymized_data == text
        assert result.pii_found is False
        assert len(result.pii_types_removed) == 0
    
    def test_mixed_pii_removal(self):
        """Text with multiple PII types should have all removed."""
        text = "Contact John at john@example.com or 555-123-4567. Address: 123 Main St, 12345"
        result = anonymize_data(text)
        
        assert "john@example.com" not in result.anonymized_data
        assert "555-123-4567" not in result.anonymized_data
        assert "123 Main St" not in result.anonymized_data
        assert "12345" not in result.anonymized_data
        assert result.pii_found is True
        assert len(result.pii_types_removed) >= 3


class TestDictAnonymization:
    """Test anonymization of dictionary data."""
    
    def test_pii_field_removal_with_preserve(self):
        """PII fields should be redacted when preserve_structure=True."""
        data = {
            "email": "john@example.com",
            "phone": "555-123-4567",
            "name": "John Doe",
            "skills": ["Python", "JavaScript"]
        }
        result = anonymize_data(data, preserve_structure=True)
        
        assert result.anonymized_data["email"] == "[REDACTED]"
        assert result.anonymized_data["phone"] == "[REDACTED]"
        assert result.anonymized_data["name"] == "[REDACTED]"
        assert result.anonymized_data["skills"] == ["Python", "JavaScript"]
        assert result.pii_found is True
    
    def test_pii_field_removal_without_preserve(self):
        """PII fields should be removed when preserve_structure=False."""
        data = {
            "email": "john@example.com",
            "phone": "555-123-4567",
            "skills": ["Python", "JavaScript"]
        }
        result = anonymize_data(data, preserve_structure=False)
        
        assert "email" not in result.anonymized_data
        assert "phone" not in result.anonymized_data
        assert "skills" in result.anonymized_data
        assert result.pii_found is True
    
    def test_nested_dict_anonymization(self):
        """Nested dictionaries should be recursively anonymized."""
        data = {
            "user": {
                "email": "john@example.com",
                "profile": {
                    "phone": "555-123-4567",
                    "skills": ["Python"]
                }
            }
        }
        result = anonymize_data(data, preserve_structure=True)
        
        assert result.anonymized_data["user"]["email"] == "[REDACTED]"
        assert result.anonymized_data["user"]["profile"]["phone"] == "[REDACTED]"
        assert result.anonymized_data["user"]["profile"]["skills"] == ["Python"]
    
    def test_pii_in_string_values(self):
        """PII in string values should be redacted even if key is not PII."""
        data = {
            "message": "Contact me at john@example.com",
            "notes": "Call 555-123-4567"
        }
        result = anonymize_data(data)
        
        assert "john@example.com" not in result.anonymized_data["message"]
        assert "[EMAIL_REDACTED]" in result.anonymized_data["message"]
        assert "[PHONE_REDACTED]" in result.anonymized_data["notes"]
    
    def test_case_insensitive_field_detection(self):
        """PII field detection should be case-insensitive."""
        data = {
            "Email": "john@example.com",
            "PHONE_NUMBER": "555-123-4567",
            "Full_Name": "John Doe"
        }
        result = anonymize_data(data, preserve_structure=True)
        
        assert result.anonymized_data["Email"] == "[REDACTED]"
        assert result.anonymized_data["PHONE_NUMBER"] == "[REDACTED]"
        assert result.anonymized_data["Full_Name"] == "[REDACTED]"
    
    def test_clean_dict_unchanged(self):
        """Dictionary without PII should remain unchanged."""
        data = {
            "skills": ["Python", "JavaScript"],
            "experience_years": 5,
            "remote_preference": True
        }
        result = anonymize_data(data)
        
        assert result.anonymized_data == data
        assert result.pii_found is False


class TestListAnonymization:
    """Test anonymization of list data."""
    
    def test_list_of_strings_anonymization(self):
        """List of strings should have PII removed from each element."""
        data = [
            "Contact john@example.com",
            "Call 555-123-4567",
            "Python programming"
        ]
        result = anonymize_data(data)
        
        assert "john@example.com" not in result.anonymized_data[0]
        assert "[EMAIL_REDACTED]" in result.anonymized_data[0]
        assert "[PHONE_REDACTED]" in result.anonymized_data[1]
        assert result.anonymized_data[2] == "Python programming"
    
    def test_list_of_dicts_anonymization(self):
        """List of dictionaries should be anonymized."""
        data = [
            {"email": "john@example.com", "skill": "Python"},
            {"phone": "555-123-4567", "skill": "JavaScript"}
        ]
        result = anonymize_data(data, preserve_structure=True)
        
        assert result.anonymized_data[0]["email"] == "[REDACTED]"
        assert result.anonymized_data[0]["skill"] == "Python"
        assert result.anonymized_data[1]["phone"] == "[REDACTED]"
    
    def test_nested_list_anonymization(self):
        """Nested lists should be recursively anonymized."""
        data = [
            ["john@example.com", "Python"],
            ["555-123-4567", "JavaScript"]
        ]
        result = anonymize_data(data)
        
        assert "john@example.com" not in result.anonymized_data[0][0]
        assert "[EMAIL_REDACTED]" in result.anonymized_data[0][0]
        assert result.anonymized_data[0][1] == "Python"


class TestSanitizeForLLM:
    """Test the main sanitization function for LLM calls."""
    
    def test_prompt_sanitization(self):
        """Prompt should be sanitized before LLM call."""
        prompt = "My email is john@example.com and phone is 555-123-4567"
        result = sanitize_for_llm(prompt)
        
        assert "john@example.com" not in result["prompt"]
        assert "555-123-4567" not in result["prompt"]
        assert result["pii_removed"] is True
        assert "email" in result["pii_types"]
        assert "phone" in result["pii_types"]
    
    def test_context_sanitization(self):
        """Context should be sanitized before LLM call."""
        prompt = "Find me a job"
        context = {
            "user_profile": {
                "email": "john@example.com",
                "phone": "555-123-4567",
                "skills": ["Python", "JavaScript"]
            }
        }
        result = sanitize_for_llm(prompt, context)
        
        assert "john@example.com" not in str(result["context"])
        assert result["context"]["user_profile"]["email"] == "[REDACTED]"
        assert result["context"]["user_profile"]["skills"] == ["Python", "JavaScript"]
        assert result["pii_removed"] is True
    
    def test_no_context_provided(self):
        """Should handle case when no context is provided."""
        prompt = "What is Python?"
        result = sanitize_for_llm(prompt)
        
        assert result["context"] is None
        assert result["pii_removed"] is False
    
    def test_clean_prompt_and_context(self):
        """Clean data should pass through unchanged."""
        prompt = "What are the best Python frameworks?"
        context = {"skills": ["Python", "JavaScript"]}
        result = sanitize_for_llm(prompt, context)
        
        assert result["prompt"] == prompt
        assert result["context"] == context
        assert result["pii_removed"] is False
        assert len(result["pii_types"]) == 0


class TestIsPIIPresent:
    """Test PII detection without modification."""
    
    def test_detects_email(self):
        """Should detect email addresses."""
        assert is_pii_present("Contact john@example.com") is True
    
    def test_detects_phone(self):
        """Should detect phone numbers."""
        assert is_pii_present("Call 555-123-4567") is True
    
    def test_detects_address(self):
        """Should detect addresses."""
        assert is_pii_present("123 Main Street") is True
    
    def test_detects_zip_code(self):
        """Should detect zip codes."""
        assert is_pii_present("Located in 12345") is True
    
    def test_detects_ip_address(self):
        """Should detect IP addresses."""
        assert is_pii_present("Server: 192.168.1.1") is True
    
    def test_detects_credit_card(self):
        """Should detect credit card numbers."""
        assert is_pii_present("Card: 1234-5678-9012-3456") is True
    
    def test_no_pii_in_clean_text(self):
        """Should return False for clean text."""
        assert is_pii_present("I love Python programming") is False
        assert is_pii_present("The weather is nice today") is False


class TestAnonymizationResult:
    """Test AnonymizationResult metadata."""
    
    def test_result_metadata(self):
        """Result should include complete metadata."""
        text = "Email: john@example.com"
        result = anonymize_data(text)
        
        assert isinstance(result, AnonymizationResult)
        assert result.pii_found is True
        assert "email" in result.pii_types_removed
        assert result.original_size > 0
        assert result.anonymized_size > 0
    
    def test_size_calculation(self):
        """Size should be calculated correctly."""
        text = "Short text"
        result = anonymize_data(text)
        
        assert result.original_size == len(text.encode('utf-8'))
        assert result.anonymized_size == len(result.anonymized_data.encode('utf-8'))


class TestEdgeCases:
    """Test edge cases and boundary conditions."""
    
    def test_empty_string(self):
        """Empty string should be handled gracefully."""
        result = anonymize_data("")
        
        assert result.anonymized_data == ""
        assert result.pii_found is False
    
    def test_empty_dict(self):
        """Empty dictionary should be handled gracefully."""
        result = anonymize_data({})
        
        assert result.anonymized_data == {}
        assert result.pii_found is False
    
    def test_empty_list(self):
        """Empty list should be handled gracefully."""
        result = anonymize_data([])
        
        assert result.anonymized_data == []
        assert result.pii_found is False
    
    def test_none_values_in_dict(self):
        """None values should be preserved."""
        data = {"email": None, "skills": ["Python"]}
        result = anonymize_data(data, preserve_structure=True)
        
        # None value in PII field should be redacted
        assert result.anonymized_data["email"] == "[REDACTED]"
        assert result.anonymized_data["skills"] == ["Python"]
    
    def test_numeric_values_preserved(self):
        """Numeric values should be preserved."""
        data = {
            "experience_years": 5,
            "salary": 100000,
            "rating": 4.5
        }
        result = anonymize_data(data)
        
        assert result.anonymized_data == data
        assert result.pii_found is False
    
    def test_boolean_values_preserved(self):
        """Boolean values should be preserved."""
        data = {
            "remote_preference": True,
            "available": False
        }
        result = anonymize_data(data)
        
        assert result.anonymized_data == data
        assert result.pii_found is False
    
    def test_special_characters_in_text(self):
        """Special characters should not interfere with PII detection."""
        text = "Email: <john@example.com> or [jane@test.org]"
        result = anonymize_data(text)
        
        assert "john@example.com" not in result.anonymized_data
        assert "jane@test.org" not in result.anonymized_data
        assert result.pii_found is True


class TestRealWorldScenarios:
    """Test real-world usage scenarios."""
    
    def test_user_profile_anonymization(self):
        """Complete user profile should be properly anonymized."""
        profile = {
            "user_id": "usr_12345",  # Changed to avoid zip code pattern
            "email": "john.doe@example.com",
            "phone": "+1-555-123-4567",
            "full_name": "John Doe",
            "address": "123 Main Street",
            "skills": ["Python", "JavaScript", "React"],
            "experience_years": 5,
            "location": "San Francisco",
            "remote_preference": True,
            "career_goals": "Become a senior developer"
        }
        
        result = anonymize_data(profile, preserve_structure=True)
        
        # PII fields should be redacted
        assert result.anonymized_data["email"] == "[REDACTED]"
        assert result.anonymized_data["phone"] == "[REDACTED]"
        assert result.anonymized_data["full_name"] == "[REDACTED]"
        assert result.anonymized_data["address"] == "[REDACTED]"
        
        # Non-PII fields should be preserved
        assert result.anonymized_data["user_id"] == "usr_12345"
        assert result.anonymized_data["skills"] == ["Python", "JavaScript", "React"]
        assert result.anonymized_data["experience_years"] == 5
        assert result.anonymized_data["location"] == "San Francisco"
        assert result.anonymized_data["remote_preference"] is True
        assert result.anonymized_data["career_goals"] == "Become a senior developer"
        
        assert result.pii_found is True
    
    def test_conversation_context_anonymization(self):
        """Conversation context should be anonymized."""
        context = {
            "user_message": "I'm looking for a job. Contact me at john@example.com",
            "user_profile": {
                "email": "john@example.com",
                "skills": ["Python"]
            },
            "conversation_history": [
                "What kind of jobs are you looking for?",
                "Python developer roles"
            ]
        }
        
        result = sanitize_for_llm("Find me a job", context)
        
        # Email in message should be redacted
        assert "john@example.com" not in result["context"]["user_message"]
        
        # Email in profile should be redacted
        assert result["context"]["user_profile"]["email"] == "[REDACTED]"
        
        # Skills should be preserved
        assert result["context"]["user_profile"]["skills"] == ["Python"]
        
        # History should be preserved
        assert result["context"]["conversation_history"] == [
            "What kind of jobs are you looking for?",
            "Python developer roles"
        ]
    
    def test_opportunity_matching_context(self):
        """Opportunity matching context should preserve relevant data."""
        context = {
            "user_profile": {
                "email": "john@example.com",
                "skills": ["Python", "Django", "PostgreSQL"],
                "experience_years": 5,
                "location": "Remote"
            },
            "opportunities": [
                {
                    "title": "Senior Python Developer",
                    "company": "Tech Corp",
                    "required_skills": ["Python", "Django"],
                    "remote": True
                }
            ]
        }
        
        result = sanitize_for_llm("Find matching opportunities", context)
        
        # Email should be redacted
        assert result["context"]["user_profile"]["email"] == "[REDACTED]"
        
        # Skills and experience should be preserved for matching
        assert result["context"]["user_profile"]["skills"] == ["Python", "Django", "PostgreSQL"]
        assert result["context"]["user_profile"]["experience_years"] == 5
        
        # Opportunities should be preserved
        assert len(result["context"]["opportunities"]) == 1
        assert result["context"]["opportunities"][0]["title"] == "Senior Python Developer"
