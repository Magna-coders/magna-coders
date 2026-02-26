"""Consent management system for document submissions.

This module provides consent management capabilities to ensure that all
document submissions and data modifications require explicit user approval.

**Validates: Requirements 5.2, 5.3, 5.4, 12.5**
"""

import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional
from uuid import uuid4

from .models import (
    ConsentActionType,
    ConsentRequest,
    ConsentResponse,
    ConsentStatus,
)

logger = logging.getLogger(__name__)


class ConsentManager:
    """Manages user consent for document submissions and data actions.
    
    This class implements a secure consent flow to ensure that the agent
    never performs sensitive actions (like document submission) without
    explicit user approval. The consent flow follows these steps:
    
    1. Agent identifies need for consent (e.g., document submission)
    2. Agent calls request_submission_consent() to create consent request
    3. System presents consent request to user with action details
    4. User approves or denies the request
    5. System calls process_consent() with user's decision
    6. If approved, system generates secure consent token
    7. Agent calls action with consent token
    8. System validates token before executing action
    
    This ensures that:
    - Users always know what actions will be performed
    - Users explicitly approve each sensitive action
    - Tokens are single-use and time-limited
    - No action can bypass consent requirement
    
    **CRITICAL SECURITY**: This class enforces the consent requirement
    specified in Requirements 5.2 and 12.5. Never allow document submission
    or data modification without a valid consent token.
    """
    
    def __init__(
        self,
        consent_expiry_minutes: int = 5,
        token_length: int = 32
    ):
        """Initialize the consent manager.
        
        Args:
            consent_expiry_minutes: Minutes until consent request expires (default: 5)
            token_length: Length of consent token in bytes (default: 32)
        """
        self._consent_expiry_minutes = consent_expiry_minutes
        self._token_length = token_length
        
        # In-memory storage for consent requests and tokens
        # In production, use database with proper indexing
        self._consent_requests: Dict[str, ConsentRequest] = {}
        self._consent_tokens: Dict[str, ConsentRequest] = {}  # token -> request
        self._user_consents: Dict[str, list[str]] = {}  # user_id -> [request_ids]
        
        logger.info(
            f"ConsentManager initialized with expiry: {consent_expiry_minutes} minutes"
        )
    
    async def request_submission_consent(
        self,
        user_id: str,
        document_id: str,
        target_opportunity_id: str,
        document_filename: str,
        opportunity_title: str
    ) -> ConsentRequest:
        """Generate consent request for document submission.
        
        This method creates a consent request that must be presented to the
        user for approval before the document can be submitted. The request
        includes clear description of what will be done and what data will
        be shared.
        
        Args:
            user_id: UUID of the user
            document_id: UUID of the document to submit
            target_opportunity_id: UUID of the target opportunity
            document_filename: Name of the document file
            opportunity_title: Title of the opportunity
            
        Returns:
            ConsentRequest object with pending status
            
        **Validates: Requirements 5.3**
        """
        if not user_id or not user_id.strip():
            raise ValueError("user_id cannot be empty")
        
        if not document_id or not document_id.strip():
            raise ValueError("document_id cannot be empty")
        
        if not target_opportunity_id or not target_opportunity_id.strip():
            raise ValueError("target_opportunity_id cannot be empty")
        
        # Generate consent request ID
        request_id = str(uuid4())
        
        # Create action description
        action_description = (
            f"Submit document '{document_filename}' to opportunity '{opportunity_title}'. "
            f"This will share your document with the opportunity poster."
        )
        
        # Specify required data
        required_data = [
            "document_content",
            "document_filename",
            "user_profile_summary"
        ]
        
        # Calculate expiry time
        created_at = datetime.now(timezone.utc)
        expires_at = created_at + timedelta(minutes=self._consent_expiry_minutes)
        
        # Create consent request
        consent_request = ConsentRequest(
            id=request_id,
            user_id=user_id,
            action_type=ConsentActionType.DOCUMENT_SUBMIT,
            action_description=action_description,
            required_data=required_data,
            target=target_opportunity_id,
            created_at=created_at,
            expires_at=expires_at,
            status=ConsentStatus.PENDING
        )
        
        # Store consent request
        self._consent_requests[request_id] = consent_request
        
        # Track user's consent requests
        if user_id not in self._user_consents:
            self._user_consents[user_id] = []
        self._user_consents[user_id].append(request_id)
        
        logger.info(
            f"Consent request created: request_id={request_id}, user={user_id}, "
            f"document={document_id}, opportunity={target_opportunity_id}, "
            f"expires_at={expires_at.isoformat()}"
        )
        
        return consent_request
    
    async def process_consent(
        self,
        consent_request_id: str,
        approved: bool,
        user_id: str
    ) -> ConsentResponse:
        """Process user's consent decision.
        
        This method handles the user's approval or denial of a consent request.
        If approved, it generates a secure single-use token that can be used
        to execute the action. If denied, it marks the request as denied and
        no token is generated.
        
        Args:
            consent_request_id: UUID of the consent request
            approved: True if user approved, False if denied
            user_id: UUID of the user (for verification)
            
        Returns:
            ConsentResponse with token if approved, None if denied
            
        Raises:
            ValueError: If request not found, expired, or user mismatch
            
        **Validates: Requirements 5.3, 5.4**
        """
        if not consent_request_id or not consent_request_id.strip():
            raise ValueError("consent_request_id cannot be empty")
        
        if not user_id or not user_id.strip():
            raise ValueError("user_id cannot be empty")
        
        # Retrieve consent request
        consent_request = self._consent_requests.get(consent_request_id)
        if not consent_request:
            raise ValueError(f"Consent request not found: {consent_request_id}")
        
        # Verify user owns this consent request
        if consent_request.user_id != user_id:
            logger.warning(
                f"User mismatch for consent request: request_user={consent_request.user_id}, "
                f"provided_user={user_id}"
            )
            raise ValueError("User does not own this consent request")
        
        # Check if already processed
        if consent_request.status != ConsentStatus.PENDING:
            raise ValueError(
                f"Consent request already processed with status: {consent_request.status.value}"
            )
        
        # Check if expired
        now = datetime.now(timezone.utc)
        if now > consent_request.expires_at:
            consent_request.status = ConsentStatus.EXPIRED
            logger.info(f"Consent request expired: request_id={consent_request_id}")
            raise ValueError(
                f"Consent request expired at {consent_request.expires_at.isoformat()}"
            )
        
        timestamp = datetime.now(timezone.utc)
        
        if approved:
            # User approved - generate consent token
            consent_token = self.generate_consent_token(consent_request)
            
            # Update request status
            consent_request.status = ConsentStatus.APPROVED
            
            # Store token mapping
            self._consent_tokens[consent_token] = consent_request
            
            logger.info(
                f"Consent approved: request_id={consent_request_id}, user={user_id}, "
                f"token_generated=True"
            )
            
            return ConsentResponse(
                consent_request_id=consent_request_id,
                approved=True,
                consent_token=consent_token,
                timestamp=timestamp
            )
        else:
            # User denied - no token generated
            consent_request.status = ConsentStatus.DENIED
            
            logger.info(
                f"Consent denied: request_id={consent_request_id}, user={user_id}"
            )
            
            return ConsentResponse(
                consent_request_id=consent_request_id,
                approved=False,
                consent_token=None,
                timestamp=timestamp
            )
    
    def generate_consent_token(self, consent_request: ConsentRequest) -> str:
        """Generate secure consent token for approved request.
        
        This method generates a cryptographically secure token that can be
        used to execute the approved action. The token is:
        - Cryptographically random (using secrets module)
        - Single-use (invalidated after use)
        - Time-limited (expires with the consent request)
        - Bound to specific action and user
        
        Args:
            consent_request: The approved consent request
            
        Returns:
            Secure consent token (hex string)
            
        **Validates: Requirements 5.3**
        """
        # Generate cryptographically secure random token
        random_bytes = secrets.token_bytes(self._token_length)
        
        # Create token with request binding
        # Format: random_bytes + hash(request_id + user_id + action_type)
        binding_data = (
            f"{consent_request.id}:{consent_request.user_id}:"
            f"{consent_request.action_type.value}:{consent_request.target}"
        )
        binding_hash = hashlib.sha256(binding_data.encode()).digest()[:16]
        
        # Combine random bytes with binding hash
        token_bytes = random_bytes + binding_hash
        consent_token = token_bytes.hex()
        
        logger.debug(
            f"Generated consent token: request_id={consent_request.id}, "
            f"token_length={len(consent_token)}"
        )
        
        return consent_token
    
    def validate_consent_token(
        self,
        consent_token: str,
        user_id: str,
        action_type: ConsentActionType,
        target: str
    ) -> bool:
        """Validate consent token before executing action.
        
        This method validates that:
        1. Token exists and is valid
        2. Token matches the user, action type, and target
        3. Consent request is approved and not expired
        4. Token has not been used before (single-use)
        
        After successful validation, the token is invalidated to prevent reuse.
        
        Args:
            consent_token: The consent token to validate
            user_id: UUID of the user performing the action
            action_type: Type of action being performed
            target: Target of the action (e.g., opportunity ID)
            
        Returns:
            True if token is valid and action is authorized, False otherwise
            
        **Validates: Requirements 5.2, 12.5 (CRITICAL SECURITY)**
        """
        if not consent_token or not consent_token.strip():
            logger.warning("Empty consent token provided")
            return False
        
        # Retrieve consent request for token
        consent_request = self._consent_tokens.get(consent_token)
        if not consent_request:
            logger.warning(f"Invalid consent token: token not found")
            return False
        
        # Verify user matches
        if consent_request.user_id != user_id:
            logger.warning(
                f"User mismatch for consent token: request_user={consent_request.user_id}, "
                f"provided_user={user_id}"
            )
            return False
        
        # Verify action type matches
        if consent_request.action_type != action_type:
            logger.warning(
                f"Action type mismatch: request_action={consent_request.action_type.value}, "
                f"provided_action={action_type.value}"
            )
            return False
        
        # Verify target matches
        if consent_request.target != target:
            logger.warning(
                f"Target mismatch: request_target={consent_request.target}, "
                f"provided_target={target}"
            )
            return False
        
        # Verify status is approved
        if consent_request.status != ConsentStatus.APPROVED:
            logger.warning(
                f"Consent not approved: status={consent_request.status.value}"
            )
            return False
        
        # Check if expired
        now = datetime.now(timezone.utc)
        if now > consent_request.expires_at:
            logger.warning(
                f"Consent token expired: expires_at={consent_request.expires_at.isoformat()}"
            )
            # Mark as expired
            consent_request.status = ConsentStatus.EXPIRED
            # Remove token
            del self._consent_tokens[consent_token]
            return False
        
        # Token is valid - invalidate it (single-use)
        logger.info(
            f"Consent token validated and invalidated: request_id={consent_request.id}, "
            f"user={user_id}, action={action_type.value}, target={target}"
        )
        
        # Remove token to prevent reuse
        del self._consent_tokens[consent_token]
        
        return True
    
    def get_consent_request(self, consent_request_id: str) -> Optional[ConsentRequest]:
        """Get consent request by ID.
        
        Args:
            consent_request_id: UUID of the consent request
            
        Returns:
            ConsentRequest if found, None otherwise
        """
        return self._consent_requests.get(consent_request_id)
    
    def get_user_consent_requests(
        self,
        user_id: str,
        status: Optional[ConsentStatus] = None
    ) -> list[ConsentRequest]:
        """Get all consent requests for a user.
        
        Args:
            user_id: UUID of the user
            status: Optional filter by status
            
        Returns:
            List of ConsentRequest objects, sorted by creation date (newest first)
        """
        request_ids = self._user_consents.get(user_id, [])
        
        requests = []
        for request_id in request_ids:
            request = self._consent_requests.get(request_id)
            if request:
                # Apply status filter if specified
                if status is None or request.status == status:
                    requests.append(request)
        
        # Sort by creation date (newest first)
        requests.sort(key=lambda r: r.created_at, reverse=True)
        
        return requests
