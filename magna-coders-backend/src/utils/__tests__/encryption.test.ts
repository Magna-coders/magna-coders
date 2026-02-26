import { encryptToken, decryptToken } from '../encryption';

describe('Token Encryption Utilities', () => {
  describe('encryptToken', () => {
    it('should encrypt a token and return a string with correct format', () => {
      const token = 'ya29.a0AfH6SMBxTestToken123456789';
      const encrypted = encryptToken(token);
      
      // Should have format: iv:authTag:encryptedData
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(3);
      
      // Each part should be base64 encoded
      parts.forEach(part => {
        expect(part).toMatch(/^[A-Za-z0-9+/]+=*$/);
      });
    });

    it('should generate unique ciphertext for the same token (unique IVs)', () => {
      const token = 'test-token-123';
      const encrypted1 = encryptToken(token);
      const encrypted2 = encryptToken(token);
      
      // Different ciphertext due to unique IVs
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should handle empty string', () => {
      const encrypted = encryptToken('');
      expect(encrypted).toBeTruthy();
      expect(encrypted.split(':')).toHaveLength(3);
    });

    it('should handle very long tokens (>1000 chars)', () => {
      const longToken = 'x'.repeat(1500);
      const encrypted = encryptToken(longToken);
      expect(encrypted).toBeTruthy();
      expect(encrypted.split(':')).toHaveLength(3);
    });
  });

  describe('decryptToken', () => {
    it('should decrypt a token encrypted with encryptToken', () => {
      const originalToken = 'ya29.a0AfH6SMBxTestToken123456789';
      const encrypted = encryptToken(originalToken);
      const decrypted = decryptToken(encrypted);
      
      expect(decrypted).toBe(originalToken);
    });

    it('should handle round-trip encryption for various token lengths', () => {
      const tokens = [
        'short',
        'medium-length-token-with-some-chars',
        'x'.repeat(100),
        'x'.repeat(500),
        'x'.repeat(1500)
      ];

      tokens.forEach(token => {
        const encrypted = encryptToken(token);
        const decrypted = decryptToken(encrypted);
        expect(decrypted).toBe(token);
      });
    });

    it('should handle empty string round-trip', () => {
      const encrypted = encryptToken('');
      const decrypted = decryptToken(encrypted);
      expect(decrypted).toBe('');
    });

    it('should throw error for invalid format (missing parts)', () => {
      expect(() => decryptToken('invalid:format')).toThrow('Invalid encrypted token format');
    });

    it('should throw error for invalid format (single part)', () => {
      expect(() => decryptToken('invalidformat')).toThrow('Invalid encrypted token format');
    });

    it('should throw error for invalid format (too many parts)', () => {
      expect(() => decryptToken('part1:part2:part3:part4')).toThrow('Invalid encrypted token format');
    });

    it('should throw error for corrupted ciphertext', () => {
      const token = 'test-token';
      const encrypted = encryptToken(token);
      const parts = encrypted.split(':');
      
      // Corrupt the encrypted data
      const corrupted = `${parts[0]}:${parts[1]}:corrupted-data`;
      
      expect(() => decryptToken(corrupted)).toThrow();
    });

    it('should throw error for tampered auth tag', () => {
      const token = 'test-token';
      const encrypted = encryptToken(token);
      const parts = encrypted.split(':');
      
      // Tamper with auth tag
      const tampered = `${parts[0]}:AAAAAAAAAAAAAAAAAAAAAA==:${parts[2]}`;
      
      expect(() => decryptToken(tampered)).toThrow();
    });
  });

  describe('Security properties', () => {
    it('should produce different ciphertext for same plaintext (unique IVs)', () => {
      const token = 'test-token-for-iv-uniqueness';
      const encryptions = new Set<string>();
      
      // Generate 10 encryptions of the same token
      for (let i = 0; i < 10; i++) {
        encryptions.add(encryptToken(token));
      }
      
      // All should be unique
      expect(encryptions.size).toBe(10);
      
      // But all should decrypt to the same value
      encryptions.forEach(encrypted => {
        expect(decryptToken(encrypted)).toBe(token);
      });
    });

    it('should maintain data integrity (authenticated encryption)', () => {
      const token = 'sensitive-oauth-token';
      const encrypted = encryptToken(token);
      const parts = encrypted.split(':');
      
      // Try to modify the encrypted data slightly
      const modifiedData = parts[2]!.slice(0, -1) + 'X';
      const modified = `${parts[0]}:${parts[1]}:${modifiedData}`;
      
      // Should fail to decrypt due to auth tag mismatch
      expect(() => decryptToken(modified)).toThrow();
    });
  });

  describe('Real-world OAuth token scenarios', () => {
    it('should handle Google OAuth access token format', () => {
      const googleToken = 'ya29.a0AfH6SMBx1234567890abcdefghijklmnopqrstuvwxyz';
      const encrypted = encryptToken(googleToken);
      const decrypted = decryptToken(encrypted);
      expect(decrypted).toBe(googleToken);
    });

    it('should handle Google OAuth refresh token format', () => {
      const refreshToken = '1//0gHZqN9X1234567890abcdefghijklmnopqrstuvwxyz';
      const encrypted = encryptToken(refreshToken);
      const decrypted = decryptToken(encrypted);
      expect(decrypted).toBe(refreshToken);
    });

    it('should handle JWT id_token format', () => {
      const idToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1Njc4OTAifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIxMjM0NTY3ODkwLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIn0.signature';
      const encrypted = encryptToken(idToken);
      const decrypted = decryptToken(encrypted);
      expect(decrypted).toBe(idToken);
    });
  });
});
