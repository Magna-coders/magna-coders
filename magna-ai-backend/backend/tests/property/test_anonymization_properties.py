"""
Property-based tests for data anonymization.

Uses Hypothesis to generate random test cases and verify that PII
is never leaked to LLM providers under any circumstances.

Feature: magna-ai-agent
Property 47: Data anonymization before LLM transmission
Validates: Requirement 11.3 - SHALL NOT transmit user data to LLM providers without anonymization
"""

import re
from hypothesis import given, strategies as st, assume
from ...utils.anonymization import (
    anonymize_data,
    sanitize_for_llm,
    is_pii_present,
    EMAIL_PATTERN,
    PHONE_PATTERN,
    ADDRESS_PATTERN,
    ZIP_CODE_PATTERN,
    IP_ADDRESS_PATTERN,
    CREDIT_CARD_PATTERN
)


# Strategy for generating email addresses
@st.composite
def email_addresses(draw):
    """Generate valid email addresses."""
    username = draw(st.text(
        alphabet=st.characters(whitelist_categories=('Ll', 'Lu', 'Nd'), whitelist_characters='._-'),
        min_size=1,
        max_size=20
    ))
    domain = draw(st.text(
        alphabet=st.characters(whitelist_categories=('Ll', 'Lu', 'Nd'), whitelist_characters='-'),
        min_size=1,
        max_size=20
    ))
    tld = draw(st.sampled_from(['com', 'org', 'net', 'edu', 'io', 'co']))
    return f"{username}@{domain}.{tld}"


# Strategy for generating phone numbers
@st.composite
def phone_numbers(draw):
    """Generate valid phone numbers in various formats."""
    area_code = draw(st.integers(min_value=200, max_value=999))
    prefix = draw(st.integers(min_value=200, max_value=999))
    line = draw(st.integers(min_value=1000, max_value=9999))
    
    format_choice = draw(st.integers(min_value=0, max_value=3))
    if format_choice == 0:
        return f"{area_code}-{prefix}-{line}"
    elif format_choice == 1:
        return f"({area_code}) {prefix}-{line}"
    elif format_choice == 2:
        return f"{area_code}.{prefix}.{line}"
    else:
        return f"+1-{area_code}-{prefix}-{line}"


# Strategy for generating addresses
@st.composite
def street_addresses(draw):
    """Generate valid street addresses."""
    number = draw(st.integers(min_value=1, max_value=99999))
    street_name = draw(st.text(
        alphabet=st.characters(whitelist_categories=('Ll', 'Lu')),
        min_size=3,
        max_size=15
    ))
    street_type = draw(st.sampled_from([
        'Street', 'Avenue', 'Road', 'Drive', 'Lane', 'Boulevard', 'Way', 'Court',
        'St', 'Ave', 'Rd', 'Dr', 'Ln', 'Blvd'
    ]))
    return f"{number} {street_name} {street_type}"


# Strategy for generating zip codes
@st.composite
def zip_codes(draw):
    """Generate valid US zip codes."""
    base = draw(st.integers(min_value=10000, max_value=99999))
    extended = draw(st.booleans())
    if extended:
        ext = draw(st.integers(min_value=1000, max_value=9999))
        return f"{base}-{ext}"
    return str(base)


# Strategy for generating IP addresses
@st.composite
def ip_addresses(draw):
    """Generate valid IPv4 addresses."""
    octets = [draw(st.integers(min_value=0, max_value=255)) for _ in range(4)]
    return '.'.join(map(str, octets))


# Strategy for generating credit card numbers
@st.composite
def credit_card_numbers(draw):
    """Generate credit card-like numbers."""
    parts = [draw(st.integers(min_value=1000, max_value=9999)) for _ in range(4)]
    format_choice = draw(st.integers(min_value=0, max_value=2))
    if format_choice == 0:
        return '-'.join(map(str, parts))
    elif format_choice == 1:
        return ' '.join(map(str, parts))
    else:
        return ''.join(map(str, parts))


