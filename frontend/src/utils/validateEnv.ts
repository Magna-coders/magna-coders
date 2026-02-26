/**
 * Environment Variable Validation
 * 
 * Validates that all required environment variables are set.
 * Logs warnings for missing or default values.
 */

interface EnvConfig {
  NEXT_PUBLIC_API_URL: string;
  NEXT_PUBLIC_AI_BACKEND_URL: string;
  NODE_ENV: string;
}

/**
 * Validate environment variables on app startup
 * 
 * @returns Configuration object with validated environment variables
 * @throws Error if required variables are missing
 */
export function validateEnv(): EnvConfig {
  const config: EnvConfig = {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
    NEXT_PUBLIC_AI_BACKEND_URL: process.env.NEXT_PUBLIC_AI_BACKEND_URL || '',
    NODE_ENV: process.env.NODE_ENV || 'development',
  };

  // Check for missing required variables
  const missingVars: string[] = [];

  if (!config.NEXT_PUBLIC_API_URL) {
    missingVars.push('NEXT_PUBLIC_API_URL');
  }

  if (!config.NEXT_PUBLIC_AI_BACKEND_URL) {
    missingVars.push('NEXT_PUBLIC_AI_BACKEND_URL');
  }

  // Log errors for missing variables
  if (missingVars.length > 0) {
    console.error(
      '❌ Missing required environment variables:',
      missingVars.join(', ')
    );
    console.error('Please check your .env.local file and ensure all required variables are set.');
    console.error('See .env.example for reference.');
  }

  // Warn about using localhost in production
  if (config.NODE_ENV === 'production') {
    if (config.NEXT_PUBLIC_API_URL.includes('localhost')) {
      console.warn(
        '⚠️  WARNING: Using localhost for API_URL in production environment!'
      );
    }
    if (config.NEXT_PUBLIC_AI_BACKEND_URL.includes('localhost')) {
      console.warn(
        '⚠️  WARNING: Using localhost for AI_BACKEND_URL in production environment!'
      );
    }
  }

  // Log configuration in development
  if (config.NODE_ENV === 'development') {
    console.log('🔧 Environment Configuration:');
    console.log('  - API URL:', config.NEXT_PUBLIC_API_URL || '(not set)');
    console.log('  - AI Backend URL:', config.NEXT_PUBLIC_AI_BACKEND_URL || '(not set)');
    console.log('  - Environment:', config.NODE_ENV);
  }

  return config;
}

/**
 * Check if AI backend is reachable
 * 
 * @param aiBackendUrl - URL of the AI backend
 * @returns Promise that resolves to true if backend is reachable
 */
export async function checkAIBackendHealth(aiBackendUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${aiBackendUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.ok;
  } catch (error) {
    console.warn('⚠️  AI Backend health check failed:', error);
    return false;
  }
}

/**
 * Initialize environment validation on app startup
 * Call this in your root layout or app component
 */
export function initializeEnv(): void {
  if (typeof window !== 'undefined') {
    const config = validateEnv();
    
    // Optionally check AI backend health
    if (config.NEXT_PUBLIC_AI_BACKEND_URL) {
      checkAIBackendHealth(config.NEXT_PUBLIC_AI_BACKEND_URL).then((isHealthy) => {
        if (!isHealthy) {
          console.warn(
            '⚠️  AI Backend is not responding. Magna AI features may not work correctly.'
          );
        } else {
          console.log('✅ AI Backend is healthy');
        }
      });
    }
  }
}
