"""Unit tests for ConsentManager.

Tests consent request generation, approval/denial, token generation,
and token validation for secure document submission.
"""

import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from ...documents import (
    ConsentActionType,
    ConsentManager,
    ConsentStatus,
)


@pytest.fixture
def consent_manager():
    """Create ConsentManager instance."""
    return ConsentManager(consent_expiry_minutes=5, token_length=32)


@pytest.fixture
def sample_user_id():
    """Sample user ID."""
    return "550e8400-e29b-41d4-a716-446655440000"


@pytest.fixture
def sample_document_id():
    """Sample document ID."""
    return "660e8400-e29b-41d4-a716-446655440001"


@pytest.fixture
def sample_opportunity_id():
    """Sample opportunity ID."""
    return "770e8400-e29b-41d4-a716-446655440002"


class TestConsentRequestGeneration:
    """Tests for consent request generation."""
    
    @pytest.mark.asyncio
    async def test_request_submission_consent_success(
        self,
        consent_manager,
        sample_user_id,
        sample_document_id,
        sample_opportunity_id
    ):
        """Test successful consent request generation."""
        request = await consent_manager.request_submission_consent(
            user_id=sample_user_id,
            document_id=sample_document_id,
            target_opportunity_id=sample_opportunity_id,
            document_filename="resume.pdf",
            opportunity_title="Senior Python Developer"
        )
        
        # Verify request properties
        assert request.id is not None
        assert request.user_id == sample_user_id
        assert request.action_type == ConsentActionType.DOCUMENT_SUBMIT
        assert request.target == sample_opportunity_id
        assert request.status == ConsentStatus.PENDING
        assert "resume.pdf" in request.action_description
        assert "Senior Python Developer" in request.action_description
        assert len(request.required_data) > 0
        assert request.expires_at > request.created_at
    
    @pytest.mark.asyncio
    async def test_request_consent_empty_user_id(
        self,
        consent_manager,
        sample_document_id,
        sample_opportunity_id
    ):
        """Test consent request with empty user_id raises ValueError."""
        with pytest.raises(ValueError, match="user_id cannot be empty"):
            await consent_manager.request_submission_consent(
                user_id="",
                document_id=sample_document_id,
                target_opportunity_id=sample_opportunity_id,
                document_filename="resume.pdf",
                opportunity_title="Developer"
            )
    
    @pytest.mark.asyncio
    async def test_request_consent_empty_document_id(
        self,
        consent_manager,
        sample_user_id,
        sample_opportunity_id
    ):
        """Test consent request with empty document_id raises ValueError."""
        with pytest.raises(ValueError, match="document_id cannot be empty"):
            await consent_manager.request_submission_consent(
                user_id=sample_user_id,
                document_id="",
                target_opportunity_id=sample_opportunity_id,
                document_filename="resume.pdf",
                opportunity_title="Developer"
            )
    
    @pytest.mark.asyncio
    async def test_request_consent_expiry_time(
        self,
        consent_manager,
        sample_user_id,
        sample_document_id,
        sample_opportunity_id
    ):
        """Test consent request has correct expiry time."""
        request = await consent_manager.request_submission_consent(
            user_id=sample_user_id,
            document_id=sample_document_id,
            target_opportunity_id=sample_opportunity_id,
            document_filename="resume.pdf",
            opportunity_title="Developer"
        )
        
        # Verify expiry is approximately 5 minutes from creation
        expected_expiry = request.created_at + timedelta(minutes=5)
        time_diff = abs((request.expires_at - expected_expiry).total_seconds())
        assert time_diff < 1  # Within 1 second


