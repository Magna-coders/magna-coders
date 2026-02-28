# Document Management and Consent System

This package provides secure document management capabilities for the Magna AI Agent, including document upload to S3 storage and consent-based document submission.

## Overview

The document management system consists of three main components:

1. **DocumentManager**: Handles document uploads and submissions
2. **ConsentManager**: Manages user consent for sensitive actions
3. **Models**: Data structures for documents, submissions, and consent

## Key Features

- **S3 Integration**: Secure document storage in AWS S3
- **Format Validation**: Supports PDF, DOCX, and TXT formats
- **Size Limits**: Enforces 10MB maximum file size
- **Consent Enforcement**: Requires explicit user approval for submissions
- **Single-Use Tokens**: Consent tokens can only be used once
- **Time-Limited Consent**: Consent requests expire after 5 minutes
- **Security**: Cryptographically secure tokens with binding to user/action/target

## Architecture

### Consent Flow

The consent system implements a secure flow to ensure users explicitly approve document submissions:

```
1. Agent identifies need to submit document
   ↓
2. Agent calls request_submission_consent()
   ↓
3. System generates consent request with action details
   ↓
4. UI displays consent dialog to user
   ↓
5. User approves or denies
   ↓
6. System calls process_consent() with user's decision
   ↓
7. If approved: Generate secure consent token
   If denied: No token, action cancelled
   ↓
8. Agent calls submit_document() with token
   ↓
9. System validates token (user, action type, target)
   ↓
10. If valid: Execute submission, invalidate token
    If invalid: Reject submission
```

### Security Properties

The consent system enforces these critical security properties:

- **No Bypass**: Document submission ALWAYS requires valid consent token
- **Single-Use**: Each token can only be used once
- **Time-Limited**: Tokens expire with their consent request (5 minutes)
- **Bound**: Tokens are bound to specific user, action type, and target
- **Cryptographic**: Tokens use cryptographically secure random generation
- **Validation**: All parameters are validated before execution

## Usage

### Basic Document Upload

```python
from magna_ai.backend.documents import DocumentManager, DocumentType

# Initialize manager
document_manager = DocumentManager()

# Upload document
metadata = await document_manager.upload_document(
    user_id="user-uuid",
    file_data=file_bytes,
    filename="resume.pdf",
    document_type=DocumentType.RESUME
)

print(f"Document uploaded: {metadata.document_id}")
print(f"S3 URL: {metadata.s3_url}")
```

### Retrieve User's Documents

```python
# Get all documents
documents = await document_manager.get_user_documents(user_id="user-uuid")

# Get only resumes
resumes = await document_manager.get_user_documents(
    user_id="user-uuid",
    document_type=DocumentType.RESUME
)
```

### Document Submission with Consent

```python
from magna_ai.backend.documents import ConsentManager, ConsentActionType

# Initialize managers
document_manager = DocumentManager()
consent_manager = document_manager._consent_manager

# Step 1: Request consent
consent_request = await consent_manager.request_submission_consent(
    user_id="user-uuid",
    document_id="doc-uuid",
    target_opportunity_id="opp-uuid",
    document_filename="resume.pdf",
    opportunity_title="Senior Developer"
)

# Step 2: Present to user and get approval
# (In UI, show consent dialog with consent_request.action_description)

# Step 3: Process user's decision
consent_response = await consent_manager.process_consent(
    consent_request_id=consent_request.id,
    approved=True,  # User clicked "Approve"
    user_id="user-uuid"
)

# Step 4: Submit document with token
result = await document_manager.submit_document(
    user_id="user-uuid",
    document_id="doc-uuid",
    target_opportunity_id="opp-uuid",
    consent_token=consent_response.consent_token
)

if result.success:
    print(f"Submitted! {result.confirmation}")
else:
    print(f"Failed: {result.error}")
```

## API Reference

### DocumentManager

#### `upload_document(user_id, file_data, filename, document_type)`

Upload a document to S3 storage.

