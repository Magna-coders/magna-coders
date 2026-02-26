"""Document management system for Magna AI Agent.

This module provides document management capabilities including upload,
retrieval, and submission with consent enforcement.

**Validates: Requirements 5.1, 5.5**
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from ..tools.document_upload_tool import DocumentUploadTool
from .consent import ConsentManager
from .models import (
    ConsentActionType,
    Document,
    DocumentMetadata,
    DocumentSubmission,
    DocumentType,
    SubmissionResult,
    SubmissionStatus,
)

logger = logging.getLogger(__name__)


class DocumentManager:
    """Manages document uploads and retrieval with S3 integration.
    
    This class provides high-level document management operations including:
    - Uploading documents to S3 storage
    - Retrieving user's uploaded documents
    - Validating document formats and sizes
    - Tracking document metadata
    
    The DocumentManager uses the DocumentUploadTool for S3 integration
    and maintains document metadata for easy retrieval.
    """
    
    def __init__(
        self,
        upload_tool: Optional[DocumentUploadTool] = None,
        consent_manager: Optional[ConsentManager] = None,
        max_file_size_mb: int = 10
    ):
        """Initialize the document manager.
        
        Args:
            upload_tool: DocumentUploadTool instance for S3 uploads.
                        If None, creates a new instance with default config.
            consent_manager: ConsentManager instance for consent enforcement.
                           If None, creates a new instance with default config.
            max_file_size_mb: Maximum file size in megabytes (default: 10MB)
        """
        self._upload_tool = upload_tool or DocumentUploadTool()
        self._consent_manager = consent_manager or ConsentManager()
        self._max_file_size_mb = max_file_size_mb
        self._max_file_size_bytes = max_file_size_mb * 1024 * 1024
        
        # In-memory storage for document metadata (in production, use database)
        self._documents: Dict[str, Document] = {}
        self._user_documents: Dict[str, List[str]] = {}  # user_id -> [document_ids]
        self._submissions: Dict[str, DocumentSubmission] = {}  # submission_id -> submission
        
        logger.info(
            f"DocumentManager initialized with max file size: {max_file_size_mb}MB"
        )
    
    async def upload_document(
        self,
        user_id: str,
        file_data: bytes,
        filename: str,
        document_type: DocumentType
    ) -> DocumentMetadata:
        """Upload document to S3 storage.
        
        This method validates the document format and size, uploads it to S3
        using the DocumentUploadTool, and stores the metadata for retrieval.
        
        Args:
            user_id: UUID of the user uploading the document
            file_data: Raw file content as bytes
            filename: Original filename with extension
            document_type: Type of document (RESUME, COVER_LETTER, PORTFOLIO)
            
        Returns:
            DocumentMetadata containing document ID, S3 URL, and other metadata
            
        Raises:
            ValueError: If parameters are invalid or file validation fails
            RuntimeError: If S3 upload fails
            
        **Validates: Requirements 5.1, 5.5**
        """
        # Validate inputs
        if not user_id or not user_id.strip():
            raise ValueError("user_id cannot be empty")
        
        if not filename or not filename.strip():
            raise ValueError("filename cannot be empty")
        
        if not file_data:
            raise ValueError("file_data cannot be empty")
        
        # Validate file size
        file_size = len(file_data)
        if file_size > self._max_file_size_bytes:
            size_mb = file_size / (1024 * 1024)
            raise ValueError(
                f"File size {size_mb:.2f}MB exceeds limit of {self._max_file_size_mb}MB. "
                f"Please compress the file or upload a smaller version."
            )
        
        if file_size == 0:
            raise ValueError("File is empty (0 bytes)")
        
        # Validate document type
        if not isinstance(document_type, DocumentType):
            try:
                document_type = DocumentType(document_type)
            except ValueError:
                valid_types = [dt.value for dt in DocumentType]
                raise ValueError(
                    f"Invalid document_type. Must be one of: {valid_types}"
                )
        
        logger.info(
            f"Uploading document: user={user_id}, type={document_type.value}, "
            f"filename={filename}, size={file_size} bytes"
        )
        
        try:
            # Encode file data to base64 for tool
            import base64
            file_data_base64 = base64.b64encode(file_data).decode('utf-8')
            
            # Upload using DocumentUploadTool
            result = await self._upload_tool.execute(
                user_id=user_id,
                file_data=file_data_base64,
                filename=filename,
                document_type=document_type.value
            )
            
            if not result.success:
                error_msg = result.error or "Unknown upload error"
                logger.error(f"Document upload failed: {error_msg}")
                raise RuntimeError(f"Failed to upload document: {error_msg}")
            
            # Extract metadata from tool result
            tool_data = result.data
            
            # Create Document object
            document = Document(
                id=tool_data['document_id'],
                user_id=user_id,
                filename=filename,
                document_type=document_type,
                file_size_bytes=file_size,
                mime_type=tool_data['mime_type'],
                s3_url=tool_data['s3_url'],
                s3_key=tool_data['s3_key'],
                s3_bucket=tool_data['s3_bucket'],
                file_hash=tool_data['file_hash'],
                uploaded_at=datetime.fromisoformat(tool_data['uploaded_at']),
                last_modified=datetime.now(timezone.utc)
            )
            
            # Store document metadata
            self._documents[document.id] = document
            
            # Track user's documents
            if user_id not in self._user_documents:
                self._user_documents[user_id] = []
            self._user_documents[user_id].append(document.id)
            
            logger.info(
                f"Document uploaded successfully: document_id={document.id}, "
                f"user={user_id}, url={document.s3_url}"
            )
            
            # Return metadata
            return DocumentMetadata(
                document_id=document.id,
                user_id=user_id,
                filename=filename,
                document_type=document_type,
                file_size_bytes=file_size,
                mime_type=document.mime_type,
                s3_url=document.s3_url,
                uploaded_at=document.uploaded_at
            )
        
        except Exception as e:
            logger.error(f"Document upload failed: {str(e)}", exc_info=True)
            raise
    
    async def get_user_documents(
        self,
        user_id: str,
        document_type: Optional[DocumentType] = None
    ) -> List[DocumentMetadata]:
        """Retrieve user's uploaded documents.
        
        This method returns a list of all documents uploaded by the user,
        optionally filtered by document type.
        
        Args:
            user_id: UUID of the user
            document_type: Optional filter by document type
            
        Returns:
            List of DocumentMetadata for user's documents, sorted by upload date
            (most recent first)
            
        **Validates: Requirements 5.1**
        """
        if not user_id or not user_id.strip():
            raise ValueError("user_id cannot be empty")
        
        # Get user's document IDs
        document_ids = self._user_documents.get(user_id, [])
        
        # Retrieve documents
        documents = []
        for doc_id in document_ids:
            doc = self._documents.get(doc_id)
            if doc:
                # Apply type filter if specified
                if document_type is None or doc.document_type == document_type:
                    documents.append(doc)
        
        # Sort by upload date (most recent first)
        documents.sort(key=lambda d: d.uploaded_at, reverse=True)
        
        # Convert to metadata
        metadata_list = [
            DocumentMetadata(
                document_id=doc.id,
                user_id=doc.user_id,
                filename=doc.filename,
                document_type=doc.document_type,
                file_size_bytes=doc.file_size_bytes,
                mime_type=doc.mime_type,
                s3_url=doc.s3_url,
                uploaded_at=doc.uploaded_at
            )
            for doc in documents
        ]
        
        logger.info(
            f"Retrieved {len(metadata_list)} documents for user={user_id}, "
            f"type_filter={document_type.value if document_type else 'all'}"
        )
        
        return metadata_list
    
    def get_document(self, document_id: str) -> Optional[Document]:
        """Get document by ID.
        
        Args:
            document_id: UUID of the document
            
        Returns:
            Document object if found, None otherwise
        """
        return self._documents.get(document_id)
    
    async def submit_document(
        self,
        user_id: str,
        document_id: str,
        target_opportunity_id: str,
        consent_token: str
    ) -> SubmissionResult:
        """Submit document to an opportunity with consent enforcement.
        
        This method submits a user's document to a target opportunity.
        It REQUIRES a valid consent token to proceed - this is a critical
        security requirement to ensure users explicitly approve each submission.
        
        The consent flow must be:
        1. Agent calls request_submission_consent() to create consent request
        2. User approves the consent request
        3. System generates consent token
        4. Agent calls this method with the consent token
        5. System validates token and performs submission
        
        Args:
            user_id: UUID of the user submitting the document
            document_id: UUID of the document to submit
            target_opportunity_id: UUID of the target opportunity
            consent_token: Valid consent token from approved consent request
            
        Returns:
            SubmissionResult with success status and submission details
            
        **Validates: Requirements 5.2, 5.6 (CRITICAL SECURITY)**
        """
        # Validate inputs
        if not user_id or not user_id.strip():
            return SubmissionResult(
                success=False,
                error="user_id cannot be empty"
            )
        
        if not document_id or not document_id.strip():
            return SubmissionResult(
                success=False,
                error="document_id cannot be empty"
            )
        
        if not target_opportunity_id or not target_opportunity_id.strip():
            return SubmissionResult(
                success=False,
                error="target_opportunity_id cannot be empty"
            )
        
        if not consent_token or not consent_token.strip():
            logger.warning(
                f"Document submission attempted without consent token: "
                f"user={user_id}, document={document_id}"
            )
            return SubmissionResult(
                success=False,
                error=(
                    "Cannot submit document without your consent. "
                    "Please approve the consent request to proceed."
                )
            )
        
        # CRITICAL: Validate consent token before proceeding
        # This enforces Requirements 5.2 and 12.5
        is_valid = self._consent_manager.validate_consent_token(
            consent_token=consent_token,
            user_id=user_id,
            action_type=ConsentActionType.DOCUMENT_SUBMIT,
            target=target_opportunity_id
        )
        
        if not is_valid:
            logger.warning(
                f"Invalid consent token for document submission: "
                f"user={user_id}, document={document_id}, opportunity={target_opportunity_id}"
            )
            return SubmissionResult(
                success=False,
                error=(
                    "Invalid or expired consent token. "
                    "Please request a new consent approval."
                )
            )
        
        # Consent validated - proceed with submission
        logger.info(
            f"Consent validated for document submission: "
            f"user={user_id}, document={document_id}, opportunity={target_opportunity_id}"
        )
        
        # Verify document exists and belongs to user
        document = self._documents.get(document_id)
        if not document:
            return SubmissionResult(
                success=False,
                error=f"Document not found: {document_id}"
            )
        
        if document.user_id != user_id:
            logger.warning(
                f"User attempted to submit document they don't own: "
                f"user={user_id}, document_owner={document.user_id}, document={document_id}"
            )
            return SubmissionResult(
                success=False,
                error="You can only submit your own documents"
            )
        
        try:
            # Create submission record
            submission_id = str(uuid4())
            submitted_at = datetime.now(timezone.utc)
            
            # In production, this would call the opportunity API to actually submit
            # For now, we just record the submission
            submission = DocumentSubmission(
                id=submission_id,
                document_id=document_id,
                opportunity_id=target_opportunity_id,
                user_id=user_id,
                submitted_at=submitted_at,
                consent_token=consent_token,
                status=SubmissionStatus.SUBMITTED,
                confirmation=(
                    f"Document '{document.filename}' successfully submitted to opportunity "
                    f"{target_opportunity_id} at {submitted_at.isoformat()}"
                )
            )
            
            # Store submission
            self._submissions[submission_id] = submission
            
            logger.info(
                f"Document submitted successfully: submission_id={submission_id}, "
                f"user={user_id}, document={document_id}, opportunity={target_opportunity_id}"
            )
            
            # Return success result with confirmation
            return SubmissionResult(
                success=True,
                submission_id=submission_id,
                document_id=document_id,
                opportunity_id=target_opportunity_id,
                submitted_at=submitted_at,
                confirmation=submission.confirmation
            )
        
        except Exception as e:
            error_msg = f"Document submission failed: {str(e)}"
            logger.error(error_msg, exc_info=True)
            
            # Create failed submission record
            submission_id = str(uuid4())
            submission = DocumentSubmission(
                id=submission_id,
                document_id=document_id,
                opportunity_id=target_opportunity_id,
                user_id=user_id,
                submitted_at=datetime.now(timezone.utc),
                consent_token=consent_token,
                status=SubmissionStatus.FAILED,
                confirmation=None
            )
            self._submissions[submission_id] = submission
            
            return SubmissionResult(
                success=False,
                submission_id=submission_id,
                document_id=document_id,
                opportunity_id=target_opportunity_id,
                error=error_msg
            )
    
    def get_submission(self, submission_id: str) -> Optional[DocumentSubmission]:
        """Get submission record by ID.
        
        Args:
            submission_id: UUID of the submission
            
        Returns:
            DocumentSubmission if found, None otherwise
        """
        return self._submissions.get(submission_id)
