"""
Data anonymization utilities for protecting user privacy in LLM calls.

This module provides PII (Personally Identifiable Information) removal
to ensure compliance with GDPR and privacy requirements when sending
data to external LLM providers.

Critical Security Feature: Requirement 11.3
"""

import re
from typing import Any, Dict, List, Optional, Union
from dataclasses import dataclass, asdict


# PII patterns for detection and removal
# Email pattern - matches email addresses with flexible boundaries and unicode support
# Allows unicode characters in both username and domain parts
EMAIL_PATTERN = re.compile(
    r'[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}',
    re.UNICODE
)

# Phone pattern - matches various formats
PHONE_PATTERN = re.compile(
    r'(?:\+?(\d{1,3}))?[-.\s]?'  # Country code
    r'\(?(\d{3})\)?[-.\s]?'       # Area code
    r'(\d{3})[-.\s]?'             # First 3 digits
    r'(\d{4})(?!\d)'              # Last 4 digits with negative lookahead
)

# Common address patterns (street numbers, zip codes, etc.)
ADDRESS_PATTERN = re.compile(
    r'\b\d{1,5}\s+[\w\s]{1,50}(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|way|court|ct)(?:\b|(?=\d))',
    re.IGNORECASE
)

# US zip codes - must be standalone (not part of identifiers)
# Only match when preceded/followed by whitespace, punctuation, or string boundaries
ZIP_CODE_PATTERN = re.compile(
    r'(?<![A-Za-z0-9_])\d{5}(?:-\d{4})?(?![A-Za-z0-9_])'
)

# IP address pattern
IP_ADDRESS_PATTERN = re.compile(
    r'(?<!\d)(?:\d{1,3}\.){3}\d{1,3}(?!\d)'  # With word boundaries
)

# Credit card pattern (basic detection)
CREDIT_CARD_PATTERN = re.compile(
    r'(?<!\d)\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}(?!\d)'
)


@dataclass
class AnonymizationResult:
    """Result of anonymization operation with metadata."""
    
    anonymized_data: Any
    pii_found: bool
    pii_types_removed: List[str]
    original_size: int
    anonymized_size: int


def anonymize_data(
    data: Union[str, Dict[str, Any], List[Any]],
    preserve_structure: bool = True
) -> AnonymizationResult:
    """
    Remove PII from data before sending to external LLM providers.
    
    This function strips:
    - Email addresses
    - Phone numbers
    - Full names (when in structured data)
    - Physical addresses
    - Zip codes
    - IP addresses
    - Credit card numbers
    
    Args:
        data: Data to anonymize (string, dict, or list)
        preserve_structure: If True, maintain data structure (replace with placeholders)
                          If False, completely remove PII fields
        
    Returns:
        AnonymizationResult with anonymized data and metadata
        
    Raises:
        TypeError: If data type is not supported
        
    Example:
        >>> data = "Contact me at john@example.com or 555-123-4567"
        >>> result = anonymize_data(data)
        >>> assert "john@example.com" not in result.anonymized_data
        >>> assert result.pii_found is True
        >>> assert "email" in result.pii_types_removed
    """
    original_size = _calculate_size(data)
    pii_types = []
    
    if isinstance(data, str):
        anonymized = _anonymize_string(data, pii_types)
    elif isinstance(data, dict):
        anonymized = _anonymize_dict(data, pii_types, preserve_structure)
    elif isinstance(data, list):
        anonymized = _anonymize_list(data, pii_types, preserve_structure)
    else:
        # For other types, convert to string and anonymize
        anonymized = _anonymize_string(str(data), pii_types)
    
    anonymized_size = _calculate_size(anonymized)
    
    return AnonymizationResult(
        anonymized_data=anonymized,
        pii_found=len(pii_types) > 0,
        pii_types_removed=pii_types,
        original_size=original_size,
        anonymized_size=anonymized_size
    )


def _anonymize_string(text: str, pii_types: List[str]) -> str:
    """
    Remove PII from a string using regex patterns.
    
    Args:
        text: String to anonymize
        pii_types: List to append detected PII types to
        
    Returns:
        Anonymized string with PII replaced by placeholders
    """
    anonymized = text
    
    # Remove email addresses first (most specific)
    if EMAIL_PATTERN.search(anonymized):
        anonymized = EMAIL_PATTERN.sub('[EMAIL_REDACTED]', anonymized)
        if 'email' not in pii_types:
            pii_types.append('email')
    
    # Remove credit card numbers before phone (to avoid conflict)
    if CREDIT_CARD_PATTERN.search(anonymized):
        anonymized = CREDIT_CARD_PATTERN.sub('[CARD_REDACTED]', anonymized)
        if 'credit_card' not in pii_types:
            pii_types.append('credit_card')
    
    # Remove phone numbers
    if PHONE_PATTERN.search(anonymized):
        anonymized = PHONE_PATTERN.sub('[PHONE_REDACTED]', anonymized)
        if 'phone' not in pii_types:
            pii_types.append('phone')
    
    # Remove addresses
    if ADDRESS_PATTERN.search(anonymized):
        anonymized = ADDRESS_PATTERN.sub('[ADDRESS_REDACTED]', anonymized)
        if 'address' not in pii_types:
            pii_types.append('address')
    
    # Remove zip codes
    if ZIP_CODE_PATTERN.search(anonymized):
        anonymized = ZIP_CODE_PATTERN.sub('[ZIP_REDACTED]', anonymized)
        if 'zip_code' not in pii_types:
            pii_types.append('zip_code')
    
    # Remove IP addresses
    if IP_ADDRESS_PATTERN.search(anonymized):
        anonymized = IP_ADDRESS_PATTERN.sub('[IP_REDACTED]', anonymized)
        if 'ip_address' not in pii_types:
            pii_types.append('ip_address')
    
    return anonymized