**Parameters:**
- `user_id` (str): UUID of the user
- `file_data` (bytes): Raw file content
- `filename` (str): Original filename with extension
- `document_type` (DocumentType): Type of document (RESUME, COVER_LETTER, PORTFOLIO)

**Returns:** `DocumentMetadata` with document ID, S3 URL, and metadata

**Raises:**
- `ValueError`: If validation fails (empty params, file too large, invalid type)
- `RuntimeError`: If S3 upload fails

#### `get_user_documents(user_id, document_type=None)`

Retrieve user's uploaded documents.

**Parameters:**
- `user_id` (str): UUID of the user
- `document_type` (DocumentType, optional): Filter by document type

**Returns:** List of `DocumentMetadata`, sorted by upload date (newest first)

#### `submit_document(user_id, document_id, target_opportunity_id, consent_token)`

Submit document to opportunity with consent enforcement.

**Parameters:**
- `user_id` (str): UUID of the user
- `document_id` (str): UUID of the document
- `target_opportunity_id` (str): UUID of the target opportunity
- `consent_token` (str): Valid consent token from approved request

**Returns:** `SubmissionResult` with success status and details

**Security:** This method REQUIRES a valid consent token. Submissions without valid tokens are rejected.

### ConsentManager

#### `request_submission_consent(user_id, document_id, target_opportunity_id, document_filename, opportunity_title)`

Generate consent request for document submission.

**Parameters:**
- `user_id` (str): UUID of the user
- `document_id` (str): UUID of the document
- `target_opportunity_id` (str): UUID of the target opportunity
- `document_filename` (str): Name of the document file
- `opportunity_title` (str): Title of the opportunity

**Returns:** `ConsentRequest` with pending status

#### `process_consent(consent_request_id, approved, user_id)`

Process user's consent decision.

**Parameters:**
- `consent_request_id` (str): UUID of the consent request
- `approved` (bool): True if user approved, False if denied
- `user_id` (str): UUID of the user (for verification)

**Returns:** `ConsentResponse` with token if approved, None if denied

**Raises:**
- `ValueError`: If request not found, expired, or user mismatch

#### `validate_consent_token(consent_token, user_id, action_type, target)`

Validate consent token before executing action.

**Parameters:**
- `consent_token` (str): The consent token to validate
- `user_id` (str): UUID of the user performing the action
- `action_type` (ConsentActionType): Type of action being performed
- `target` (str): Target of the action (e.g., opportunity ID)

**Returns:** `bool` - True if valid and authorized, False otherwise

**Security:** This method enforces all security checks and invalidates the token after successful validation (single-use).

## Data Models

### DocumentType (Enum)
- `RESUME`: Resume/CV document
- `COVER_LETTER`: Cover letter document
- `PORTFOLIO`: Portfolio or work samples

### DocumentMetadata
- `document_id`: Unique identifier
- `user_id`: Owner's user ID
- `filename`: Original filename
- `document_type`: Type of document
- `file_size_bytes`: Size in bytes
- `mime_type`: MIME type (e.g., "application/pdf")
- `s3_url`: Full S3 URL to access document
- `uploaded_at`: Upload timestamp

### SubmissionResult
- `success`: Whether submission succeeded
- `submission_id`: Unique submission identifier (if successful)
- `document_id`: Document that was submitted
- `opportunity_id`: Target opportunity
- `submitted_at`: Submission timestamp
- `confirmation`: Confirmation message
- `error`: Error message (if failed)

### ConsentRequest
- `id`: Unique identifier
- `user_id`: User who must approve
- `action_type`: Type of action (DOCUMENT_SUBMIT, DATA_SHARE)
- `action_description`: Human-readable description
- `required_data`: List of data that will be shared
- `target`: Target of the action (e.g., opportunity ID)
- `created_at`: Creation timestamp
- `expires_at`: Expiration timestamp
- `status`: Current status (PENDING, APPROVED, DENIED, EXPIRED)

### ConsentResponse
- `consent_request_id`: ID of the consent request
- `approved`: Whether user approved
- `consent_token`: Secure token (if approved)
- `timestamp`: Response timestamp

