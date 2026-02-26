/**
 * OAuth Environment Variable Validation Utility
 * 
 * Validates that all required OAuth environment variables are set on server startup.
 * Throws an error if any required variables are missing.
 */

interface OAuthEnvConfig {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}

const requiredOAuthVars: (keyof OAuthEnvConfig)[] = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
];

/**
 * Validates that all required OAuth environment variables are set.
 * Throws an error with missing variable names if validation fails.
 */
export function validateOAuthEnv(): void {
  const missingVars: string[] = [];
  const warnings: string[] = [];

  // Check required OAuth variables
  for (const varName of requiredOAuthVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  // Validate GOOGLE_CLIENT_SECRET length (should be strong)
  if (process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CLIENT_SECRET.length < 24) {
    warnings.push('GOOGLE_CLIENT_SECRET appears to be too short - verify it is correct');
  }

  // Check for placeholder values
  if (process.env.GOOGLE_CLIENT_ID?.includes('your-client-id') || 
      process.env.GOOGLE_CLIENT_ID?.includes('placeholder')) {
    missingVars.push('GOOGLE_CLIENT_ID (using placeholder value)');
  }

  if (process.env.GOOGLE_CLIENT_SECRET?.includes('your-client-secret') || 
      process.env.GOOGLE_CLIENT_SECRET?.includes('placeholder')) {
    missingVars.push('GOOGLE_CLIENT_SECRET (using placeholder value)');
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn('⚠️  OAuth Configuration Warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }

  // Throw error if required variables are missing
  if (missingVars.length > 0) {
    console.error('❌ Missing required OAuth environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease set these variables in your .env file.');
    console.error('See .env.example for OAuth configuration.\n');
    throw new Error(`Missing required OAuth environment variables: ${missingVars.join(', ')}`);
  }

  console.log('✅ OAuth environment variables validated successfully');
}

/**
 * Gets a typed OAuth environment configuration object.
 * Should only be called after validateOAuthEnv().
 */
export function getOAuthEnvConfig(): OAuthEnvConfig {
  return {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
  };
}