class TestEmailAnonymizationProperty:
    """Property tests for email anonymization."""
    
    @given(email=email_addresses(), prefix=st.text(max_size=50), suffix=st.text(max_size=50))
    def test_email_never_in_output(self, email, prefix, suffix):
        """
        Property: For any email address in input, it should never appear in output.
        
        Feature: magna-ai-agent
        Validates: Requirement 11.3
        """
        text = f"{prefix}{email}{suffix}"
        result = anonymize_data(text)
        
        # Critical assertion: email must not be in output
        assert email not in result.anonymized_data, \
            f"Email {email} leaked in anonymized output: {result.anonymized_data}"
        
        # If email was in input, PII should be detected
        if email in text:
            assert result.pii_found is True
            assert "email" in result.pii_types_removed
    
    @given(emails=st.lists(email_addresses(), min_size=1, max_size=5))
    def test_multiple_emails_never_in_output(self, emails):
        """
        Property: For any list of emails, none should appear in output.
        
        Feature: magna-ai-agent
        Validates: Requirement 11.3
        """
        text = " and ".join(emails)
        result = anonymize_data(text)
        
        for email in emails:
            assert email not in result.anonymized_data, \
                f"Email {email} leaked in anonymized output"
        
        assert result.pii_found is True
        assert "email" in result.pii_types_removed


class TestPhoneAnonymizationProperty:
    """Property tests for phone number anonymization."""
    
    @given(phone=phone_numbers(), prefix=st.text(max_size=50), suffix=st.text(max_size=50))
    def test_phone_never_in_output(self, phone, prefix, suffix):
        """
        Property: For any phone number in input, it should never appear in output.
        
        Feature: magna-ai-agent
        Validates: Requirement 11.3
        """
        text = f"{prefix}{phone}{suffix}"
        result = anonymize_data(text)
        
        # Critical assertion: phone must not be in output
        # Check if any part of the phone number appears
        digits_only = re.sub(r'\D', '', phone)
        output_digits = re.sub(r'\D', '', result.anonymized_data)
        
        # The consecutive digits from phone should not appear in output
        if len(digits_only) >= 10:
            assert digits_only not in output_digits, \
                f"Phone {phone} leaked in anonymized output: {result.anonymized_data}"


class TestAddressAnonymizationProperty:
    """Property tests for address anonymization."""
    
    @given(address=street_addresses(), prefix=st.text(max_size=50), suffix=st.text(max_size=50))
    def test_address_never_in_output(self, address, prefix, suffix):
        """
        Property: For any address in input, it should never appear in output.
        
        Feature: magna-ai-agent
        Validates: Requirement 11.3
        """
        text = f"{prefix}{address}{suffix}"
        result = anonymize_data(text)
        
        # Critical assertion: address must not be in output
        assert address not in result.anonymized_data, \
            f"Address {address} leaked in anonymized output: {result.anonymized_data}"


class TestZipCodeAnonymizationProperty:
    """Property tests for zip code anonymization."""
    
    @given(zip_code=zip_codes(), prefix=st.text(max_size=50), suffix=st.text(max_size=50))
    def test_zip_code_never_in_output(self, zip_code, prefix, suffix):
        """
        Property: For any zip code in input, it should never appear in output.
        
        Feature: magna-ai-agent
        Validates: Requirement 11.3
        """
        text = f"{prefix}{zip_code}{suffix}"
        result = anonymize_data(text)
        
        # Critical assertion: zip code must not be in output
        assert zip_code not in result.anonymized_data, \
            f"Zip code {zip_code} leaked in anonymized output: {result.anonymized_data}"


class TestIPAddressAnonymizationProperty:
    """Property tests for IP address anonymization."""
    
    @given(ip=ip_addresses(), prefix=st.text(max_size=50), suffix=st.text(max_size=50))
    def test_ip_address_never_in_output(self, ip, prefix, suffix):
        """
        Property: For any IP address in input, it should never appear in output.
        
        Feature: magna-ai-agent
        Validates: Requirement 11.3
        """
        text = f"{prefix}{ip}{suffix}"
        result = anonymize_data(text)
        
        # Critical assertion: IP must not be in output
        assert ip not in result.anonymized_data, \
            f"IP address {ip} leaked in anonymized output: {result.anonymized_data}"


class TestCreditCardAnonymizationProperty:
    """Property tests for credit card anonymization."""
    
    @given(card=credit_card_numbers(), prefix=st.text(max_size=50), suffix=st.text(max_size=50))
    def test_credit_card_never_in_output(self, card, prefix, suffix):
        """
        Property: For any credit card number in input, it should never appear in output.
        
        Feature: magna-ai-agent
        Validates: Requirement 11.3
        """
        text = f"{prefix}{card}{suffix}"
        result = anonymize_data(text)
        
        # Critical assertion: card number must not be in output
        # Check digits only to catch any format
        digits_only = re.sub(r'\D', '', card)
        output_digits = re.sub(r'\D', '', result.anonymized_data)
        
        if len(digits_only) == 16:
            assert digits_only not in output_digits, \
                f"Credit card {card} leaked in anonymized output: {result.anonymized_data}"


