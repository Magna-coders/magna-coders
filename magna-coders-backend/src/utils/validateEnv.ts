/**
 * Environment Variable Validation Utility
 * 
 * Validates that all required environment variables are set on startup.
 * Throws an error if any required variables are missing.
 */

interface EnvConfig {
  // Server
  PORT: string;
  NODE_ENV: string;
  
  // Database
  DATABASE_URL: string;
  
  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  
  // CORS
  FRONTEND_URL: string;
  
  // AI Backend Integration
  AI_API_KEY: string;
  AI_BACKEND_URL: string;
}

const requiredEnvVars: (keyof EnvConfig)[] = [
  'PORT',
  'NODE_ENV',
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'FRONTEND_URL',
  'AI_API_KEY',
  'AI_BACKEND_URL',
];

/**
 * Validates that all required environment variables are set.
 * Logs warnings for missing optional variables.
 * Throws an error if any required variables are missing.
 */
export function validateEnv(): void {
  const missingVars: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  // Validate AI_API_KEY length (must be at least 32 characters)
  if (process.env.AI_API_KEY && process.env.AI_API_KEY.length < 32) {
    warnings.push('AI_API_KEY should be at least 32 characters long for security');
  }

  // Validate JWT_SECRET length (should be strong)
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    warnings.push('JWT_SECRET should be at least 32 characters long for security');
  }

  // Check for default/insecure values in production
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET?.includes('change-this')) {
      missingVars.push('JWT_SECRET (using default value in production)');
    }
    if (process.env.AI_API_KEY?.includes('change-in-production')) {
      missingVars.push('AI_API_KEY (using default value in production)');
    }
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn('⚠️  Environment Configuration Warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }

  // Throw error if required variables are missing
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease set these variables in your .env file.');
    console.error('See .env.example for reference.\n');
    throw new Error('Missing required environment variables');
  }

  console.log('✅ Environment variables validated successfully');
}

/**
 * Gets a typed environment configuration object.
 * Should only be called after validateEnv().
 */
export function getEnvConfig(): EnvConfig {
  return {
    PORT: process.env.PORT!,
    NODE_ENV: process.env.NODE_ENV!,
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN!,
    FRONTEND_URL: process.env.FRONTEND_URL!,
    AI_API_KEY: process.env.AI_API_KEY!,
    AI_BACKEND_URL: process.env.AI_BACKEND_URL!,
  };
}