class TestConsentProcessing:
    """Tests for consent approval and denial."""
    
    @pytest.mark.asyncio
    async def test_process_consent_approval(
        self,
        consent_manager,
        sample_user_id,
        sample_document_id,
        sample_opportunity_id
    ):
        """Test consent approval generates token."""
        # Create consent request
        request = await consent_manager.request_submission_consent(
            user_id=sample_user_id,
            document_id=sample_document_id,
            target_opportunity_id=sample_opportunity_id,
            document_filename="resume.pdf",
            opportunity_title="Developer"
        )
        
        # Approve consent
        response = await consent_manager.process_consent(
            consent_request_id=request.id,
            approved=True,
            user_id=sample_user_id
        )
        
        # Verify response
        assert response.consent_request_id == request.id
        assert response.approved is True
        assert response.consent_token is not None
        assert len(response.consent_token) > 0
        
        # Verify request status updated
        updated_request = consent_manager.get_consent_request(request.id)
        assert updated_request.status == ConsentStatus.APPROVED
    
    @pytest.mark.asyncio
    async def test_process_consent_denial(
        self,
        consent_manager,
        sample_user_id,
        sample_document_id,
        sample_opportunity_id
    ):
        """Test consent denial does not generate token."""
        # Create consent request
        request = await consent_manager.request_submission_consent(
            user_id=sample_user_id,
            document_id=sample_document_id,
            target_opportunity_id=sample_opportunity_id,
            document_filename="resume.pdf",
            opportunity_title="Developer"
        )
        
        # Deny consent
        response = await consent_manager.process_consent(
            consent_request_id=request.id,
            approved=False,
            user_id=sample_user_id
        )
        
        # Verify response
        assert response.consent_request_id == request.id
        assert response.approved is False
        assert response.consent_token is None
        
        # Verify request status updated
        updated_request = consent_manager.get_consent_request(request.id)
        assert updated_request.status == ConsentStatus.DENIED
    
    @pytest.mark.asyncio
    async def test_process_consent_wrong_user(
        self,
        consent_manager,
        sample_user_id,
        sample_document_id,
        sample_opportunity_id
    ):
        """Test processing consent with wrong user raises ValueError."""
        # Create consent request
        request = await consent_manager.request_submission_consent(
            user_id=sample_user_id,
            document_id=sample_document_id,
            target_opportunity_id=sample_opportunity_id,
            document_filename="resume.pdf",
            opportunity_title="Developer"
        )
        
        # Try to process with different user
        with pytest.raises(ValueError, match="does not own"):
            await consent_manager.process_consent(
                consent_request_id=request.id,
                approved=True,
                user_id="different-user-id"
            )
    
    @pytest.mark.asyncio
    async def test_process_consent_already_processed(
        self,
        consent_manager,
        sample_user_id,
        sample_document_id,
        sample_opportunity_id
    ):
        """Test processing consent twice raises ValueError."""
        # Create and approve consent request
        request = await consent_manager.request_submission_consent(
            user_id=sample_user_id,
            document_id=sample_document_id,
            target_opportunity_id=sample_opportunity_id,
            document_filename="resume.pdf",
            opportunity_title="Developer"
        )
        
        await consent_manager.process_consent(
            consent_request_id=request.id,
            approved=True,
            user_id=sample_user_id
        )
        
        # Try to process again
        with pytest.raises(ValueError, match="already processed"):
            await consent_manager.process_consent(
                consent_request_id=request.id,
                approved=True,
                user_id=sample_user_id
            )
    
    @pytest.mark.asyncio
    async def test_process_consent_expired(
        self,
        consent_manager,
        sample_user_id,
        sample_document_id,
        sample_opportunity_id
    ):
        """Test processing expired consent raises ValueError."""
        # Create consent request with short expiry
        short_expiry_manager = ConsentManager(consent_expiry_minutes=0)
        
        request = await short_expiry_manager.request_submission_consent(
            user_id=sample_user_id,
            document_id=sample_document_id,
            target_opportunity_id=sample_opportunity_id,
            document_filename="resume.pdf",
            opportunity_title="Developer"
        )
        
        # Wait a moment to ensure expiry
        import asyncio
        await asyncio.sleep(0.1)
        
        # Try to process expired request
        with pytest.raises(ValueError, match="expired"):
            await short_expiry_manager.process_consent(
                consent_request_id=request.id,
                approved=True,
                user_id=sample_user_id
            )


