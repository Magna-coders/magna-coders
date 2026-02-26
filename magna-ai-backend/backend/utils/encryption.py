"""
Encryption utilities for secure data handling using AES-256.

This module provides AES-256-GCM encryption for securing memory data
during backend synchronization, meeting GDPR compliance requirements.
"""

import os
import base64
from typing import Union

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


def encrypt_data(data: Union[str, bytes], key: str) -> bytes:
    """
    Encrypt data using AES-256-GCM encryption.
    
    AES-256-GCM provides:
    - 256-bit key strength
    - Authenticated encryption (prevents tampering)
    - Galois/Counter Mode for performance
    
    The encrypted output format is: nonce (12 bytes) + ciphertext + tag (16 bytes)
    
    Args:
        data: Data to encrypt (string or bytes)
        key: Encryption key (32 bytes for AES-256, base64-encoded or raw string)
        
    Returns:
        Encrypted data as bytes (nonce + ciphertext + tag)
        
    Raises:
        ValueError: If key length is invalid
        
    Example:
        >>> key = generate_encryption_key()
        >>> encrypted = encrypt_data("sensitive data", key)
        >>> decrypted = decrypt_data(encrypted, key)
        >>> assert decrypted == "sensitive data"
    """
    # Convert string data to bytes
    if isinstance(data, str):
        data = data.encode('utf-8')
    
    # Derive 32-byte key from input key string
    key_bytes = _derive_key(key)
    
    # Generate random 96-bit nonce (12 bytes) for GCM
    nonce = os.urandom(12)
    
    # Create AES-GCM cipher with 256-bit key
    aesgcm = AESGCM(key_bytes)
    
    # Encrypt and authenticate
    # GCM automatically appends 16-byte authentication tag
    ciphertext = aesgcm.encrypt(nonce, data, None)
    
    # Return nonce + ciphertext (which includes tag)
    return nonce + ciphertext


def decrypt_data(encrypted_data: bytes, key: str) -> str:
    """
    Decrypt data using AES-256-GCM encryption.
    
    Args:
        encrypted_data: Encrypted data as bytes (nonce + ciphertext + tag)
        key: Encryption key (32 bytes for AES-256, base64-encoded or raw string)
        
    Returns:
        Decrypted data as string
        
    Raises:
        ValueError: If key length is invalid or data is corrupted
        cryptography.exceptions.InvalidTag: If authentication fails (data tampered)
        
    Example:
        >>> key = generate_encryption_key()
        >>> encrypted = encrypt_data("test", key)
        >>> decrypted = decrypt_data(encrypted, key)
        >>> assert decrypted == "test"
    """
    # Derive 32-byte key from input key string
    key_bytes = _derive_key(key)
    
    # Extract nonce (first 12 bytes)
    nonce = encrypted_data[:12]
    
    # Extract ciphertext + tag (remaining bytes)
    ciphertext = encrypted_data[12:]
    
    # Create AES-GCM cipher with 256-bit key
    aesgcm = AESGCM(key_bytes)
    
    # Decrypt and verify authentication tag
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    
    return plaintext.decode('utf-8')


def generate_encryption_key() -> str:
    """
    Generate a cryptographically secure 256-bit encryption key.
    
    Returns:
        Base64-encoded 32-byte (256-bit) encryption key
        
    Example:
        >>> key = generate_encryption_key()
        >>> len(base64.b64decode(key))
        32
    """
    # Generate 32 random bytes (256 bits) for AES-256
    key_bytes = os.urandom(32)
    
    # Encode as base64 for easy storage/transmission
    return base64.b64encode(key_bytes).decode('utf-8')


def _derive_key(key: str) -> bytes:
    """
    Derive a 32-byte key from input string using PBKDF2.
    
    This allows flexible key input formats:
    - Base64-encoded 32-byte keys (from generate_encryption_key)
    - Raw password strings (derived to 32 bytes)
    
    Args:
        key: Input key string
        
    Returns:
        32-byte key suitable for AES-256
        
    Raises:
        ValueError: If key is empty
    """
    if not key:
        raise ValueError("Encryption key cannot be empty")
    
    # Try to decode as base64 first
    try:
        decoded = base64.b64decode(key)
        if len(decoded) == 32:
            # Valid 32-byte base64-encoded key
            return decoded
    except Exception:
        pass
    
    # If not valid base64 or wrong length, derive key using PBKDF2
    # Use a fixed salt for deterministic key derivation
    # In production, consider storing salt with encrypted data
    salt = b'magna_ai_memory_encryption_salt_v1'
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,  # 256 bits
        salt=salt,
        iterations=100000,  # OWASP recommended minimum
    )
    
    return kdf.derive(key.encode('utf-8'))
