"""Unit tests for DocumentManager.

Tests document upload, retrieval, and submission with consent enforcement.
"""

import base64
import pytest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, Mock, patch

from ...documents import (
    ConsentManager,
    DocumentManager,
    DocumentType,
    SubmissionResult,
)
from ...tools.base import ToolResult


@pytest.fixture
def mock_upload_tool():
    """Create mock DocumentUploadTool."""
    tool = Mock()
    tool.execute = AsyncMock()
    return tool


@pytest.fixture
def mock_consent_manager():
    """Create mock ConsentManager."""
    manager = Mock(spec=ConsentManager)
    manager.validate_consent_token = Mock()
    return manager


@pytest.fixture
def document_manager(mock_upload_tool, mock_consent_manager):
    """Create DocumentManager with mocked dependencies."""
    return DocumentManager(
        upload_tool=mock_upload_tool,
        consent_manager=mock_consent_manager,
        max_file_size_mb=10
    )


@pytest.fixture
def sample_file_data():
    """Sample file content."""
    return b"This is a test resume document.\nName: John Doe\nSkills: Python, JavaScript"


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


class TestDocumentManagerUpload:
    """Tests for document upload functionality."""
    
    @pytest.mark.asyncio
    async def test_upload_document_success(
        self,
        document_manager,
        mock_upload_tool,
        sample_file_data,
        sample_user_id,
        sample_document_id
    ):
        """Test successful document upload."""
        # Setup mock response
        mock_upload_tool.execute.return_value = ToolResult(
            success=True,
            data={
                'document_id': sample_document_id,
                'user_id': sample_user_id,
                'filename': 'resume.txt',
                'document_type': 'RESUME',
                'file_size_bytes': len(sample_file_data),
                'mime_type': 'text/plain',
                's3_url': f'https://bucket.s3.region.amazonaws.com/documents/{sample_user_id}/resume/{sample_document_id}_resume.txt',
                's3_key': f'documents/{sample_user_id}/resume/{sample_document_id}_resume.txt',
                's3_bucket': 'bucket',
                'file_hash': 'abc123',
                'uploaded_at': datetime.now(timezone.utc).isoformat()
            }
        )
        
        # Upload document
        metadata = await document_manager.upload_document(
            user_id=sample_user_id,
            file_data=sample_file_data,
            filename='resume.txt',
            document_type=DocumentType.RESUME
        )
        
        # Verify result
        assert metadata.document_id == sample_document_id
        assert metadata.user_id == sample_user_id
        assert metadata.filename == 'resume.txt'
        assert metadata.document_type == DocumentType.RESUME
        assert metadata.file_size_bytes == len(sample_file_data)
        
        # Verify tool was called
        mock_upload_tool.execute.assert_called_once()
        call_args = mock_upload_tool.execute.call_args[1]
        assert call_args['user_id'] == sample_user_id
        assert call_args['filename'] == 'resume.txt'
        assert call_args['document_type'] == 'RESUME'
    
    @pytest.mark.asyncio
    async def test_upload_document_empty_user_id(
        self,
        document_manager,
        sample_file_data
    ):
        """Test upload with empty user_id raises ValueError."""
        with pytest.raises(ValueError, match="user_id cannot be empty"):
            await document_manager.upload_document(
                user_id="",
                file_data=sample_file_data,
                filename='resume.txt',
                document_type=DocumentType.RESUME
            )
    
    @pytest.mark.asyncio
    async def test_upload_document_empty_filename(
        self,
        document_manager,
        sample_file_data,
        sample_user_id
    ):
        """Test upload with empty filename raises ValueError."""
        with pytest.raises(ValueError, match="filename cannot be empty"):
            await document_manager.upload_document(
                user_id=sample_user_id,
                file_data=sample_file_data,
                filename="",
                document_type=DocumentType.RESUME
            )
    
    @pytest.mark.asyncio
    async def test_upload_document_empty_file_data(
        self,
        document_manager,
        sample_user_id
    ):
        """Test upload with empty file_data raises ValueError."""
        with pytest.raises(ValueError, match="file_data cannot be empty"):
            await document_manager.upload_document(
                user_id=sample_user_id,
                file_data=b"",
                filename='resume.txt',
                document_type=DocumentType.RESUME
            )
    
    @pytest.mark.asyncio
    async def test_upload_document_file_too_large(
        self,
        document_manager,
        sample_user_id
    ):
        """Test upload with file exceeding size limit raises ValueError."""
        # Create file larger than 10MB
        large_file = b"x" * (11 * 1024 * 1024)
        
        with pytest.raises(ValueError, match="exceeds limit"):
            await document_manager.upload_document(
                user_id=sample_user_id,
                file_data=large_file,
                filename='large_resume.txt',
                document_type=DocumentType.RESUME
            )
    
    @pytest.mark.asyncio
    async def test_upload_document_tool_failure(
        self,
        document_manager,
        mock_upload_tool,
        sample_file_data,
        sample_user_id
    ):
        """Test upload when tool fails raises RuntimeError."""
        # Setup mock to return failure
        mock_upload_tool.execute.return_value = ToolResult(
            success=False,
            error="S3 upload failed"
        )
        
        with pytest.raises(RuntimeError, match="Failed to upload document"):
            await document_manager.upload_document(
                user_id=sample_user_id,
                file_data=sample_file_data,
                filename='resume.txt',
                document_type=DocumentType.RESUME
            )