## Testing

Run the unit tests:

```bash
# Test DocumentManager
pytest src/magna_ai/backend/tests/unit/test_document_manager.py -v

# Test ConsentManager
pytest src/magna_ai/backend/tests/unit/test_consent_manager.py -v

# Run all document tests
pytest src/magna_ai/backend/tests/unit/test_document*.py -v
```

Run the example:

```bash
python -m magna_ai.backend.documents.example_usage
```

## Requirements Validation

This implementation validates the following requirements:

- **Requirement 5.1**: Document storage in S3 ✓
- **Requirement 5.2**: No submission without consent ✓ (CRITICAL)
- **Requirement 5.3**: Consent request with clear action description ✓
- **Requirement 5.4**: Consent denial handling ✓
- **Requirement 5.5**: Format support (PDF, DOCX, TXT) ✓
- **Requirement 5.6**: Submission confirmation ✓
- **Requirement 12.5**: Consent requirement enforcement ✓ (CRITICAL)

## Security Considerations

### Critical Security Features

1. **Consent Enforcement**: The `submit_document()` method ALWAYS validates the consent token before proceeding. There is no way to bypass this check.

2. **Single-Use Tokens**: Each consent token can only be used once. After validation, the token is immediately invalidated.

3. **Token Binding**: Tokens are cryptographically bound to:
   - Specific user ID
   - Specific action type
   - Specific target (opportunity ID)
   
   Any mismatch causes validation to fail.

4. **Time Limits**: Consent requests expire after 5 minutes. Expired tokens are rejected.

5. **Secure Generation**: Tokens use `secrets.token_bytes()` for cryptographically secure random generation.

### Best Practices

- Always present consent requests to users with clear action descriptions
- Never cache or store consent tokens - request new consent for each action
- Log all consent requests and validations for audit purposes
- Handle consent denial gracefully with clear user feedback
- Validate all inputs before processing

## Production Considerations

### Database Integration

The current implementation uses in-memory storage for simplicity. In production:

1. Store documents metadata in PostgreSQL:
   ```sql
   CREATE TABLE documents (
       id UUID PRIMARY KEY,
       user_id VARCHAR(255) NOT NULL,
       filename VARCHAR(255) NOT NULL,
       document_type VARCHAR(50) NOT NULL,
       file_size_bytes BIGINT NOT NULL,
       mime_type VARCHAR(100) NOT NULL,
       s3_url TEXT NOT NULL,
       s3_key TEXT NOT NULL,
       s3_bucket VARCHAR(255) NOT NULL,
       file_hash VARCHAR(64) NOT NULL,
       uploaded_at TIMESTAMP NOT NULL,
       last_modified TIMESTAMP NOT NULL,
       FOREIGN KEY (user_id) REFERENCES users(id)
   );
   ```

2. Store consent requests in PostgreSQL:
   ```sql
   CREATE TABLE consent_requests (
       id UUID PRIMARY KEY,
       user_id VARCHAR(255) NOT NULL,
       action_type VARCHAR(50) NOT NULL,
       action_description TEXT NOT NULL,
       required_data JSONB NOT NULL,
       target VARCHAR(255) NOT NULL,
       created_at TIMESTAMP NOT NULL,
       expires_at TIMESTAMP NOT NULL,
       status VARCHAR(50) NOT NULL,
       FOREIGN KEY (user_id) REFERENCES users(id)
   );
   ```

3. Store consent tokens in Redis with TTL for automatic expiration

### AWS S3 Configuration

Ensure proper S3 bucket configuration:

```python
# Environment variables
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=magna-documents
```

Bucket policy should:
- Allow uploads from backend service
- Restrict public access
- Enable versioning for document history
- Configure lifecycle rules for old documents

### Monitoring

Monitor these metrics:
- Document upload success/failure rate
- Consent approval/denial rate
- Token validation failures (potential security issues)
- Average time from consent request to approval
- S3 storage usage

## License

Copyright © 2024 Magna Coders. All rights reserved.
