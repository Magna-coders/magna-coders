"""
Input validation utilities.
"""

from typing import Dict, Any, List
from pydantic import BaseModel, ValidationError


class ValidationResult(BaseModel):
    """Result of input validation."""
    valid: bool
    errors: List[str] = []


def validate_input(data: Dict[str, Any], model: type[BaseModel]) -> ValidationResult:
    """
    Validate input data against a Pydantic model.
    
    Args:
        data: Input data to validate
        model: Pydantic model class
        
    Returns:
        ValidationResult with validation status and errors
    """
    try:
        model(**data)
        return ValidationResult(valid=True, errors=[])
    except ValidationError as e:
        errors = [f"{err['loc'][0]}: {err['msg']}" for err in e.errors()]
        return ValidationResult(valid=False, errors=errors)
