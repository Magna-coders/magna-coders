"""Example usage of document management and consent system.

This module demonstrates the complete flow for document upload and submission
with consent enforcement, showing how all components work together.
"""

import asyncio
import base64
from datetime import datetime

from .consent import ConsentManager
from .manager import DocumentManager
from .models import DocumentType


async def main():
    """Demonstrate complete document management and consent flow."""
    print("=" * 70)
    print("Document Management and Consent System - Example Usage")
    print("=" * 70)
    print()
    
    # Initialize managers
    document_manager = DocumentManager()
    consent_manager = document_manager._consent_manager
    
    # Sample data
    user_id = "550e8400-e29b-41d4-a716-446655440000"
    opportunity_id = "770e8400-e29b-41d4-a716-446655440002"
    
    # Sample resume content
    resume_content = b"""
    JOHN DOE
    Software Engineer
    
    SKILLS:
    - Python, JavaScript, TypeScript
    - React, Node.js, FastAPI
    - AWS, Docker, PostgreSQL
    
    EXPERIENCE:
    Senior Developer at Tech Corp (2020-2024)
    - Built scalable microservices
    - Led team of 5 developers
    - Improved system performance by 40%
    """
    
    print("STEP 1: Upload Document")
    print("-" * 70)
    try:
        metadata = await document_manager.upload_document(
            user_id=user_id,
            file_data=resume_content,
            filename="john_doe_resume.txt",
            document_type=DocumentType.RESUME
        )
        print(f"✓ Document uploaded successfully!")
        print(f"  Document ID: {metadata.document_id}")
        print(f"  Filename: {metadata.filename}")
        print(f"  Type: {metadata.document_type.value}")
        print(f"  Size: {metadata.file_size_bytes} bytes")
        print(f"  Uploaded at: {metadata.uploaded_at.isoformat()}")
        print()
        
        document_id = metadata.document_id
    except Exception as e:
        print(f"✗ Upload failed: {e}")
        return
    
    print("STEP 2: Retrieve User's Documents")
    print("-" * 70)
    documents = await document_manager.get_user_documents(user_id)
    print(f"✓ Found {len(documents)} document(s) for user")
    for doc in documents:
        print(f"  - {doc.filename} ({doc.document_type.value})")
    print()
    
    print("STEP 3: Request Consent for Document Submission")
    print("-" * 70)
    consent_request = await consent_manager.request_submission_consent(
        user_id=user_id,
        document_id=document_id,
        target_opportunity_id=opportunity_id,
        document_filename="john_doe_resume.txt",
        opportunity_title="Senior Python Developer at Magna Coders"
    )
    print(f"✓ Consent request created!")
    print(f"  Request ID: {consent_request.id}")
    print(f"  Action: {consent_request.action_description}")
    print(f"  Required data: {', '.join(consent_request.required_data)}")
    print(f"  Status: {consent_request.status.value}")
    print(f"  Expires at: {consent_request.expires_at.isoformat()}")
    print()
    
    print("STEP 4: User Reviews and Approves Consent")
    print("-" * 70)
    print("User sees consent dialog:")
    print(f"  '{consent_request.action_description}'")
    print("  [Approve] [Deny]")
    print()
    print("User clicks [Approve]...")
    print()
    
    consent_response = await consent_manager.process_consent(
        consent_request_id=consent_request.id,
        approved=True,
        user_id=user_id
    )
    print(f"✓ Consent approved!")
    print(f"  Approved: {consent_response.approved}")
    print(f"  Token generated: {consent_response.consent_token[:32]}...")
    print(f"  Timestamp: {consent_response.timestamp.isoformat()}")
    print()
    
    print("STEP 5: Submit Document with Consent Token")
    print("-" * 70)
    result = await document_manager.submit_document(
        user_id=user_id,
        document_id=document_id,
        target_opportunity_id=opportunity_id,
        consent_token=consent_response.consent_token
    )
    
    if result.success:
        print(f"✓ Document submitted successfully!")
        print(f"  Submission ID: {result.submission_id}")
        print(f"  Document ID: {result.document_id}")
        print(f"  Opportunity ID: {result.opportunity_id}")
        print(f"  Submitted at: {result.submitted_at.isoformat()}")
        print(f"  Confirmation: {result.confirmation}")
    else:
        print(f"✗ Submission failed: {result.error}")
    print()
    
    print("STEP 6: Demonstrate Security - Try to Submit Without Consent")
    print("-" * 70)
    print("Attempting to submit without consent token...")
    result_no_consent = await document_manager.submit_document(
        user_id=user_id,
        document_id=document_id,
        target_opportunity_id=opportunity_id,
        consent_token=""  # No token
    )
    
    if not result_no_consent.success:
        print(f"✓ Security check passed! Submission blocked.")
        print(f"  Error: {result_no_consent.error}")
    else:
        print(f"✗ SECURITY FAILURE! Submission should have been blocked!")
    print()
    
    print("STEP 7: Demonstrate Token Single-Use")
    print("-" * 70)
    print("Attempting to reuse the same consent token...")
    result_reuse = await document_manager.submit_document(
        user_id=user_id,
        document_id=document_id,
        target_opportunity_id=opportunity_id,
        consent_token=consent_response.consent_token  # Reusing token
    )
    
    if not result_reuse.success:
        print(f"✓ Single-use check passed! Token cannot be reused.")
        print(f"  Error: {result_reuse.error}")
    else:
        print(f"✗ SECURITY FAILURE! Token should be single-use!")
    print()
    
    print("STEP 8: Demonstrate Consent Denial Flow")
    print("-" * 70)
    # Create another consent request
    consent_request_2 = await consent_manager.request_submission_consent(
        user_id=user_id,
        document_id=document_id,
        target_opportunity_id="another-opportunity-id",
        document_filename="john_doe_resume.txt",
        opportunity_title="Another Opportunity"
    )
    print(f"✓ New consent request created: {consent_request_2.id}")
    print("User clicks [Deny]...")
    print()
    
    consent_response_denied = await consent_manager.process_consent(
        consent_request_id=consent_request_2.id,
        approved=False,
        user_id=user_id
    )
    print(f"✓ Consent denied!")
    print(f"  Approved: {consent_response_denied.approved}")
    print(f"  Token: {consent_response_denied.consent_token}")
    print(f"  Status: {consent_manager.get_consent_request(consent_request_2.id).status.value}")
    print()
    
    print("=" * 70)
    print("Example completed successfully!")
    print("=" * 70)
    print()
    print("Key Security Features Demonstrated:")
    print("  ✓ Document upload with validation")
    print("  ✓ Consent request generation with clear action description")
    print("  ✓ User approval/denial flow")
    print("  ✓ Secure token generation")
    print("  ✓ Consent enforcement - no submission without valid token")
    print("  ✓ Single-use tokens - cannot be reused")
    print("  ✓ Token validation - checks user, action type, and target")
    print()


if __name__ == "__main__":
    asyncio.run(main())
