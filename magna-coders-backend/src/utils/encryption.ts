import crypto from 'crypto';
import { SECRET } from './config';

/**
 * Token Encryption Utility
 * 
 * Provides secure encryption and decryption for OAuth tokens using AES-256-GCM.
 * Tokens are encrypted before storage in the database to protect sensitive credentials.
 * 
 * Security features:
 * - AES-256-GCM authenticated encryption
 * - PBKDF2 key derivation from JWT_SECRET
 * - Unique IV (Initialization Vector) per encryption operation
 * - Authentication tag for integrity verification
 * 
 * Format: iv:authTag:encryptedData (all base64 encoded)
 */

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT = 'oauth-token-salt'; // Static salt for key derivation
const ITERATIONS = 100000; // PBKDF2 iterations

/**
 * Derives an encryption key from the JWT_SECRET using PBKDF2
 * 
 * @returns {Buffer} 32-byte encryption key
 * @throws {Error} If JWT_SECRET is not configured
 */
function deriveKey(): Buffer {
  if (!SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  
  return crypto.pbkdf2Sync(
    SECRET,
    SALT,
    ITERATIONS,
    KEY_LENGTH,
    'sha256'
  );
}

/**
 * Encrypts a token string using AES-256-GCM
 * 
 * @param {string} token - The plaintext token to encrypt
 * @returns {string} Encrypted token in format: iv:authTag:encryptedData (base64)
 * 
 * @example
 * const encrypted = encryptToken('ya29.a0AfH6SMBx...');
 * // Returns: "rT5k8pL3mN9q...==:xY2wZ4vU6tS8...==:aB1cD2eF3gH4..."
 */
export function encryptToken(token: string): string {
  const key = deriveKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(token, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:encryptedData
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypts a token string that was encrypted with encryptToken()
 * 
 * @param {string} encryptedToken - Encrypted token in format: iv:authTag:encryptedData
 * @returns {string} The original plaintext token
 * @throws {Error} If the encrypted token format is invalid or decryption fails
 * 
 * @example
 * const decrypted = decryptToken('rT5k8pL3mN9q...==:xY2wZ4vU6tS8...==:aB1cD2eF3gH4...');
 * // Returns: "ya29.a0AfH6SMBx..."
 */
export function decryptToken(encryptedToken: string): string {
  const key = deriveKey();
  const parts = encryptedToken.split(':');
  
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format');
  }
  
  const iv = Buffer.from(parts[0]!, 'base64');
  const authTag = Buffer.from(parts[1]!, 'base64');
  const encrypted = parts[2]!;
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted: string = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