class TestConsentTokenValidation:
    """Tests for consent token validation (CRITICAL SECURITY)."""
    
    @pytest.mark.asyncio
    async def test_validate_token_success(
        self,
        consent_manager,
        sample_user_id,
        sample_document_id,
        sample_opportunity_id
    ):
        """Test valid token passes validation."""
        # Create and approve consent
        request = await consent_manager.request_submission_consent(
            user_id=sample_user_id,
            document_id=sample_document_id,
            target_opportunity_id=sample_opportunity_id,
            document_filename="resume.pdf",
            opportunity_title="Developer"
        )
        
        response = await consent_manager.process_consent(
            consent_request_id=request.id,
            approved=True,
            user_id=sample_user_id
        )
        
        # Validate token
        is_valid = consent_manager.validate_consent_token(
            consent_token=response.consent_token,
            user_id=sample_user_id,
            action_type=ConsentActionType.DOCUMENT_SUBMIT,
            target=sample_opportunity_id
        )
        
        assert is_valid is True
    
    @pytest.mark.asyncio
    async def test_validate_token_single_use(
        self,
        consent_manager,
        sample_user_id,
        sample_document_id,
        sample_opportunity_id
    ):
        """Test token can only be used once (CRITICAL SECURITY)."""
        # Create and approve consent
        request = await consent_manager.request_submission_consent(
            user_id=sample_user_id,
            document_id=sample_document_id,
            target_opportunity_id=sample_opportunity_id,
            document_filename="resume.pdf",
            opportunity_title="Developer"
        )
        
        response = await consent_manager.process_consent(
            consent_request_id=request.id,
            approved=True,
            user_id=sample_user_id
        )
        
        # First validation should succeed
        is_valid_first = consent_manager.validate_consent_token(
            consent_token=response.consent_token,
            user_id=sample_user_id,
            action_type=ConsentActionType.DOCUMENT_SUBMIT,
            target=sample_opportunity_id
        )
        assert is_valid_first is True
        
        # Second validation should fail (token already used)
        is_valid_second = consent_manager.validate_consent_token(
            consent_token=response.consent_token,
            user_id=sample_user_id,
            action_type=ConsentActionType.DOCUMENT_SUBMIT,
            target=sample_opportunity_id
        )
        assert is_valid_second is False
    
    def test_validate_token_empty_token(self, consent_manager, sample_user_id, sample_opportunity_id):
        """Test validation with empty token fails."""
        is_valid = consent_manager.validate_consent_token(
            consent_token="",
            user_id=sample_user_id,
            action_type=ConsentActionType.DOCUMENT_SUBMIT,
            target=sample_opportunity_id
        )
        assert is_valid is False
    
    def test_validate_token_invalid_token(self, consent_manager, sample_user_id, sample_opportunity_id):
        """Test validation with invalid token fails."""
        is_valid = consent_manager.validate_consent_token(
            consent_token="invalid_token_123",
            user_id=sample_user_id,
            action_type=ConsentActionType.DOCUMENT_SUBMIT,
            target=sample_opportunity_id
        )
        assert is_valid is False
    
    @pytest.mark.asyncio
    async def test_validate_token_wrong_user(
        self,
        consent_manager,
        sample_user_id,
        sample_document_id,
        sample_opportunity_id
    ):
        """Test validation with wrong user fails."""
        # Create and approve consent
        request = await consent_manager.request_submission_consent(
            user_id=sample_user_id,
            document_id=sample_document_id,
            target_opportunity_id=sample_opportunity_id,
            document_filename="resume.pdf",
            opportunity_title="Developer"
        )
        
        response = await consent_manager.process_consent(
            consent_request_id=request.id,
            approved=True,
            user_id=sample_user_id
        )
        
        # Try to validate with different user
        is_valid = consent_manager.validate_consent_token(
            consent_token=response.consent_token,
            user_id="different-user-id",
            action_type=ConsentActionType.DOCUMENT_SUBMIT,
            target=sample_opportunity_id
        )
        assert is_valid is False
    
    @pytest.mark.asyncio
    async def test_validate_token_wrong_action_type(
        self,
        consent_manager,
        sample_user_id,
        sample_document_id,
        sample_opportunity_id
    ):
        """Test validation with wrong action type fails."""
        # Create and approve consent
        request = await consent_manager.request_submission_consent(
            user_id=sample_user_id,
            document_id=sample_document_id,
            target_opportunity_id=sample_opportunity_id,
            document_filename="resume.pdf",
            opportunity_title="Developer"
        )
        
        response = await consent_manager.process_consent(
            consent_request_id=request.id,
            approved=True,
            user_id=sample_user_id
        )
        
        # Try to validate with different action type
        is_valid = consent_manager.validate_consent_token(
            consent_token=response.consent_token,
            user_id=sample_user_id,
            action_type=ConsentActionType.DATA_SHARE,  # Wrong action type
            target=sample_opportunity_id
        )
        assert is_valid is False
    
    @pytest.mark.asyncio
    async def test_validate_token_wrong_target(
        self,
        consent_manager,
        sample_user_id,
        sample_document_id,
        sample_opportunity_id
    ):
        """Test validation with wrong target fails."""
        # Create and approve consent
        request = await consent_manager.request_submission_consent(
            user_id=sample_user_id,
            document_id=sample_document_id,
            target_opportunity_id=sample_opportunity_id,
            document_filename="resume.pdf",
            opportunity_title="Developer"
        )
        
        response = await consent_manager.process_consent(
            consent_request_id=request.id,
            approved=True,
            user_id=sample_user_id
        )
        
        # Try to validate with different target
        is_valid = consent_manager.validate_consent_token(
            consent_token=response.consent_token,
            user_id=sample_user_id,
            action_type=ConsentActionType.DOCUMENT_SUBMIT,
            target="different-opportunity-id"  # Wrong target
        )
        assert is_valid is False


