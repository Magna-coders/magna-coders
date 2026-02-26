/**
 * Magna AI Service
 * 
 * Service module for communicating with the Magna AI backend.
 * Handles authentication, user context fetching, and chat messaging.
 */

/**
 * User context returned from the AI backend
 */
export interface UserContext {
  userId: string;
  name?: string;
  email?: string;
  username?: string;
  role?: string;
  skills?: string[];
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  location?: string;
  subscriptionTier?: 'free' | 'premium' | 'pro';
}

/**
 * AI response from the chat endpoint
 */
export interface AIResponse {
  conversation_id: string;
  message_id: string;
  content: string;
  timestamp: string;
  tool_calls?: any[];
  results?: any[];
  requires_consent?: any;
}

/**
 * Rate limit error with retry information
 */
export class RateLimitError extends Error {
  retryAfter: number;

  constructor(message: string, retryAfter: number = 60) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Magna AI Service class
 * 
 * Provides methods for interacting with the AI backend:
 * - setAuthToken: Set JWT token for authentication
 * - getUserContext: Fetch user profile context
 * - sendMessage: Send a message and get a response
 * - streamMessage: Send a message and stream the response
 */
class MagnaAIService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor() {
    // Get AI backend URL from environment, default to localhost:8000
    this.baseUrl = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:8000';
  }

  /**
   * Set the JWT authentication token
   * 
   * @param token - JWT token from user authentication
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Clear the authentication token
   */
  clearAuthToken(): void {
    this.authToken = null;
  }

  /**
   * Make an authenticated request to the AI backend
   * 
   * @param endpoint - API endpoint path
   * @param options - Fetch options
   * @returns Response from the API
   * @throws Error if authentication fails or network error occurs
   */
  private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    // Get auth token from localStorage if not already set
    if (!this.authToken && typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
      if (token) {
        this.authToken = token;
      }
    }

    // Ensure auth token is set
    if (!this.authToken) {
      throw new Error('Authentication token not set');
    }

    // Add authentication header
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authToken}`,
      ...options.headers,
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized - clear token and throw error
      if (response.status === 401) {
        this.clearAuthToken();
        throw new Error('Unauthorized - please log in again');
      }

      // Handle 429 Rate Limit
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
        throw new RateLimitError(
          `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
          retryAfter
        );
      }

      return response;
    } catch (error) {
      // Handle network errors
      if (error instanceof RateLimitError) {
        throw error;
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(
          'Unable to connect to AI service. Please check your internet connection and try again.'
        );
      }

      throw error;
    }
  }

  /**
   * Get user context from the AI backend
   * 
   * Fetches the authenticated user's profile information including
   * name, role, skills, experience level, and subscription tier.
   * 
   * @returns User context object
   * @throws Error if request fails or user is unauthorized
   */
  async getUserContext(): Promise<UserContext> {
    try {
      const response = await this.request('/api/user/context');

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('Failed to fetch user context:', response.status, errorText);
        throw new Error(`Failed to fetch user context: ${response.status}`);
      }

      const data = await response.json();
      
      // The AI backend returns the context directly or wrapped in a data field
      // Handle both formats for compatibility
      const context = data.data || data;
      
      console.log('User context fetched successfully:', context);
      return context;
    } catch (error) {
      console.error('Error in getUserContext:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while fetching user context');
    }
  }

  /**
   * Send a message to the AI agent
   * 
   * Sends a message to the AI backend and receives a complete response.
   * Use this for non-streaming responses.
   * 
   * @param message - User message to send
   * @param sessionId - Optional conversation/session ID
   * @returns AI response with content and metadata
   * @throws Error if request fails, rate limited, or unauthorized
   */
  async sendMessage(message: string, sessionId?: string): Promise<AIResponse> {
    try {
      const response = await this.request('/api/chat/message', {
        method: 'POST',
        body: JSON.stringify({
          message,
          conversation_id: sessionId,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to send message');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while sending message');
    }
  }

  /**
   * Send a message and stream the response
   * 
   * Sends a message to the AI backend and streams the response in real-time.
   * Uses Server-Sent Events (SSE) for streaming.
   * 
   * @param message - User message to send
   * @param sessionId - Optional conversation/session ID
   * @param onChunk - Callback function called for each chunk of the response
   * @param onError - Optional callback for handling errors
   * @param onComplete - Optional callback when streaming completes
   * @throws Error if request fails or unauthorized
   */
  async streamMessage(
    message: string,
    sessionId: string | undefined,
    onChunk: (chunk: string) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void
  ): Promise<void> {
    try {
      const response = await this.request('/api/chat/stream', {
        method: 'POST',
        body: JSON.stringify({
          message,
          conversation_id: sessionId,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to stream message');
      }

      // Read the response as a stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          // Decode the chunk
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Process complete lines (SSE format: "data: content\n\n")
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const content = line.slice(6); // Remove "data: " prefix

              // Check for completion marker - don't display it
              if (content === '[DONE]' || content.trim() === '[DONE]') {
                if (onComplete) {
                  onComplete();
                }
                return;
              }

              // Check for error
              if (content.startsWith('Error: ')) {
                const errorMsg = content.slice(7);
                throw new Error(errorMsg);
              }

              // Call the chunk callback with the content (skip [DONE] marker)
              if (content.trim() && content.trim() !== '[DONE]') {
                onChunk(content);
              }
            }
          }
        }

        // If we exit the loop without seeing [DONE], still call onComplete
        if (onComplete) {
          onComplete();
        }
      } catch (error) {
        if (onError && error instanceof Error) {
          onError(error);
        } else {
          throw error;
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error);
      } else if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('An unexpected error occurred while streaming message');
      }
    }
  }
}

// Export singleton instance
export const magnaAIService = new MagnaAIService();
