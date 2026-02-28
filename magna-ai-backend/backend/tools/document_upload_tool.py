"""Document upload tool implementation for S3 storage.

This module provides document upload capabilities for the Magna AI Agent,
allowing it to upload user documents (resumes, cover letters, portfolios)
to AWS S3 storage with validation and metadata tracking.

**Validates: Requirements 8.4, 5.1, 5.5**
"""

import hashlib
import logging
import mimetypes
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import uuid4

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from ..config import settings
from .base import Tool, ToolResult, ToolValidationError

logger = logging.getLogger(__name__)


# Supported document formats
SUPPORTED_FORMATS = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "text/plain": ".txt"
}

# Maximum file size in bytes (10MB)
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024


class DocumentUploadTool(Tool):
    """Upload documents to AWS S3 storage.
    
    This tool enables the agent to upload user documents (resumes, cover letters,
    portfolios) to S3 storage with format validation, size limits, and metadata
    tracking. Supports PDF, DOCX, and TXT formats up to 10MB.
    
    The tool validates file format and size, generates unique filenames,
    uploads to S3, and returns document metadata including the S3 URL.
    """
    
    def __init__(
        self,
        aws_access_key_id: Optional[str] = None,
        aws_secret_access_key: Optional[str] = None,
        aws_region: Optional[str] = None,
        s3_bucket_name: Optional[str] = None
    ):
        """Initialize the document upload tool.
        
        Args:
            aws_access_key_id: AWS access key ID. Defaults to settings.aws_access_key_id
            aws_secret_access_key: AWS secret access key. Defaults to settings.aws_secret_access_key
            aws_region: AWS region. Defaults to settings.aws_region
            s3_bucket_name: S3 bucket name. Defaults to settings.s3_bucket_name
        """
        self._aws_access_key_id = aws_access_key_id or settings.aws_access_key_id
        self._aws_secret_access_key = aws_secret_access_key or settings.aws_secret_access_key
        self._aws_region = aws_region or settings.aws_region
        self._s3_bucket_name = s3_bucket_name or settings.s3_bucket_name
        
        # Initialize S3 client if credentials are available
        self._s3_client = None
        if self._aws_access_key_id and self._aws_secret_access_key:
            try:
                self._s3_client = boto3.client(
                    's3',
                    aws_access_key_id=self._aws_access_key_id,
                    aws_secret_access_key=self._aws_secret_access_key,
                    region_name=self._aws_region
                )
                logger.info(f"DocumentUploadTool initialized with S3 bucket: {self._s3_bucket_name}")
            except Exception as e:
                logger.warning(f"Failed to initialize S3 client: {e}")
        else:
            logger.warning("AWS credentials not configured for DocumentUploadTool")
    
    @property
    def name(self) -> str:
        """Tool identifier."""
        return "document_upload"
    
    @property
    def description(self) -> str:
        """Human-readable description for LLM."""
        return (
            "Upload user documents (resumes, cover letters, portfolios) to secure cloud storage. "
            "Supports PDF, DOCX, and TXT formats up to 10MB. "
            "Use this tool when a user wants to upload a document for job applications or profile. "
            "Returns document metadata including storage URL and unique document ID. "
            "Note: This only uploads the document - submission to opportunities requires separate consent."
        )
    
    @property
    def parameters_schema(self) -> Dict[str, Any]:
        """JSON schema for parameters."""
        return {
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "string",
                    "description": "UUID of the user uploading the document",
                    "format": "uuid"
                },
                "file_data": {
                    "type": "string",
                    "description": "Base64-encoded file content"
                },
                "filename": {
                    "type": "string",
                    "description": "Original filename with extension (e.g., 'resume.pdf')"
                },
                "document_type": {
                    "type": "string",
                    "description": "Type of document",
                    "enum": ["RESUME", "COVER_LETTER", "PORTFOLIO"]
                },
                "mime_type": {
                    "type": "string",
                    "description": "MIME type of the file (e.g., 'application/pdf')",
                    "enum": [
                        "application/pdf",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        "text/plain"
                    ]
                }
            },
            "required": ["user_id", "file_data", "filename", "document_type"]
        }
    
    async def execute(
        self,
        user_id: str,
        file_data: str,
        filename: str,
        document_type: str,
        mime_type: Optional[str] = None,
        **kwargs
    ) -> ToolResult:
        """Execute document upload to S3.
        
        Args:
            user_id: UUID of the user uploading the document
            file_data: Base64-encoded file content
            filename: Original filename with extension
            document_type: Type of document (RESUME, COVER_LETTER, PORTFOLIO)
            mime_type: MIME type of the file (auto-detected if not provided)
            **kwargs: Additional parameters (ignored)
            
        Returns:
            ToolResult with document metadata containing:
                - document_id: Unique identifier for the document
                - user_id: User who uploaded the document
                - filename: Original filename
                - document_type: Type of document
                - file_size_bytes: Size of the file in bytes
                - mime_type: MIME type of the file
                - s3_url: Full S3 URL to access the document
                - s3_key: S3 object key
                - file_hash: SHA-256 hash of file content
                - uploaded_at: Upload timestamp
                
        Raises:
            ToolValidationError: If parameters are invalid, file format unsupported, or size exceeds limit
        """
        # Validate user_id
        if not user_id or not user_id.strip():
            raise ToolValidationError("user_id cannot be empty")
        
        user_id = user_id.strip()
        
        # Basic UUID format validation
        if len(user_id) != 36 or user_id.count('-') != 4:
            raise ToolValidationError(f"user_id must be a valid UUID format, got: {user_id}")
        
        # Validate filename
        if not filename or not filename.strip():
            raise ToolValidationError("filename cannot be empty")
        
        filename = filename.strip()
        
        # Validate document_type
        valid_types = ["RESUME", "COVER_LETTER", "PORTFOLIO"]
        if document_type not in valid_types:
            raise ToolValidationError(
                f"document_type must be one of {valid_types}, got: {document_type}"
            )
        
        # Validate file_data
        if not file_data:
            raise ToolValidationError("file_data cannot be empty")
        
        # Check S3 client availability
        if not self._s3_client:
            return ToolResult(
                success=False,
                error="AWS S3 is not configured. Please set AWS credentials in environment variables.",
                metadata={
                    "tool": self.name,
                    "user_id": user_id,
                    "requires_config": True
                }
            )
        
        try:
            # Decode base64 file data
            import base64
            try:
                file_bytes = base64.b64decode(file_data)
            except Exception as e:
                raise ToolValidationError(f"Invalid base64 file_data: {str(e)}")
            
            # Validate file size
            file_size = len(file_bytes)
            if file_size > MAX_FILE_SIZE_BYTES:
                size_mb = file_size / (1024 * 1024)
                limit_mb = MAX_FILE_SIZE_BYTES / (1024 * 1024)
                raise ToolValidationError(
                    f"File size {size_mb:.2f}MB exceeds limit of {limit_mb}MB. "
                    f"Please compress the file or upload a smaller version."
                )
            
            if file_size == 0:
                raise ToolValidationError("File is empty (0 bytes)")
            
            # Determine MIME type
            if not mime_type:
                # Auto-detect from filename
                mime_type, _ = mimetypes.guess_type(filename)
                if not mime_type:
                    # Try to infer from extension
                    ext = filename.lower().split('.')[-1] if '.' in filename else ''
                    mime_type_map = {
                        'pdf': 'application/pdf',
                        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'txt': 'text/plain'
                    }
                    mime_type = mime_type_map.get(ext)
            
            # Validate MIME type
            if mime_type not in SUPPORTED_FORMATS:
                supported_exts = ', '.join(SUPPORTED_FORMATS.values())
                raise ToolValidationError(
                    f"Unsupported file format: {mime_type}. "
                    f"Supported formats: {supported_exts}. "
                    f"Please convert to PDF, DOCX, or TXT format."
                )
            
            # Generate unique document ID
            document_id = str(uuid4())
            
            # Calculate file hash for deduplication
            file_hash = hashlib.sha256(file_bytes).hexdigest()
            
            # Generate S3 key with organized structure
            # Format: documents/{user_id}/{document_type}/{document_id}_{filename}
            file_extension = SUPPORTED_FORMATS[mime_type]
            safe_filename = self._sanitize_filename(filename)
            s3_key = f"documents/{user_id}/{document_type.lower()}/{document_id}_{safe_filename}"
            
            logger.info(
                f"Uploading document: user={user_id}, type={document_type}, "
                f"size={file_size} bytes, key={s3_key}"
            )
            
            # Upload to S3
            self._s3_client.put_object(
                Bucket=self._s3_bucket_name,
                Key=s3_key,
                Body=file_bytes,
                ContentType=mime_type,
                Metadata={
                    'user_id': user_id,
                    'document_id': document_id,
                    'document_type': document_type,
                    'original_filename': filename,
                    'file_hash': file_hash,
                    'uploaded_at': datetime.now(timezone.utc).isoformat()
                }
            )
            
            # Generate S3 URL
            s3_url = f"https://{self._s3_bucket_name}.s3.{self._aws_region}.amazonaws.com/{s3_key}"
            
            # Prepare document metadata
            document_metadata = {
                "document_id": document_id,
                "user_id": user_id,
                "filename": filename,
                "document_type": document_type,
                "file_size_bytes": file_size,
                "mime_type": mime_type,
                "s3_url": s3_url,
                "s3_key": s3_key,
                "s3_bucket": self._s3_bucket_name,
                "file_hash": file_hash,
                "uploaded_at": datetime.now(timezone.utc).isoformat()
            }
            
            logger.info(
                f"Document uploaded successfully: document_id={document_id}, "
                f"size={file_size} bytes, url={s3_url}"
            )
            
            return ToolResult(
                success=True,
                data=document_metadata,
                metadata={
                    "tool": self.name,
                    "user_id": user_id,
                    "document_id": document_id,
                    "file_size_mb": round(file_size / (1024 * 1024), 2)
                }
            )
        
        except ToolValidationError:
            # Re-raise validation errors
            raise
        
        except (BotoCoreError, ClientError) as e:
            error_msg = f"S3 upload failed: {str(e)}"
            logger.error(error_msg, exc_info=True)
            
            return ToolResult(
                success=False,
                error=error_msg,
                metadata={
                    "tool": self.name,
                    "user_id": user_id,
                    "error_type": type(e).__name__,
                    "s3_bucket": self._s3_bucket_name
                }
            )
        
        except Exception as e:
            error_msg = f"Document upload failed: {str(e)}"
            logger.error(error_msg, exc_info=True)
            
            return ToolResult(
                success=False,
                error=error_msg,
                metadata={
                    "tool": self.name,
                    "user_id": user_id,
                    "error_type": type(e).__name__
                }
            )
    
    def _sanitize_filename(self, filename: str) -> str:
        """Sanitize filename for safe S3 storage.
        
        Args:
            filename: Original filename
            
        Returns:
            Sanitized filename safe for S3
        """
        # Remove or replace unsafe characters
        import re
        # Keep alphanumeric, dots, hyphens, underscores
        safe_name = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
        # Limit length
        if len(safe_name) > 100:
            # Keep extension
            parts = safe_name.rsplit('.', 1)
            if len(parts) == 2:
                name, ext = parts
                safe_name = name[:95] + '.' + ext
            else:
                safe_name = safe_name[:100]
        return safe_name


