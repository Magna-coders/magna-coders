"""
Unit tests for encryption utilities.
"""

import pytest
import base64

from ...utils.encryption import encrypt_data, decrypt_data, generate_encryption_key


def test_generate_encryption_key():
    """Test that generated keys are valid 256-bit keys."""
    key = generate_encryption_key()
    
    # Key should be base64-encoded
    assert isinstance(key, str)
    
    # Decode and verify it's 32 bytes (256 bits)
    key_bytes = base64.b64decode(key)
    assert len(key_bytes) == 32


def test_encrypt_decrypt_string():
    """Test encryption and decryption of string data."""
    key = generate_encryption_key()
    original_data = "This is sensitive user data that needs encryption"
    
    # Encrypt
    encrypted = encrypt_data(original_data, key)
    
    # Should return bytes
    assert isinstance(encrypted, bytes)
    
    # Encrypted data should be different from original
    assert encrypted != original_data.encode('utf-8')
    
    # Decrypt
    decrypted = decrypt_data(encrypted, key)
    
    # Should match original
    assert decrypted == original_data


def test_encrypt_decrypt_bytes():
    """Test encryption and decryption of bytes data (UTF-8 compatible)."""
    key = generate_encryption_key()
    # Use UTF-8 compatible bytes
    original_data = "Binary data with special chars: \n\t\r".encode('utf-8')
    
    # Encrypt
    encrypted = encrypt_data(original_data, key)
    
    # Decrypt
    decrypted_str = decrypt_data(encrypted, key)
    decrypted_bytes = decrypted_str.encode('utf-8')
    
    # Should match original
    assert decrypted_bytes == original_data


def test_encrypt_decrypt_unicode():
    """Test encryption and decryption of Unicode data."""
    key = generate_encryption_key()
    original_data = "Hello 世界 🌍 مرحبا"
    
    # Encrypt
    encrypted = encrypt_data(original_data, key)
    
    # Decrypt
    decrypted = decrypt_data(encrypted, key)
    
    # Should match original
    assert decrypted == original_data


def test_wrong_key_fails():
    """Test that decryption with wrong key fails."""
    from cryptography.exceptions import InvalidTag
    
    key1 = generate_encryption_key()
    key2 = generate_encryption_key()
    
    data = "Secret message"
    encrypted = encrypt_data(data, key1)
    
    # Decryption with wrong key should raise InvalidTag
    with pytest.raises(InvalidTag):
        decrypt_data(encrypted, key2)


def test_tampered_data_fails():
    """Test that tampered encrypted data fails authentication."""
    from cryptography.exceptions import InvalidTag
    
    key = generate_encryption_key()
    data = "Important data"
    encrypted = encrypt_data(data, key)
    
    # Tamper with the encrypted data
    tampered = bytearray(encrypted)
    tampered[-1] ^= 0xFF  # Flip bits in last byte
    tampered = bytes(tampered)
    
    # Decryption should fail due to authentication tag mismatch
    with pytest.raises(InvalidTag):
        decrypt_data(tampered, key)


def test_empty_string_encryption():
    """Test encryption of empty string."""
    key = generate_encryption_key()
    data = ""
    
    encrypted = encrypt_data(data, key)
    decrypted = decrypt_data(encrypted, key)
    
    assert decrypted == data


def test_large_data_encryption():
    """Test encryption of large data."""
    key = generate_encryption_key()
    # Create 1MB of data
    data = "x" * (1024 * 1024)
    
    encrypted = encrypt_data(data, key)
    decrypted = decrypt_data(encrypted, key)
    
    assert decrypted == data


def test_password_based_key_derivation():
    """Test that password strings are properly derived to keys."""
    password = "my_secure_password_123"
    data = "Test data"
    
    # Encrypt with password
    encrypted = encrypt_data(data, password)
    
    # Decrypt with same password
    decrypted = decrypt_data(encrypted, password)
    
    assert decrypted == data


def test_deterministic_key_derivation():
    """Test that same password always derives same key."""
    password = "consistent_password"
    data = "Test data"
    
    # Encrypt twice with same password
    encrypted1 = encrypt_data(data, password)
    encrypted2 = encrypt_data(data, password)
    
    # Both should decrypt successfully with same password
    decrypted1 = decrypt_data(encrypted1, password)
    decrypted2 = decrypt_data(encrypted2, password)
    
    assert decrypted1 == data
    assert decrypted2 == data


def test_empty_key_raises_error():
    """Test that empty key raises ValueError."""
    with pytest.raises(ValueError, match="Encryption key cannot be empty"):
        encrypt_data("test", "")


def test_nonce_uniqueness():
    """Test that each encryption uses a unique nonce."""
    key = generate_encryption_key()
    data = "Same data"
    
    # Encrypt same data twice
    encrypted1 = encrypt_data(data, key)
    encrypted2 = encrypt_data(data, key)
    
    # Nonces (first 12 bytes) should be different
    nonce1 = encrypted1[:12]
    nonce2 = encrypted2[:12]
    
    assert nonce1 != nonce2
    
    # But both should decrypt to same data
    assert decrypt_data(encrypted1, key) == data
    assert decrypt_data(encrypted2, key) == data


def test_encryption_format():
    """Test that encrypted data has correct format (nonce + ciphertext + tag)."""
    key = generate_encryption_key()
    data = "Test"
    
    encrypted = encrypt_data(data, key)
    
    # Should have at least: 12 bytes (nonce) + len(data) + 16 bytes (tag)
    min_length = 12 + len(data) + 16
    assert len(encrypted) >= min_length
