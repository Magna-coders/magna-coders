"""Unit tests for DocumentUploadTool.

Tests document upload functionality including validation, S3 integration,
and error handling.

**Validates: Requirements 8.4, 5.1, 5.5**
"""

import base64
import hashlib
import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from botocore.exceptions import ClientError

from ...tools.document_upload_tool import (
    DocumentUploadTool,
    SUPPORTED_FORMATS,
    MAX_FILE_SIZE_BYTES
)
from ...tools.base import ToolResult, ToolValidationError


@pytest.fixture
def mock_s3_client():
    """Create a mock S3 client."""
    client = MagicMock()
    client.put_object = MagicMock()
    return client


@pytest.fixture
def document_upload_tool(mock_s3_client):
    """Create DocumentUploadTool instance with mocked S3 client."""
    tool = DocumentUploadTool(
        aws_access_key_id="test_key",
        aws_secret_access_key="test_secret",
        aws_region="us-east-1",
        s3_bucket_name="test-bucket"
    )
    tool._s3_client = mock_s3_client
    return tool


@pytest.fixture
def valid_user_id():
    """Valid UUID for testing."""
    return "550e8400-e29b-41d4-a716-446655440000"


@pytest.fixture
def sample_pdf_content():
    """Sample PDF file content."""
    # Minimal valid PDF header
    return b"%PDF-1.4\n%\xE2\xE3\xCF\xD3\nThis is a test PDF document.\n%%EOF"


@pytest.fixture
def sample_text_content():
    """Sample text file content."""
    return b"This is a test resume.\nName: John Doe\nSkills: Python, JavaScript"


class TestDocumentUploadToolProperties:
    """Test DocumentUploadTool properties."""
    
    def test_name_property(self, document_upload_tool):
        """Test tool name is correct."""
        assert document_upload_tool.name == "document_upload"
    
    def test_description_property(self, document_upload_tool):
        """Test tool description is informative."""
        description = document_upload_tool.description
        assert "upload" in description.lower()
        assert "document" in description.lower()
        assert "PDF" in description or "pdf" in description.lower()
        assert "10MB" in description or "10 MB" in description
    
    def test_parameters_schema(self, document_upload_tool):
        """Test parameters schema is complete."""
        schema = document_upload_tool.parameters_schema
        
        assert schema["type"] == "object"
        assert "user_id" in schema["properties"]
        assert "file_data" in schema["properties"]
        assert "filename" in schema["properties"]
        assert "document_type" in schema["properties"]
        assert "mime_type" in schema["properties"]
        
        # Check required fields
        assert "user_id" in schema["required"]
        assert "file_data" in schema["required"]
        assert "filename" in schema["required"]
        assert "document_type" in schema["required"]
        
        # Check document_type enum
        assert "enum" in schema["properties"]["document_type"]
        assert "RESUME" in schema["properties"]["document_type"]["enum"]
        assert "COVER_LETTER" in schema["properties"]["document_type"]["enum"]
        assert "PORTFOLIO" in schema["properties"]["document_type"]["enum"]