class TestDictAnonymizationProperty:
    """Property tests for dictionary anonymization."""
    
    @given(
        email=email_addresses(),
        phone=phone_numbers(),
        name=st.text(min_size=3, max_size=50),  # Minimum 3 chars to avoid false positives
        skills=st.lists(st.text(min_size=3, max_size=20), min_size=1, max_size=5)
    )
    def test_dict_pii_never_in_output(self, email, phone, name, skills):
        """
        Property: For any dictionary with PII fields, PII values should never appear in output.
        
        Feature: magna-ai-agent
        Validates: Requirement 11.3
        """
        # Skip if name appears in skills (would cause false positive)
        assume(name not in skills)
        
        data = {
            "email": email,
            "phone": phone,
            "full_name": name,
            "skills": skills
        }
        
        result = anonymize_data(data, preserve_structure=True)
        
        # Critical assertions: PII must not be in output
        output_str = str(result.anonymized_data)
        assert email not in output_str, f"Email {email} leaked in dict output"
        # Phone check is complex due to formatting, skip for now
        # Only check name if it's not a substring of skills
        if not any(name in skill for skill in skills):
            assert name not in output_str, f"Name {name} leaked in dict output"
        
        # Non-PII should be preserved
        assert result.anonymized_data["skills"] == skills
        
        # PII fields should be redacted
        assert result.anonymized_data["email"] == "[REDACTED]"
        assert result.anonymized_data["phone"] == "[REDACTED]"
        assert result.anonymized_data["full_name"] == "[REDACTED]"
    
    @given(
        st.dictionaries(
            keys=st.sampled_from(['email', 'phone', 'name', 'address']),
            values=st.text(min_size=1, max_size=100),
            min_size=1,
            max_size=4
        )
    )
    def test_pii_fields_always_redacted(self, pii_dict):
        """
        Property: For any dictionary with PII field names, those fields should be redacted.
        
        Feature: magna-ai-agent
        Validates: Requirement 11.3
        """
        result = anonymize_data(pii_dict, preserve_structure=True)
        
        # All PII fields should be redacted
        for key in pii_dict.keys():
            assert result.anonymized_data[key] == "[REDACTED]", \
                f"PII field {key} not redacted"
        
        assert result.pii_found is True


class TestSanitizeForLLMProperty:
    """Property tests for LLM sanitization."""
    
    @given(
        prompt=st.text(min_size=1, max_size=200),
        email=email_addresses(),
        phone=phone_numbers()
    )
    def test_sanitized_prompt_never_contains_pii(self, prompt, email, phone):
        """
        Property: For any prompt with PII, sanitized version should never contain PII.
        
        Feature: magna-ai-agent
        Validates: Requirement 11.3
        """
        # Inject PII into prompt
        prompt_with_pii = f"{prompt} Contact: {email} or {phone}"
        
        result = sanitize_for_llm(prompt_with_pii)
        
        # Critical assertions: PII must not be in sanitized prompt
        assert email not in result["prompt"], \
            f"Email {email} leaked in sanitized prompt"
        assert phone not in result["prompt"], \
            f"Phone {phone} leaked in sanitized prompt"
        
        assert result["pii_removed"] is True
    
    @given(
        prompt=st.text(min_size=1, max_size=100),
        email=email_addresses(),
        skills=st.lists(st.text(min_size=1, max_size=20), min_size=1, max_size=5)
    )
    def test_sanitized_context_never_contains_pii(self, prompt, email, skills):
        """
        Property: For any context with PII, sanitized version should never contain PII.
        
        Feature: magna-ai-agent
        Validates: Requirement 11.3
        """
        context = {
            "user_profile": {
                "email": email,
                "skills": skills
            }
        }
        
        result = sanitize_for_llm(prompt, context)
        
        # Critical assertion: email must not be in sanitized context
        context_str = str(result["context"])
        assert email not in context_str, \
            f"Email {email} leaked in sanitized context"
        
        # Non-PII should be preserved
        assert result["context"]["user_profile"]["skills"] == skills
        
        assert result["pii_removed"] is True