# Example usage
if __name__ == "__main__":
    import asyncio
    import base64
    from .base import ToolRegistry
    
    async def main():
        """Demonstrate document upload tool usage."""
        # Create registry
        registry = ToolRegistry()
        
        # Register document upload tool
        registry.register_tool(DocumentUploadTool())
        
        # Test document upload with sample PDF content
        print("Testing document upload tool:")
        print("-" * 50)
        
        # Create a simple test file (plain text)
        test_content = b"This is a test resume document.\nName: John Doe\nSkills: Python, JavaScript"
        test_file_base64 = base64.b64encode(test_content).decode('utf-8')
        
        # Example user ID
        test_user_id = "550e8400-e29b-41d4-a716-446655440000"
        
        result = await registry.execute_tool(
            tool_name="document_upload",
            parameters={
                "user_id": test_user_id,
                "file_data": test_file_base64,
                "filename": "john_doe_resume.txt",
                "document_type": "RESUME",
                "mime_type": "text/plain"
            }
        )
        
        if result.success:
            doc = result.data
            print(f"Document uploaded successfully!")
            print(f"Document ID: {doc['document_id']}")
            print(f"Filename: {doc['filename']}")
            print(f"Type: {doc['document_type']}")
            print(f"Size: {doc['file_size_bytes']} bytes")
            print(f"S3 URL: {doc['s3_url']}")
            print(f"File hash: {doc['file_hash']}")
            print(f"Uploaded at: {doc['uploaded_at']}")
        else:
            print(f"Upload failed: {result.error}")
            print(f"Metadata: {result.metadata}")
    
    asyncio.run(main())