class TestDocumentUploadValidation:
    """Test input validation for document upload."""
    
    @pytest.mark.asyncio
    async def test_empty_user_id_raises_error(self, document_upload_tool, sample_text_content):
        """Test that empty user_id raises ToolValidationError."""
        file_base64 = base64.b64encode(sample_text_content).decode('utf-8')
        
        with pytest.raises(ToolValidationError, match="user_id cannot be empty"):
            await document_upload_tool.execute(
                user_id="",
                file_data=file_base64,
                filename="test.txt",
                document_type="RESUME"
            )
    
    @pytest.mark.asyncio
    async def test_invalid_uuid_format_raises_error(self, document_upload_tool, sample_text_content):
        """Test that invalid UUID format raises ToolValidationError."""
        file_base64 = base64.b64encode(sample_text_content).decode('utf-8')
        
        with pytest.raises(ToolValidationError, match="valid UUID format"):
            await document_upload_tool.execute(
                user_id="not-a-valid-uuid",
                file_data=file_base64,
                filename="test.txt",
                document_type="RESUME"
            )
    
    @pytest.mark.asyncio
    async def test_empty_filename_raises_error(self, document_upload_tool, valid_user_id, sample_text_content):
        """Test that empty filename raises ToolValidationError."""
        file_base64 = base64.b64encode(sample_text_content).decode('utf-8')
        
        with pytest.raises(ToolValidationError, match="filename cannot be empty"):
            await document_upload_tool.execute(
                user_id=valid_user_id,
                file_data=file_base64,
                filename="",
                document_type="RESUME"
            )
    
    @pytest.mark.asyncio
    async def test_invalid_document_type_raises_error(self, document_upload_tool, valid_user_id, sample_text_content):
        """Test that invalid document_type raises ToolValidationError."""
        file_base64 = base64.b64encode(sample_text_content).decode('utf-8')
        
        with pytest.raises(ToolValidationError, match="document_type must be one of"):
            await document_upload_tool.execute(
                user_id=valid_user_id,
                file_data=file_base64,
                filename="test.txt",
                document_type="INVALID_TYPE"
            )
    
    @pytest.mark.asyncio
    async def test_empty_file_data_raises_error(self, document_upload_tool, valid_user_id):
        """Test that empty file_data raises ToolValidationError."""
        with pytest.raises(ToolValidationError, match="file_data cannot be empty"):
            await document_upload_tool.execute(
                user_id=valid_user_id,
                file_data="",
                filename="test.txt",
                document_type="RESUME"
            )
    
    @pytest.mark.asyncio
    async def test_invalid_base64_raises_error(self, document_upload_tool, valid_user_id):
        """Test that invalid base64 data raises ToolValidationError."""
        with pytest.raises(ToolValidationError, match="Invalid base64"):
            await document_upload_tool.execute(
                user_id=valid_user_id,
                file_data="not-valid-base64!!!",
                filename="test.txt",
                document_type="RESUME"
            )
    
    @pytest.mark.asyncio
    async def test_file_too_large_raises_error(self, document_upload_tool, valid_user_id):
        """Test that file exceeding size limit raises ToolValidationError."""
        # Create file larger than 10MB
        large_content = b"x" * (MAX_FILE_SIZE_BYTES + 1)
        file_base64 = base64.b64encode(large_content).decode('utf-8')
        
        with pytest.raises(ToolValidationError, match="exceeds limit"):
            await document_upload_tool.execute(
                user_id=valid_user_id,
                file_data=file_base64,
                filename="large_file.txt",
                document_type="RESUME"
            )
    
    @pytest.mark.asyncio
    async def test_empty_file_raises_error(self, document_upload_tool, valid_user_id):
        """Test that empty file (0 bytes) raises ToolValidationError."""
        empty_content = b""
        file_base64 = base64.b64encode(empty_content).decode('utf-8')
        
        with pytest.raises(ToolValidationError, match="file_data cannot be empty"):
            await document_upload_tool.execute(
                user_id=valid_user_id,
                file_data=file_base64,
                filename="empty.txt",
                document_type="RESUME"
            )
    
    @pytest.mark.asyncio
    async def test_unsupported_format_raises_error(self, document_upload_tool, valid_user_id):
        """Test that unsupported file format raises ToolValidationError."""
        content = b"fake image content"
        file_base64 = base64.b64encode(content).decode('utf-8')
        
        with pytest.raises(ToolValidationError, match="Unsupported file format"):
            await document_upload_tool.execute(
                user_id=valid_user_id,
                file_data=file_base64,
                filename="image.jpg",
                document_type="RESUME",
                mime_type="image/jpeg"
            )