class TestDocumentManagerRetrieval:
    """Tests for document retrieval functionality."""
    
    @pytest.mark.asyncio
    async def test_get_user_documents_empty(
        self,
        document_manager,
        sample_user_id
    ):
        """Test retrieving documents for user with no documents."""
        documents = await document_manager.get_user_documents(sample_user_id)
        assert documents == []
    
    @pytest.mark.asyncio
    async def test_get_user_documents_with_documents(
        self,
        document_manager,
        mock_upload_tool,
        sample_file_data,
        sample_user_id,
        sample_document_id
    ):
        """Test retrieving documents after upload."""
        # Setup mock
        mock_upload_tool.execute.return_value = ToolResult(
            success=True,
            data={
                'document_id': sample_document_id,
                'user_id': sample_user_id,
                'filename': 'resume.txt',
                'document_type': 'RESUME',
                'file_size_bytes': len(sample_file_data),
                'mime_type': 'text/plain',
                's3_url': 'https://bucket.s3.region.amazonaws.com/doc.txt',
                's3_key': 'documents/user/resume/doc.txt',
                's3_bucket': 'bucket',
                'file_hash': 'abc123',
                'uploaded_at': datetime.now(timezone.utc).isoformat()
            }
        )
        
        # Upload document
        await document_manager.upload_document(
            user_id=sample_user_id,
            file_data=sample_file_data,
            filename='resume.txt',
            document_type=DocumentType.RESUME
        )
        
        # Retrieve documents
        documents = await document_manager.get_user_documents(sample_user_id)
        
        assert len(documents) == 1
        assert documents[0].document_id == sample_document_id
        assert documents[0].filename == 'resume.txt'
    
    @pytest.mark.asyncio
    async def test_get_user_documents_filtered_by_type(
        self,
        document_manager,
        mock_upload_tool,
        sample_file_data,
        sample_user_id
    ):
        """Test retrieving documents filtered by type."""
        # Upload resume
        mock_upload_tool.execute.return_value = ToolResult(
            success=True,
            data={
                'document_id': 'doc1',
                'user_id': sample_user_id,
                'filename': 'resume.txt',
                'document_type': 'RESUME',
                'file_size_bytes': len(sample_file_data),
                'mime_type': 'text/plain',
                's3_url': 'https://bucket.s3.region.amazonaws.com/resume.txt',
                's3_key': 'documents/user/resume/resume.txt',
                's3_bucket': 'bucket',
                'file_hash': 'abc123',
                'uploaded_at': datetime.now(timezone.utc).isoformat()
            }
        )
        await document_manager.upload_document(
            user_id=sample_user_id,
            file_data=sample_file_data,
            filename='resume.txt',
            document_type=DocumentType.RESUME
        )
        
        # Upload cover letter
        mock_upload_tool.execute.return_value = ToolResult(
            success=True,
            data={
                'document_id': 'doc2',
                'user_id': sample_user_id,
                'filename': 'cover.txt',
                'document_type': 'COVER_LETTER',
                'file_size_bytes': len(sample_file_data),
                'mime_type': 'text/plain',
                's3_url': 'https://bucket.s3.region.amazonaws.com/cover.txt',
                's3_key': 'documents/user/cover_letter/cover.txt',
                's3_bucket': 'bucket',
                'file_hash': 'def456',
                'uploaded_at': datetime.now(timezone.utc).isoformat()
            }
        )
        await document_manager.upload_document(
            user_id=sample_user_id,
            file_data=sample_file_data,
            filename='cover.txt',
            document_type=DocumentType.COVER_LETTER
        )
        
        # Get only resumes
        resumes = await document_manager.get_user_documents(
            sample_user_id,
            document_type=DocumentType.RESUME
        )
        
        assert len(resumes) == 1
        assert resumes[0].document_type == DocumentType.RESUME
        assert resumes[0].filename == 'resume.txt'


