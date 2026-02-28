import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageBubbleProps } from '@/components/MagnaMessageBubble';
import { ChatSession } from '@/components/MagnaChatSidebar';
import MagnaNewIcon from '@/components/MagnaNewIcon';
import { magnaAIService, AIResponse, RateLimitError } from '@/services/magnaAiService';
import { useAuth } from '@/contexts/AuthContext';
import { Mic, BookOpen } from 'lucide-react';

export interface ToastConfig {
  isVisible: boolean;
  message: string;
}

export function useMagnaChat() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageBubbleProps[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showChatOptions, setShowChatOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toastConfig, setToastConfig] = useState<ToastConfig>({ isVisible: false, message: '' });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);
  
  const mobileInputRef = useRef<HTMLTextAreaElement>(null);
  const desktopInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations from localStorage
  const [conversations, setConversations] = useState<ChatSession[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('magnaAiConversations');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error('Failed to parse stored conversations:', e);
        }
      }
    }
    return [];
  });

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('magnaAiConversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  useEffect(() => {
    // Check initial theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }

    // Listen for theme changes
    const handleThemeChange = () => {
      const currentTheme = localStorage.getItem('theme');
      setIsDarkMode(currentTheme === 'dark');
    };

    window.addEventListener('themeChanged', handleThemeChange);
    window.addEventListener('storage', handleThemeChange);

    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
      window.removeEventListener('storage', handleThemeChange);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    [mobileInputRef, desktopInputRef].forEach(ref => {
      if (ref.current) {
        ref.current.style.height = 'auto';
        ref.current.style.height = `${Math.min(ref.current.scrollHeight, 80)}px`;
      }
    });
  }, [searchQuery]);

  const handleServiceClick = (service: string) => {
    setSelectedChat(service);
    const userMsg: MessageBubbleProps = {
      id: Date.now().toString(),
      sender: 'You',
      text: `I'm interested in ${service}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: 'U',
      isMe: true
    };
    setMessages([userMsg]);
    
    // Send to AI backend
    sendMessageToAI(`I'm interested in ${service}`);
  };

  const sendMessageToAI = async (messageText: string) => {
    if (!isAuthenticated) {
      setToastConfig({ isVisible: true, message: 'Please log in to use Magna AI' });
      router.push('/login');
      return;
    }

    setIsTyping(true);

    try {
      // Use streaming for real-time response
      let aiMessageId = (Date.now() + 1).toString();
      let accumulatedContent = '';

      await magnaAIService.streamMessage(
        messageText,
        currentSessionId,
        // onChunk callback
        (chunk: string) => {
          accumulatedContent += chunk;
          
          // Update or create AI message
          setMessages(prev => {
            const existingIndex = prev.findIndex(m => m.id === aiMessageId);
            const aiMsg: MessageBubbleProps = {
              id: aiMessageId,
              sender: 'Magna AI',
              text: accumulatedContent,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              avatar: <MagnaNewIcon className="w-5 h-5 text-red-600" />,
              color: 'bg-red-100'
            };

            if (existingIndex >= 0) {
              const newMessages = [...prev];
              newMessages[existingIndex] = aiMsg;
              return newMessages;
            } else {
              return [...prev, aiMsg];
            }
          });
        },
        // onError callback
        (error: Error) => {
          console.error('Streaming error:', error);
          setIsTyping(false);
          
          if (error instanceof RateLimitError) {
            setToastConfig({ 
              isVisible: true, 
              message: `Rate limit exceeded. Please wait ${error.retryAfter} seconds.` 
            });
          } else {
            setToastConfig({ 
              isVisible: true, 
              message: 'Failed to get response. Please try again.' 
            });
          }
        },
        // onComplete callback
        () => {
          setIsTyping(false);
        }
      );

    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      
      if (error instanceof RateLimitError) {
        setToastConfig({ 
          isVisible: true, 
          message: `Rate limit exceeded. Please wait ${error.retryAfter} seconds.` 
        });
      } else if (error instanceof Error) {
        // Check if it's an authentication error
        if (error.message.includes('Unauthorized') || error.message.includes('Authentication token not set')) {
          setToastConfig({ 
            isVisible: true, 
            message: 'Session expired. Please log in again.' 
          });
          // Use Next.js router for navigation instead of window.location
          setTimeout(() => router.push('/login'), 2000);
        } else {
          setToastConfig({ 
            isVisible: true, 
            message: error.message || 'Failed to send message. Please try again.' 
          });
        }
      }
    }
  };

  const handleSendMessage = () => {
    if (!searchQuery.trim()) return;

    if (!selectedChat) {
      // Start a new conversation
      const newSessionId = `session-${Date.now()}`;
      setCurrentSessionId(newSessionId);
      setSelectedChat("New Conversation");
      setMessages([]);
      
      // Add to conversations list
      const newChat: ChatSession = {
        id: newSessionId,
        title: searchQuery.slice(0, 50) + (searchQuery.length > 50 ? '...' : ''),
        category: 'Today',
        isArchived: false
      };
      setConversations(prev => [newChat, ...prev]);
    }

    const userMsg: MessageBubbleProps = {
      id: Date.now().toString(),
      sender: 'You',
      text: searchQuery,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: 'U',
      isMe: true
    };

    setMessages(prev => [...prev, userMsg]);
    
    // Store query and clear input
    const currentQuery = searchQuery;
    setSearchQuery('');

    // Handle special commands
    if (currentQuery.toLowerCase().includes('open magna podcast')) {
      const loadingMsgId = (Date.now() + 1).toString();
      
      setTimeout(() => {
        const loadingMsg: MessageBubbleProps = {
          id: loadingMsgId,
          sender: 'Magna AI',
          text: "Opening Magna Podcast...",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          avatar: <MagnaNewIcon className="w-5 h-5 text-red-600" />,
          color: 'bg-red-100',
          isLoading: true,
          loadingIcon: <Mic size={12} className="text-[#E50914]" />
        };
        setMessages(prev => [...prev, loadingMsg]);
        setIsTyping(false);

        setTimeout(() => {
          router.push('/magna-podcast');
        }, 1500);
      }, 500);
      return;
    }

    if (currentQuery.toLowerCase().includes('open magna school')) {
      const loadingMsgId = (Date.now() + 1).toString();
      
      setTimeout(() => {
        const loadingMsg: MessageBubbleProps = {
          id: loadingMsgId,
          sender: 'Magna AI',
          text: "Opening Magna School...",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          avatar: <MagnaNewIcon className="w-5 h-5 text-red-600" />,
          color: 'bg-red-100',
          isLoading: true,
          loadingIcon: <BookOpen size={12} className="text-[#E50914]" />
        };
        setMessages(prev => [...prev, loadingMsg]);
        setIsTyping(false);

        setTimeout(() => {
          router.push('/magna-school');
        }, 1500);
      }, 500);
      return;
    }

    // Send to AI backend for all other messages
    sendMessageToAI(currentQuery);
  };

  const handleEditMessage = (id: string, newText: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, text: newText } : msg
    ));
  };

  const handleNewChat = () => {
    const newSessionId = `session-${Date.now()}`;
    setCurrentSessionId(newSessionId);
    const newChat: ChatSession = {
      id: newSessionId,
      title: 'New Conversation',
      category: 'Today',
      isArchived: false
    };
    setConversations(prev => [newChat, ...prev]);
    handleChatSelect('New Conversation', newSessionId);
  };

  const handleArchiveChat = () => {
    if (selectedChat) {
      setConversations(prev => prev.map(chat => 
        chat.title === selectedChat ? { ...chat, isArchived: !chat.isArchived } : chat
      ));
      setSelectedChat(null);
      setShowChatOptions(false);
      setToastConfig({ isVisible: true, message: 'Chat archived' });
    }
  };

  const handleDeleteClick = () => {
    setShowChatOptions(false);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (selectedChat) {
      setConversations(prev => prev.filter(chat => chat.title !== selectedChat));
      setSelectedChat(null);
      setShowDeleteConfirm(false);
      setToastConfig({ isVisible: true, message: 'Chat deleted' });
    }
  };

  const handleChatSelect = (chatName: string, sessionId?: string) => {
    setSelectedChat(chatName);
    setCurrentSessionId(sessionId);
    setIsHistoryOpen(false);
    
    // Load conversation history from localStorage if available
    // For now, just show empty messages - can be enhanced later
    setMessages([]);
  };

  return {
    isHistoryOpen,
    setIsHistoryOpen,
    searchQuery,
    setSearchQuery,
    selectedChat,
    setSelectedChat,
    messages,
    isTyping,
    showChatOptions,
    setShowChatOptions,
    showDeleteConfirm,
    setShowDeleteConfirm,
    toastConfig,
    setToastConfig,
    isDarkMode,
    mobileInputRef,
    desktopInputRef,
    messagesEndRef,
    conversations,
    handleServiceClick,
    handleSendMessage,
    handleEditMessage,
    handleNewChat,
    handleArchiveChat,
    handleDeleteClick,
    confirmDelete,
    handleChatSelect
  };
}
