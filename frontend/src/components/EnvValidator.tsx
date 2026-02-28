'use client';

import { useEffect } from 'react';
import { initializeEnv } from '@/utils/validateEnv';

/**
 * Environment Validator Component
 * 
 * Validates environment variables on app startup.
 * This is a client component that runs validation in the browser.
 */
export function EnvValidator() {
  useEffect(() => {
    initializeEnv();
  }, []);

  return null; // This component doesn't render anything
}