class TestDocumentManagerSubmission:
    """Tests for document submission with consent enforcement."""
    
    @pytest.mark.asyncio
    async def test_submit_document_success(
        self,
        document_manager,
        mock_upload_tool,
        mock_consent_manager,
        sample_file_data,
        sample_user_id,
        sample_document_id,
        sample_opportunity_id
    ):
        """Test successful document submission with valid consent."""
        # Upload document first
        mock_upload_tool.execute.return_value = ToolResult(
            success=True,
            data={
                'document_id': sample_document_id,
                'user_id': sample_user_id,
                'filename': 'resume.txt',
                'document_type': 'RESUME',
                'file_size_bytes': len(sample_file_data),
                'mime_type': 'text/plain',
                's3_url': 'https://bucket.s3.region.amazonaws.com/resume.txt',
                's3_key': 'documents/user/resume/resume.txt',
                's3_bucket': 'bucket',
                'file_hash': 'abc123',
                'uploaded_at': datetime.now(timezone.utc).isoformat()
            }
        )
        await document_manager.upload_document(
            user_id=sample_user_id,
            file_data=sample_file_data,
            filename='resume.txt',
            document_type=DocumentType.RESUME
        )
        
        # Mock consent validation to return True
        mock_consent_manager.validate_consent_token.return_value = True
        
        # Submit document
        result = await document_manager.submit_document(
            user_id=sample_user_id,
            document_id=sample_document_id,
            target_opportunity_id=sample_opportunity_id,
            consent_token="valid_token_123"
        )
        
        # Verify success
        assert result.success is True
        assert result.submission_id is not None
        assert result.document_id == sample_document_id
        assert result.opportunity_id == sample_opportunity_id
        assert result.confirmation is not None
        assert "successfully submitted" in result.confirmation
        
        # Verify consent was validated
        mock_consent_manager.validate_consent_token.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_submit_document_without_consent_token(
        self,
        document_manager,
        sample_user_id,
        sample_document_id,
        sample_opportunity_id
    ):
        """Test submission without consent token fails (CRITICAL SECURITY)."""
        result = await document_manager.submit_document(
            user_id=sample_user_id,
            document_id=sample_document_id,
            target_opportunity_id=sample_opportunity_id,
            consent_token=""
        )
        
        assert result.success is False
        assert "consent" in result.error.lower()
    
    @pytest.mark.asyncio
    async def test_submit_document_invalid_consent_token(
        self,
        document_manager,
        mock_upload_tool,
        mock_consent_manager,
        sample_file_data,
        sample_user_id,
        sample_document_id,
        sample_opportunity_id
    ):
        """Test submission with invalid consent token fails."""
        # Upload document first
        mock_upload_tool.execute.return_value = ToolResult(
            success=True,
            data={
                'document_id': sample_document_id,
                'user_id': sample_user_id,
                'filename': 'resume.txt',
                'document_type': 'RESUME',
                'file_size_bytes': len(sample_file_data),
                'mime_type': 'text/plain',
                's3_url': 'https://bucket.s3.region.amazonaws.com/resume.txt',
                's3_key': 'documents/user/resume/resume.txt',
                's3_bucket': 'bucket',
                'file_hash': 'abc123',
                'uploaded_at': datetime.now(timezone.utc).isoformat()
            }
        )
        await document_manager.upload_document(
            user_id=sample_user_id,
            file_data=sample_file_data,
            filename='resume.txt',
            document_type=DocumentType.RESUME
        )
        
        # Mock consent validation to return False
        mock_consent_manager.validate_consent_token.return_value = False
        
        # Submit document
        result = await document_manager.submit_document(
            user_id=sample_user_id,
            document_id=sample_document_id,
            target_opportunity_id=sample_opportunity_id,
            consent_token="invalid_token"
        )
        
        # Verify failure
        assert result.success is False
        assert "invalid" in result.error.lower() or "expired" in result.error.lower()
    
    @pytest.mark.asyncio
    async def test_submit_document_not_found(
        self,
        document_manager,
        mock_consent_manager,
        sample_user_id,
        sample_opportunity_id
    ):
        """Test submission of non-existent document fails."""
        # Mock consent validation to return True
        mock_consent_manager.validate_consent_token.return_value = True
        
        # Try to submit non-existent document
        result = await document_manager.submit_document(
            user_id=sample_user_id,
            document_id="nonexistent_doc_id",
            target_opportunity_id=sample_opportunity_id,
            consent_token="valid_token"
        )
        
        assert result.success is False
        assert "not found" in result.error.lower()
    
    @pytest.mark.asyncio
    async def test_submit_document_wrong_user(
        self,
        document_manager,
        mock_upload_tool,
        mock_consent_manager,
        sample_file_data,
        sample_user_id,
        sample_document_id,
        sample_opportunity_id
    ):
        """Test user cannot submit another user's document."""
        # Upload document for user1
        mock_upload_tool.execute.return_value = ToolResult(
            success=True,
            data={
                'document_id': sample_document_id,
                'user_id': sample_user_id,
                'filename': 'resume.txt',
                'document_type': 'RESUME',
                'file_size_bytes': len(sample_file_data),
                'mime_type': 'text/plain',
                's3_url': 'https://bucket.s3.region.amazonaws.com/resume.txt',
                's3_key': 'documents/user/resume/resume.txt',
                's3_bucket': 'bucket',
                'file_hash': 'abc123',
                'uploaded_at': datetime.now(timezone.utc).isoformat()
            }
        )
        await document_manager.upload_document(
            user_id=sample_user_id,
            file_data=sample_file_data,
            filename='resume.txt',
            document_type=DocumentType.RESUME
        )
        
        # Mock consent validation to return True
        mock_consent_manager.validate_consent_token.return_value = True
        
        # Try to submit as different user
        different_user_id = "different-user-id-123"
        result = await document_manager.submit_document(
            user_id=different_user_id,
            document_id=sample_document_id,
            target_opportunity_id=sample_opportunity_id,
            consent_token="valid_token"
        )
        
        assert result.success is False
        assert "own documents" in result.error.lower()
