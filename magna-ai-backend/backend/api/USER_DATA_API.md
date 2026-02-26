# User Data Management API

This document describes the user data export and deletion endpoints implemented for GDPR and privacy compliance.

## Overview

The User Data Management API provides endpoints for users to:
- Export all their data from the Magna AI Agent system
- Permanently delete all their data from the system

These endpoints comply with GDPR Article 15 (Right of Access) and Article 17 (Right to Erasure).

## Endpoints

### 1. Export User Data

**Endpoint:** `GET /api/user/data/export`

**Authentication:** Required (JWT Bearer token)

**Description:** Exports all user data from the Magna AI Agent system as a downloadable JSON file.

**Exported Data Includes:**
- Conversation history and messages
- Memory entries (episodic and semantic)
- Document metadata
- Consent history
- User preferences and settings

**Response:**
- **Status Code:** 200 OK
- **Content-Type:** application/json
- **Headers:** 
  - `Content-Disposition: attachment; filename="magna_ai_data_export_{user_id}_{timestamp}.json"`

**Response Body Structure:**
```json
{
  "export_metadata": {
    "user_id": "string",
    "export_timestamp": "ISO 8601 timestamp",
    "export_version": "1.0",
    "service": "magna-ai-agent"
  },
  "conversations": [
    {
      "id": "string",
      "title": "string",
      "created_at": "ISO 8601 timestamp",
      "messages": [...]
    }
  ],
  "memory_entries": [
    {
      "id": "string",
      "timestamp": "ISO 8601 timestamp",
      "user_message": "string",
      "agent_response": "string",
      "metadata": {}
    }
  ],
  "documents": [
    {
      "id": "string",
      "filename": "string",
      "document_type": "string",
      "upload_timestamp": "ISO 8601 timestamp",
      "size_bytes": 0,
      "s3_url": "string"
    }
  ],
  "consent_history": [
    {
      "id": "string",
      "action_type": "string",
      "status": "string",
      "timestamp": "ISO 8601 timestamp"
    }
  ],
  "user_preferences": {}
}
```

**Error Responses:**
- **401 Unauthorized:** Invalid or missing authentication token
- **500 Internal Server Error:** Data export failed

**Example Request:**
```bash
curl -X GET "https://api.magna.com/api/user/data/export" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Response:**
```json
{
  "export_metadata": {
    "user_id": "user_123",
    "export_timestamp": "2026-02-12T10:30:00Z",
    "export_version": "1.0",
    "service": "magna-ai-agent"
  },
  "conversations": [],
  "memory_entries": [],
  "documents": [],
  "consent_history": [],
  "user_preferences": {}
}
```

---

### 2. Delete User Data

**Endpoint:** `DELETE /api/user/data`

**Authentication:** Required (JWT Bearer token)

**Description:** Permanently deletes all user data from the Magna AI Agent system. This action is irreversible.

**Deleted Data Includes:**
- All conversations and messages
- All memory entries (episodic and semantic)
- All document metadata and files from S3
- All consent records
- User preferences and settings

**Response:**
- **Status Code:** 200 OK
- **Content-Type:** application/json

**Response Body Structure:**
```json
{
  "success": true,
  "message": "All user data has been permanently deleted",
  "summary": {
    "user_id": "string",
    "deletion_timestamp": "ISO 8601 timestamp",
    "deleted_items": {
      "conversations": 0,
      "memory_entries": 0,
      "documents": 0,
      "consent_records": 0
    },
    "status": "completed",
    "errors": []
  }
}
```

**Status Values:**
- `completed`: All data successfully deleted
- `completed_with_errors`: Some data deleted, but errors occurred (see `errors` array)

**Error Responses:**
- **401 Unauthorized:** Invalid or missing authentication token
- **500 Internal Server Error:** Data deletion failed

**Example Request:**
```bash
curl -X DELETE "https://api.magna.com/api/user/data" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Response:**
```json
{
  "success": true,
  "message": "All user data has been permanently deleted",
  "summary": {
    "user_id": "user_123",
    "deletion_timestamp": "2026-02-12T10:35:00Z",
    "deleted_items": {
      "conversations": 5,
      "memory_entries": 10,
      "documents": 3,
      "consent_records": 2
    },
    "status": "completed",
    "errors": []
  }
}
```

---

## Security Considerations

### Authentication
Both endpoints require valid JWT authentication. The user can only export or delete their own data.

### Authorization
- No additional authorization beyond standard JWT authentication is required
- Users have full rights to their own data

### Data Privacy
- Export data is returned directly to the authenticated user
- No data is logged or cached during export
- Deletion is permanent and cannot be undone
- All related data (S3 files, database records, vector embeddings) is removed

### Audit Logging
- All export and deletion operations are logged with:
  - User ID
  - Timestamp
  - Operation type
  - Success/failure status

---

## Implementation Notes

### Current Status
The endpoints are implemented with placeholder logic for database operations. The following need to be connected:

1. **Storage Backend:** Connect to actual database for conversations and memory
2. **Document Manager:** Connect to S3 for document operations
3. **Consent Manager:** Connect to consent tracking system
4. **Vector Database:** Connect to Pinecone/FAISS for embedding deletion

### Error Handling
- Partial failures are handled gracefully
- Export continues even if some sections fail (errors recorded in response)
- Deletion continues even if some sections fail (errors recorded in summary)

### Performance
- Export operations may take time for users with large datasets
- Consider implementing pagination or streaming for very large exports
- Deletion operations are performed synchronously but could be made async for large datasets

---

## Testing

Unit tests are provided in `tests/unit/test_user_data_api.py` covering:
- Successful export and deletion
- Response structure validation
- Error handling
- GDPR compliance requirements

Run tests with:
```bash
python -m pytest src/magna_ai/backend/tests/unit/test_user_data_api.py -v
```

---

## Compliance

These endpoints help satisfy:
- **GDPR Article 15:** Right of access (data export)
- **GDPR Article 17:** Right to erasure (data deletion)
- **CCPA:** Consumer rights to data access and deletion

---

## Future Enhancements

1. **Async Deletion:** Make deletion async for large datasets with status polling
2. **Selective Export:** Allow users to export specific data types
3. **Export Formats:** Support additional formats (CSV, XML)
4. **Deletion Confirmation:** Add email confirmation before deletion
5. **Data Retention:** Implement configurable retention periods
6. **Anonymization:** Option to anonymize instead of delete for analytics
