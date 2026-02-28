import { Prisma } from '@prisma/client';
import crypto from 'crypto';

/**
 * Username Generation Utility
 * 
 * Generates unique usernames from email addresses for OAuth users.
 * Handles collisions by appending numeric counters or UUID suffixes.
 * 
 * Algorithm:
 * 1. Extract base username from email (part before @)
 * 2. Remove special characters and convert to lowercase
 * 3. Check if username is available
 * 4. If taken, append counter (1, 2, 3, ...)
 * 5. After 1000 attempts, fallback to UUID suffix
 * 
 * @example
 * // Basic usage
 * const username = await generateUsername('john.doe@example.com', tx);
 * // Returns: "johndoe"
 * 
 * // With collision
 * const username = await generateUsername('john.doe@example.com', tx);
 * // Returns: "johndoe1" (if "johndoe" is taken)
 * 
 * // Extreme collision
 * const username = await generateUsername('john.doe@example.com', tx);
 * // Returns: "johndoe_a1b2c3d4" (after 1000 attempts)
 */

/**
 * Transaction type for Prisma operations
 * Supports both regular PrismaClient and transaction contexts
 */
type TransactionClient = Prisma.TransactionClient;

/**
 * Generates a unique username from an email address
 * 
 * @param {string} email - The email address to generate username from
 * @param {TransactionClient} tx - Prisma transaction client for database queries
 * @returns {Promise<string>} A unique username that doesn't exist in the database
 * 
 * @throws {Error} If email is invalid or empty
 * 
 * Requirements:
 * - Requirement 2.4: Generate unique username from email address
 * - Property 10: Unique Username Generation
 */
export async function generateUsername(
  email: string,
  tx: TransactionClient
): Promise<string> {
  // Validate email input
  if (!email || typeof email !== 'string') {
    throw new Error('Invalid email address');
  }
  
  // Extract base username from email (before @)
  const emailParts = email.split('@');
  if (emailParts.length < 2 || !emailParts[0]) {
    throw new Error('Invalid email format');
  }
  
  // Remove special characters and convert to lowercase
  // Keep only alphanumeric characters
  const baseUsername = emailParts[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  
  // Ensure we have at least some characters
  if (baseUsername.length === 0) {
    // Fallback to random username if email has no valid characters
    return `user_${crypto.randomUUID().slice(0, 8)}`;
  }
  
  // Check if base username is available
  let username = baseUsername;
  let counter = 1;
  const MAX_ATTEMPTS = 1000;
  
  while (counter <= MAX_ATTEMPTS) {
    // Check if username exists in database
    const existing = await tx.users.findUnique({
      where: { username },
      select: { id: true } // Only select id for performance
    });
    
    if (!existing) {
      // Username is available
      return username;
    }
    
    // Username is taken, try with counter
    username = `${baseUsername}${counter}`;
    counter++;
  }
  
  // Fallback to UUID suffix after 1000 attempts
  // This handles extreme collision scenarios
  const uuidSuffix = crypto.randomUUID().slice(0, 8);
  username = `${baseUsername}_${uuidSuffix}`;
  
  // Final check to ensure uniqueness (should always be unique with UUID)
  const finalCheck = await tx.users.findUnique({
    where: { username },
    select: { id: true }
  });
  
  if (finalCheck) {
    // Extremely unlikely, but use full UUID as last resort
    username = `user_${crypto.randomUUID()}`;
  }
  
  return username;
}
