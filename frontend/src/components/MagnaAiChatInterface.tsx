'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Clock } from 'lucide-react';
import MagnaChatInput from './MagnaChatInput';
import MagnaMessageBubble from './MagnaMessageBubble';
import MagnaNewIcon from './MagnaNewIcon';
import { magnaAIService, AIResponse, RateLimitError } from '@/services/magnaAiService';

interface Message {
  id: string;
  sender: string;
  text: string;
  time: string;
  avatar: string | React.ReactNode;
  isMe: boolean;
  isLoading?: boolean;
}

interface MagnaAiChatInterfaceProps {
  isDarkMode?: boolean;
  authToken?: string;
  conversationId?: string;
  onConversationIdChange?: (id: string) => void;
}

/**
 * AI Chat Interface Component
 * 
 * Provides a complete chat interface for interacting with the AI agent.
 * 
 * Features:
 * - Message input with send button
 * - Message history display
 * - Support for streaming responses
 * - Display error messages for all error conditions
 * - Rate limit error handling with retry time
 * - Request debouncing (300ms) to prevent excessive API calls
 */
export default function MagnaAiChatInterface({
  isDarkMode = false,
  authToken,
  conversationId,
  onConversationIdChange
}: MagnaAiChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<{ retryAfter: number; timestamp: number } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingMessageIdRef = useRef<string | null>(null);
  const sendTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set auth token when provided
  useEffect(() => {
    if (authToken) {
      magnaAIService.setAuthToken(authToken);
    }
  }, [authToken]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle rate limit countdown
  useEffect(() => {
    if (!rateLimitInfo) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - rateLimitInfo.timestamp;
      const remaining = rateLimitInfo.retryAfter - Math.floor(elapsed / 1000);

      if (remaining <= 0) {
        setRateLimitInfo(null);
        setError(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [rateLimitInfo]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (sendTimeoutRef.current) {
        clearTimeout(sendTimeoutRef.current);
      }
    };
  }, []);

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  /**
   * Debounced send message handler
   * Implements 300ms debouncing to prevent excessive API calls
   */
  const debouncedSendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isStreaming) return;

    // Check if rate limited
    if (rateLimitInfo) {
      const elapsed = Date.now() - rateLimitInfo.timestamp;
      const remaining = rateLimitInfo.retryAfter - Math.floor(elapsed / 1000);
      if (remaining > 0) {
        return; // Still rate limited
      }
      // Rate limit expired, clear it
      setRateLimitInfo(null);
      setError(null);
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'You',
      text: messageText,
      time: formatTime(),
      avatar: 'U',
      isMe: true
    };

    setMessages(prev => [...prev, userMessage]);
    setError(null);

    // Create AI loading message
    const aiMessageId = `ai-${Date.now()}`;
    streamingMessageIdRef.current = aiMessageId;
    
    const aiMessage: Message = {
      id: aiMessageId,
      sender: 'Magna AI',
      text: 'Thinking...',
      time: formatTime(),
      avatar: <MagnaNewIcon className="w-4 h-4 text-[#E50914]" />,
      isMe: false,
      isLoading: true
    };

    setMessages(prev => [...prev, aiMessage]);
    setIsStreaming(true);

    try {
      let streamedContent = '';

      await magnaAIService.streamMessage(
        userMessage.text,
        conversationId,
        (chunk: string) => {
          // Append chunk to streamed content
          streamedContent += chunk;

          // Update the AI message with accumulated content
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessageId
                ? { ...msg, text: streamedContent, isLoading: false }
                : msg
            )
          );
        },
        (error: Error) => {
          // Handle streaming error
          console.error('Streaming error:', error);
          
          if (error instanceof RateLimitError) {
            setRateLimitInfo({
              retryAfter: error.retryAfter,
              timestamp: Date.now()
            });
            setError(`Rate limit exceeded. Please wait ${error.retryAfter} seconds before trying again.`);
          } else {
            setError(error.message || 'Failed to get response from AI. Please try again.');
          }

          // Remove the loading message
          setMessages(prev => prev.filter(msg => msg.id !== aiMessageId));
        },
        () => {
          // Streaming complete
          setIsStreaming(false);
          streamingMessageIdRef.current = null;
        }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      
      if (error instanceof RateLimitError) {
        setRateLimitInfo({
          retryAfter: error.retryAfter,
          timestamp: Date.now()
        });
        setError(`Rate limit exceeded. Please wait ${error.retryAfter} seconds before trying again.`);
      } else if (error instanceof Error) {
        setError(error.message || 'Failed to send message. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }

      // Remove the loading message
      setMessages(prev => prev.filter(msg => msg.id !== aiMessageId));
      setIsStreaming(false);
      streamingMessageIdRef.current = null;
    }
  }, [isStreaming, rateLimitInfo, conversationId]);

  /**
   * Handle send message with 300ms debouncing
   */
  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() || isStreaming) return;

    const messageToSend = inputValue;
    setInputValue(''); // Clear input immediately for better UX

    // Clear any existing timeout
    if (sendTimeoutRef.current) {
      clearTimeout(sendTimeoutRef.current);
    }

    // Debounce the actual send by 300ms
    sendTimeoutRef.current = setTimeout(() => {
      debouncedSendMessage(messageToSend);
    }, 300);
  }, [inputValue, isStreaming, debouncedSendMessage]);

  const getRateLimitTimeRemaining = () => {
    if (!rateLimitInfo) return 0;
    const elapsed = Date.now() - rateLimitInfo.timestamp;
    return Math.max(0, rateLimitInfo.retryAfter - Math.floor(elapsed / 1000));
  };

  const isRateLimited = rateLimitInfo && getRateLimitTimeRemaining() > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mx-4 mt-4 p-4 rounded-lg border ${
              isRateLimited
                ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
            }`}
          >
            <div className="flex items-start gap-3">
              {isRateLimited ? (
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  isRateLimited
                    ? 'text-yellow-800 dark:text-yellow-200'
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {error}
                </p>
                {isRateLimited && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    Time remaining: {getRateLimitTimeRemaining()} seconds
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">Start a conversation with Magna AI</p>
          </div>
        ) : (
          messages.map((message) => (
            <MagnaMessageBubble
              key={message.id}
              id={message.id}
              sender={message.sender}
              text={message.text}
              time={message.time}
              avatar={message.avatar}
              isMe={message.isMe}
              isDarkMode={isDarkMode}
              isLoading={message.isLoading}
              loadingIcon={message.isLoading ? <MagnaNewIcon className="w-3 h-3 text-[#E50914]" /> : undefined}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 md:px-6 pb-4 pt-2">
        <MagnaChatInput
          searchQuery={inputValue}
          setSearchQuery={setInputValue}
          handleSendMessage={handleSendMessage}
          isDarkMode={isDarkMode}
          inputRef={inputRef as React.RefObject<HTMLTextAreaElement>}
          className={isRateLimited ? 'opacity-50 pointer-events-none' : ''}
        />
        {isRateLimited && (
          <p className="text-xs text-center text-gray-500 mt-2">
            Input disabled due to rate limit. Please wait {getRateLimitTimeRemaining()} seconds.
          </p>
        )}
      </div>
    </div>
  );
}