def _anonymize_dict(
    data: Dict[str, Any],
    pii_types: List[str],
    preserve_structure: bool
) -> Dict[str, Any]:
    """
    Remove PII from dictionary by checking keys and values.
    
    Args:
        data: Dictionary to anonymize
        pii_types: List to append detected PII types to
        preserve_structure: Whether to keep keys with redacted values
        
    Returns:
        Anonymized dictionary
    """
    # PII field names to remove or redact
    pii_fields = {
        'email', 'email_address', 'user_email',
        'phone', 'phone_number', 'mobile', 'telephone',
        'full_name', 'name', 'first_name', 'last_name',
        'address', 'street_address', 'home_address', 'billing_address',
        'ssn', 'social_security', 'passport', 'driver_license',
        'credit_card', 'card_number', 'cvv',
        'ip_address', 'ip',
        'date_of_birth', 'dob', 'birth_date'
    }
    
    anonymized = {}
    
    for key, value in data.items():
        key_lower = key.lower()
        
        # Check if key indicates PII field
        is_pii_field = any(pii_field in key_lower for pii_field in pii_fields)
        
        if is_pii_field:
            # Track which type of PII was found
            for pii_field in pii_fields:
                if pii_field in key_lower and pii_field not in pii_types:
                    pii_types.append(pii_field)
            
            if preserve_structure:
                # Replace with placeholder
                anonymized[key] = '[REDACTED]'
            # else: skip the field entirely (don't add to anonymized dict)
        else:
            # Recursively anonymize the value
            if isinstance(value, str):
                anonymized[key] = _anonymize_string(value, pii_types)
            elif isinstance(value, dict):
                anonymized[key] = _anonymize_dict(value, pii_types, preserve_structure)
            elif isinstance(value, list):
                anonymized[key] = _anonymize_list(value, pii_types, preserve_structure)
            else:
                # Keep non-PII primitive values as-is
                anonymized[key] = value
    
    return anonymized


def _anonymize_list(
    data: List[Any],
    pii_types: List[str],
    preserve_structure: bool
) -> List[Any]:
    """
    Remove PII from list by anonymizing each element.
    
    Args:
        data: List to anonymize
        pii_types: List to append detected PII types to
        preserve_structure: Whether to preserve structure
        
    Returns:
        Anonymized list
    """
    anonymized = []
    
    for item in data:
        if isinstance(item, str):
            anonymized.append(_anonymize_string(item, pii_types))
        elif isinstance(item, dict):
            anonymized.append(_anonymize_dict(item, pii_types, preserve_structure))
        elif isinstance(item, list):
            anonymized.append(_anonymize_list(item, pii_types, preserve_structure))
        else:
            anonymized.append(item)
    
    return anonymized


def _calculate_size(data: Any) -> int:
    """
    Calculate approximate size of data in bytes.
    
    Args:
        data: Data to measure
        
    Returns:
        Approximate size in bytes
    """
    if isinstance(data, str):
        return len(data.encode('utf-8'))
    elif isinstance(data, (dict, list)):
        return len(str(data).encode('utf-8'))
    else:
        return len(str(data).encode('utf-8'))


def sanitize_for_llm(
    prompt: str,
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Sanitize prompt and context before sending to LLM provider.
    
    This is the main function to use before any LLM API call.
    It ensures no PII is transmitted to external providers.
    
    Args:
        prompt: User prompt/message
        context: Additional context data (user profile, history, etc.)
        
    Returns:
        Dictionary with anonymized prompt and context
        
    Example:
        >>> sanitized = sanitize_for_llm(
        ...     prompt="My email is john@example.com",
        ...     context={"user_profile": {"email": "john@example.com"}}
        ... )
        >>> assert "john@example.com" not in sanitized["prompt"]
        >>> assert "john@example.com" not in str(sanitized["context"])
    """
    # Anonymize prompt
    prompt_result = anonymize_data(prompt, preserve_structure=False)
    
    # Anonymize context if provided
    context_result = None
    if context:
        context_result = anonymize_data(context, preserve_structure=True)
    
    return {
        'prompt': prompt_result.anonymized_data,
        'context': context_result.anonymized_data if context_result else None,
        'pii_removed': (prompt_result.pii_found or (context_result and context_result.pii_found)) if context_result is not None else prompt_result.pii_found,
        'pii_types': list(set(
            prompt_result.pii_types_removed +
            (context_result.pii_types_removed if context_result else [])
        ))
    }


def is_pii_present(text: str) -> bool:
    """
    Check if text contains any PII without modifying it.
    
    Useful for validation and testing.
    
    Args:
        text: Text to check
        
    Returns:
        True if PII is detected, False otherwise
        
    Example:
        >>> is_pii_present("Contact me at john@example.com")
        True
        >>> is_pii_present("I love Python programming")
        False
    """
    patterns = [
        EMAIL_PATTERN,
        PHONE_PATTERN,
        ADDRESS_PATTERN,
        ZIP_CODE_PATTERN,
        IP_ADDRESS_PATTERN,
        CREDIT_CARD_PATTERN
    ]
    
    return any(pattern.search(text) for pattern in patterns)