class TestConsentTokenGeneration:
    """Tests for consent token generation."""
    
    @pytest.mark.asyncio
    async def test_generate_token_format(
        self,
        consent_manager,
        sample_user_id,
        sample_document_id,
        sample_opportunity_id
    ):
        """Test generated token has correct format."""
        request = await consent_manager.request_submission_consent(
            user_id=sample_user_id,
            document_id=sample_document_id,
            target_opportunity_id=sample_opportunity_id,
            document_filename="resume.pdf",
            opportunity_title="Developer"
        )
        
        token = consent_manager.generate_consent_token(request)
        
        # Token should be hex string
        assert isinstance(token, str)
        assert len(token) > 0
        # Should be valid hex
        try:
            int(token, 16)
        except ValueError:
            pytest.fail("Token is not valid hex string")
    
    @pytest.mark.asyncio
    async def test_generate_token_uniqueness(
        self,
        consent_manager,
        sample_user_id,
        sample_document_id,
        sample_opportunity_id
    ):
        """Test each generated token is unique."""
        # Create two consent requests
        request1 = await consent_manager.request_submission_consent(
            user_id=sample_user_id,
            document_id=sample_document_id,
            target_opportunity_id=sample_opportunity_id,
            document_filename="resume.pdf",
            opportunity_title="Developer"
        )
        
        request2 = await consent_manager.request_submission_consent(
            user_id=sample_user_id,
            document_id=sample_document_id,
            target_opportunity_id=sample_opportunity_id,
            document_filename="resume.pdf",
            opportunity_title="Developer"
        )
        
        # Generate tokens
        token1 = consent_manager.generate_consent_token(request1)
        token2 = consent_manager.generate_consent_token(request2)
        
        # Tokens should be different
        assert token1 != token2