class TestDocumentUploadSuccess:
    """Test successful document upload scenarios."""
    
    @pytest.mark.asyncio
    async def test_successful_pdf_upload(self, document_upload_tool, valid_user_id, sample_pdf_content, mock_s3_client):
        """Test successful PDF document upload."""
        file_base64 = base64.b64encode(sample_pdf_content).decode('utf-8')
        
        result = await document_upload_tool.execute(
            user_id=valid_user_id,
            file_data=file_base64,
            filename="resume.pdf",
            document_type="RESUME",
            mime_type="application/pdf"
        )
        
        # Verify result
        assert result.success is True
        assert result.data is not None
        assert result.error is None
        
        # Verify document metadata
        doc = result.data
        assert doc["user_id"] == valid_user_id
        assert doc["filename"] == "resume.pdf"
        assert doc["document_type"] == "RESUME"
        assert doc["mime_type"] == "application/pdf"
        assert doc["file_size_bytes"] == len(sample_pdf_content)
        assert "document_id" in doc
        assert "s3_url" in doc
        assert "s3_key" in doc
        assert "file_hash" in doc
        assert "uploaded_at" in doc
        
        # Verify S3 upload was called
        mock_s3_client.put_object.assert_called_once()
        call_kwargs = mock_s3_client.put_object.call_args[1]
        assert call_kwargs["Bucket"] == "test-bucket"
        assert call_kwargs["ContentType"] == "application/pdf"
        assert call_kwargs["Body"] == sample_pdf_content
    
    @pytest.mark.asyncio
    async def test_successful_docx_upload(self, document_upload_tool, valid_user_id, mock_s3_client):
        """Test successful DOCX document upload."""
        # Minimal DOCX content (just for testing)
        docx_content = b"PK\x03\x04fake docx content"
        file_base64 = base64.b64encode(docx_content).decode('utf-8')
        
        result = await document_upload_tool.execute(
            user_id=valid_user_id,
            file_data=file_base64,
            filename="cover_letter.docx",
            document_type="COVER_LETTER",
            mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
        
        assert result.success is True
        assert result.data["document_type"] == "COVER_LETTER"
        assert result.data["mime_type"] == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    
    @pytest.mark.asyncio
    async def test_successful_txt_upload(self, document_upload_tool, valid_user_id, sample_text_content, mock_s3_client):
        """Test successful TXT document upload."""
        file_base64 = base64.b64encode(sample_text_content).decode('utf-8')
        
        result = await document_upload_tool.execute(
            user_id=valid_user_id,
            file_data=file_base64,
            filename="portfolio.txt",
            document_type="PORTFOLIO",
            mime_type="text/plain"
        )
        
        assert result.success is True
        assert result.data["document_type"] == "PORTFOLIO"
        assert result.data["mime_type"] == "text/plain"
    
    @pytest.mark.asyncio
    async def test_mime_type_auto_detection(self, document_upload_tool, valid_user_id, sample_pdf_content, mock_s3_client):
        """Test MIME type is auto-detected from filename when not provided."""
        file_base64 = base64.b64encode(sample_pdf_content).decode('utf-8')
        
        result = await document_upload_tool.execute(
            user_id=valid_user_id,
            file_data=file_base64,
            filename="resume.pdf",
            document_type="RESUME"
            # mime_type not provided
        )
        
        assert result.success is True
        assert result.data["mime_type"] == "application/pdf"
    
    @pytest.mark.asyncio
    async def test_file_hash_calculation(self, document_upload_tool, valid_user_id, sample_text_content, mock_s3_client):
        """Test file hash is correctly calculated."""
        file_base64 = base64.b64encode(sample_text_content).decode('utf-8')
        expected_hash = hashlib.sha256(sample_text_content).hexdigest()
        
        result = await document_upload_tool.execute(
            user_id=valid_user_id,
            file_data=file_base64,
            filename="test.txt",
            document_type="RESUME",
            mime_type="text/plain"
        )
        
        assert result.success is True
        assert result.data["file_hash"] == expected_hash
    
    @pytest.mark.asyncio
    async def test_s3_key_structure(self, document_upload_tool, valid_user_id, sample_text_content, mock_s3_client):
        """Test S3 key follows correct structure."""
        file_base64 = base64.b64encode(sample_text_content).decode('utf-8')
        
        result = await document_upload_tool.execute(
            user_id=valid_user_id,
            file_data=file_base64,
            filename="my_resume.txt",
            document_type="RESUME",
            mime_type="text/plain"
        )
        
        assert result.success is True
        s3_key = result.data["s3_key"]
        
        # Verify key structure: documents/{user_id}/{document_type}/{document_id}_{filename}
        assert s3_key.startswith(f"documents/{valid_user_id}/resume/")
        assert "my_resume.txt" in s3_key
    
    @pytest.mark.asyncio
    async def test_s3_url_format(self, document_upload_tool, valid_user_id, sample_text_content, mock_s3_client):
        """Test S3 URL is correctly formatted."""
        file_base64 = base64.b64encode(sample_text_content).decode('utf-8')
        
        result = await document_upload_tool.execute(
            user_id=valid_user_id,
            file_data=file_base64,
            filename="test.txt",
            document_type="RESUME",
            mime_type="text/plain"
        )
        
        assert result.success is True
        s3_url = result.data["s3_url"]
        
        # Verify URL format
        assert s3_url.startswith("https://test-bucket.s3.us-east-1.amazonaws.com/")
        assert "documents/" in s3_url
    
    @pytest.mark.asyncio
    async def test_filename_sanitization(self, document_upload_tool, valid_user_id, sample_text_content, mock_s3_client):
        """Test filename with special characters is sanitized."""
        file_base64 = base64.b64encode(sample_text_content).decode('utf-8')
        
        result = await document_upload_tool.execute(
            user_id=valid_user_id,
            file_data=file_base64,
            filename="my resume (final) [v2].txt",
            document_type="RESUME",
            mime_type="text/plain"
        )
        
        assert result.success is True
        s3_key = result.data["s3_key"]
        
        # Special characters should be replaced with underscores
        assert "(" not in s3_key
        assert ")" not in s3_key
        assert "[" not in s3_key
        assert "]" not in s3_key


class TestDocumentUploadErrors:
    """Test error handling in document upload."""
    
    @pytest.mark.asyncio
    async def test_s3_client_not_configured(self, valid_user_id, sample_text_content):
        """Test error when S3 client is not configured."""
        tool = DocumentUploadTool(
            aws_access_key_id="",
            aws_secret_access_key="",
            aws_region="us-east-1",
            s3_bucket_name="test-bucket"
        )
        
        file_base64 = base64.b64encode(sample_text_content).decode('utf-8')
        
        result = await tool.execute(
            user_id=valid_user_id,
            file_data=file_base64,
            filename="test.txt",
            document_type="RESUME",
            mime_type="text/plain"
        )
        
        assert result.success is False
        assert "not configured" in result.error.lower()
        assert result.metadata["requires_config"] is True
    
    @pytest.mark.asyncio
    async def test_s3_upload_failure(self, document_upload_tool, valid_user_id, sample_text_content, mock_s3_client):
        """Test handling of S3 upload failure."""
        # Mock S3 client to raise error
        mock_s3_client.put_object.side_effect = ClientError(
            {"Error": {"Code": "AccessDenied", "Message": "Access Denied"}},
            "PutObject"
        )
        
        file_base64 = base64.b64encode(sample_text_content).decode('utf-8')
        
        result = await document_upload_tool.execute(
            user_id=valid_user_id,
            file_data=file_base64,
            filename="test.txt",
            document_type="RESUME",
            mime_type="text/plain"
        )
        
        assert result.success is False
        assert "S3 upload failed" in result.error
        assert result.metadata["error_type"] == "ClientError"
    
    @pytest.mark.asyncio
    async def test_generic_exception_handling(self, document_upload_tool, valid_user_id, sample_text_content, mock_s3_client):
        """Test handling of unexpected exceptions."""
        # Mock S3 client to raise generic exception
        mock_s3_client.put_object.side_effect = Exception("Unexpected error")
        
        file_base64 = base64.b64encode(sample_text_content).decode('utf-8')
        
        result = await document_upload_tool.execute(
            user_id=valid_user_id,
            file_data=file_base64,
            filename="test.txt",
            document_type="RESUME",
            mime_type="text/plain"
        )
        
        assert result.success is False
        assert "Document upload failed" in result.error
        assert "Unexpected error" in result.error


class TestDocumentUploadMetadata:
    """Test metadata tracking in document upload."""
    
    @pytest.mark.asyncio
    async def test_metadata_includes_tool_name(self, document_upload_tool, valid_user_id, sample_text_content, mock_s3_client):
        """Test result metadata includes tool name."""
        file_base64 = base64.b64encode(sample_text_content).decode('utf-8')
        
        result = await document_upload_tool.execute(
            user_id=valid_user_id,
            file_data=file_base64,
            filename="test.txt",
            document_type="RESUME",
            mime_type="text/plain"
        )
        
        assert result.metadata["tool"] == "document_upload"
    
    @pytest.mark.asyncio
    async def test_metadata_includes_file_size(self, document_upload_tool, valid_user_id, sample_text_content, mock_s3_client):
        """Test result metadata includes file size in MB."""
        file_base64 = base64.b64encode(sample_text_content).decode('utf-8')
        
        result = await document_upload_tool.execute(
            user_id=valid_user_id,
            file_data=file_base64,
            filename="test.txt",
            document_type="RESUME",
            mime_type="text/plain"
        )
        
        assert "file_size_mb" in result.metadata
        assert isinstance(result.metadata["file_size_mb"], (int, float))
        assert result.metadata["file_size_mb"] >= 0  # Can be 0.0 for very small files
    
    @pytest.mark.asyncio
    async def test_s3_metadata_stored(self, document_upload_tool, valid_user_id, sample_text_content, mock_s3_client):
        """Test S3 object metadata is stored correctly."""
        file_base64 = base64.b64encode(sample_text_content).decode('utf-8')
        
        result = await document_upload_tool.execute(
            user_id=valid_user_id,
            file_data=file_base64,
            filename="test.txt",
            document_type="RESUME",
            mime_type="text/plain"
        )
        
        # Verify S3 metadata was included in put_object call
        call_kwargs = mock_s3_client.put_object.call_args[1]
        metadata = call_kwargs["Metadata"]
        
        assert metadata["user_id"] == valid_user_id
        assert metadata["document_type"] == "RESUME"
        assert metadata["original_filename"] == "test.txt"
        assert "document_id" in metadata
        assert "file_hash" in metadata
        assert "uploaded_at" in metadata


class TestDocumentUploadIntegration:
    """Integration tests for document upload with tool registry."""
    
    @pytest.mark.asyncio
    async def test_tool_registration(self):
        """Test DocumentUploadTool can be registered in ToolRegistry."""
        from ...tools.base import ToolRegistry
        
        registry = ToolRegistry()
        tool = DocumentUploadTool(
            aws_access_key_id="test",
            aws_secret_access_key="test",
            aws_region="us-east-1",
            s3_bucket_name="test-bucket"
        )
        
        registry.register_tool(tool)
        
        # Verify tool is registered
        retrieved_tool = registry.get_tool("document_upload")
        assert retrieved_tool is not None
        assert retrieved_tool.name == "document_upload"
    
    @pytest.mark.asyncio
    async def test_tool_execution_through_registry(self, valid_user_id, sample_text_content):
        """Test document upload through ToolRegistry."""
        from ...tools.base import ToolRegistry
        
        registry = ToolRegistry()
        tool = DocumentUploadTool(
            aws_access_key_id="test",
            aws_secret_access_key="test",
            aws_region="us-east-1",
            s3_bucket_name="test-bucket"
        )
        
        # Mock S3 client
        mock_s3 = MagicMock()
        mock_s3.put_object = MagicMock()
        tool._s3_client = mock_s3
        
        registry.register_tool(tool)
        
        file_base64 = base64.b64encode(sample_text_content).decode('utf-8')
        
        result = await registry.execute_tool(
            tool_name="document_upload",
            parameters={
                "user_id": valid_user_id,
                "file_data": file_base64,
                "filename": "test.txt",
                "document_type": "RESUME",
                "mime_type": "text/plain"
            }
        )
        
        assert result.success is True
        assert result.data is not None