class TestAnonymizationIdempotency:
    """Property tests for anonymization idempotency."""
    
    @given(text=st.text(min_size=1, max_size=200))
    def test_double_anonymization_is_idempotent(self, text):
        """
        Property: Anonymizing already anonymized data should not change it.
        
        Feature: magna-ai-agent
        Validates: Requirement 11.3
        """
        result1 = anonymize_data(text)
        result2 = anonymize_data(result1.anonymized_data)
        
        # Second anonymization should not change the output
        assert result1.anonymized_data == result2.anonymized_data
    
    @given(
        data=st.dictionaries(
            keys=st.text(min_size=1, max_size=20),
            values=st.one_of(st.text(max_size=100), st.integers(), st.booleans()),
            min_size=1,
            max_size=10
        )
    )
    def test_dict_anonymization_is_idempotent(self, data):
        """
        Property: Anonymizing already anonymized dict should not change it.
        
        Feature: magna-ai-agent
        Validates: Requirement 11.3
        """
        result1 = anonymize_data(data, preserve_structure=True)
        result2 = anonymize_data(result1.anonymized_data, preserve_structure=True)
        
        # Second anonymization should not change the output
        assert result1.anonymized_data == result2.anonymized_data


class TestPIIDetectionConsistency:
    """Property tests for PII detection consistency."""
    
    @given(text=st.text(min_size=1, max_size=200))
    def test_pii_detection_matches_anonymization(self, text):
        """
        Property: If is_pii_present returns True, anonymization should find PII.
        
        Feature: magna-ai-agent
        Validates: Requirement 11.3
        """
        has_pii = is_pii_present(text)
        result = anonymize_data(text)
        
        # If PII is detected, anonymization should find it
        if has_pii:
            assert result.pii_found is True, \
                "is_pii_present detected PII but anonymization did not"
    
    @given(
        email=email_addresses(),
        phone=phone_numbers(),
        address=street_addresses()
    )
    def test_known_pii_always_detected(self, email, phone, address):
        """
        Property: Known PII patterns should always be detected.
        
        Feature: magna-ai-agent
        Validates: Requirement 11.3
        """
        text = f"Contact: {email}, {phone}, {address}"
        
        assert is_pii_present(text) is True, \
            f"Failed to detect PII in: {text}"
        
        result = anonymize_data(text)
        assert result.pii_found is True


class TestStructurePreservation:
    """Property tests for structure preservation."""
    
    @given(
        data=st.dictionaries(
            keys=st.text(min_size=1, max_size=20),
            values=st.one_of(st.text(max_size=50), st.integers(), st.booleans()),
            min_size=1,
            max_size=10
        )
    )
    def test_dict_keys_preserved_with_structure(self, data):
        """
        Property: When preserve_structure=True, all keys should be preserved.
        
        Feature: magna-ai-agent
        Validates: Requirement 11.3
        """
        result = anonymize_data(data, preserve_structure=True)
        
        # All keys should be present
        assert set(result.anonymized_data.keys()) == set(data.keys())
    
    @given(
        data=st.lists(
            st.one_of(st.text(max_size=50), st.integers(), st.booleans()),
            min_size=1,
            max_size=10
        )
    )
    def test_list_length_preserved(self, data):
        """
        Property: List length should be preserved after anonymization.
        
        Feature: magna-ai-agent
        Validates: Requirement 11.3
        """
        result = anonymize_data(data)
        
        # List length should be the same
        assert len(result.anonymized_data) == len(data)


class TestNonPIIPreservation:
    """Property tests for non-PII data preservation."""
    
    @given(
        skills=st.lists(st.text(min_size=1, max_size=20), min_size=1, max_size=5),
        experience=st.integers(min_value=0, max_value=50),
        remote=st.booleans()
    )
    def test_non_pii_fields_unchanged(self, skills, experience, remote):
        """
        Property: Non-PII fields should remain unchanged after anonymization.
        
        Feature: magna-ai-agent
        Validates: Requirement 11.3
        """
        data = {
            "skills": skills,
            "experience_years": experience,
            "remote_preference": remote
        }
        
        result = anonymize_data(data)
        
        # Non-PII fields should be identical
        assert result.anonymized_data["skills"] == skills
        assert result.anonymized_data["experience_years"] == experience
        assert result.anonymized_data["remote_preference"] == remote
