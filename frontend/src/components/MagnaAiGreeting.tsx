'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import MagnaNewIcon from '@/components/MagnaNewIcon';
import { magnaAIService, UserContext } from '@/services/magnaAiService';

interface MagnaAiGreetingProps {
  isDarkMode?: boolean;
  authToken?: string;
}

/**
 * AI Greeting Component
 * 
 * Displays a personalized greeting with the user's name fetched from the AI backend.
 * 
 * Features:
 * - Fetches user context on mount
 * - Displays personalized greeting with user name
 * - Shows loading indicator while fetching
 * - Displays generic greeting on error
 * - Completes within 2 seconds
 */
export default function MagnaAiGreeting({ 
  isDarkMode = false,
  authToken 
}: MagnaAiGreetingProps) {
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchUserContext = async () => {
      // Set a 2-second timeout to ensure we complete within requirement
      const timeoutId = setTimeout(() => {
        if (loading) {
          setLoading(false);
          setError(true);
        }
      }, 2000);

      try {
        // Set auth token if provided
        if (authToken) {
          magnaAIService.setAuthToken(authToken);
        }

        // Fetch user context
        const context = await magnaAIService.getUserContext();
        setUserContext(context);
        setError(false);
      } catch (err) {
        console.error('Failed to fetch user context:', err);
        setError(true);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    fetchUserContext();
  }, [authToken]);

  // Get user name from context, fallback to generic greeting
  const userName = userContext?.name || userContext?.username || 'there';
  const isPersonalized = userContext?.name || userContext?.username;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full text-left"
    >
      {loading ? (
        // Loading state
        <div className="flex items-center gap-3">
          <MagnaNewIcon className="w-8 h-8 text-[#E50914] animate-pulse" />
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      ) : (
        // Greeting with user name
        <h1 className="text-2xl md:text-3xl font-medium tracking-tight mb-4 text-[#F4A261] flex items-center gap-2">
          <MagnaNewIcon className="w-8 h-8 text-[#E50914]" />
          <span className="font-bold">
            Hi <span className="text-[#E50914]">{userName}</span>
            {!isPersonalized && error && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                (Unable to load profile)
              </span>
            )}
          </span>
        </h1>
      )}
      
      <p 
        className={`text-2xl md:text-4xl font-medium leading-snug break-words max-w-full ${
          isDarkMode ? 'text-[#F4A261]' : 'text-[#E50914]'
        }`}
      >
        I help you solve technical problems, design systems, write code, and turn ideas into working software — fast.
      </p>
    </motion.div>
  );
}
