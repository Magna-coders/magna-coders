import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getUserChats, getChatMessages, sendMessage as sendMessageService } from '@/services/messages';
import type { Conversation, Message } from '@/types';
import { MOCK_FRIENDS } from './constants';

const USE_REAL_API = true; // Set to true when backend is ready
const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
if (!API_BASE) {
  console.warn('API URL is not defined in environment variables');
}

// Types for API responses
interface ApiChat {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name?: string;
  participants: string[];
  createdAt: string;
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  unreadCount?: number;
  description?: string; // Added description
}

interface ApiUser {
    id: string;
    name: string;
    email: string;
    bio?: string;
    avatar?: string;
}

interface ApiMessage {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
}

// Helper for authenticated requests
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    // Check common keys
    return localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
  }
  return null;
};

const authenticatedFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  return response.json();
};

export function useMessages() {
  const searchParams = useSearchParams();
  
  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Messages');
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [filter, setFilter] = useState<'chats' | 'groups' | 'unread' | 'archived'>('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [showChatOptions, setShowChatOptions] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isGroupInfoModalOpen, setIsGroupInfoModalOpen] = useState(false);
  const [isStartChatModalOpen, setIsStartChatModalOpen] = useState(false);
  const [isContactInfoModalOpen, setIsContactInfoModalOpen] = useState(false);
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [isSendCoinsModalOpen, setIsSendCoinsModalOpen] = useState(false);
  const [isDiscoverGroupsModalOpen, setIsDiscoverGroupsModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [chatDetails, setChatDetails] = useState<{ description?: string; members?: ApiUser[] } | null>(null);
  const [friends, setFriends] = useState<any[]>([]);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations from backend
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const chats = await getUserChats();
        
        // Map backend Chat objects to frontend Conversation objects
        const mappedConversations: Conversation[] = chats.map((chat: any) => {
          let name = chat.name || 'Unknown Chat';
          if (chat.type === 'DIRECT' && !chat.name) {
            // For direct chats, try to get the other participant's name
            const currentUserId = localStorage.getItem('userid') || localStorage.getItem('userId');
            const otherParticipant = chat.participants?.find((p: any) => p.id !== currentUserId);
            name = otherParticipant?.username || otherParticipant?.fullName || 'Direct Chat';
          }

          return {
            id: chat.id,
            name: name,
            lastMessage: chat.lastMessage?.content || 'No messages yet',
            time: chat.lastMessage?.createdAt 
              ? new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
              : '',
            unread: chat.unreadCount || 0,
            isTyping: false,
            pinned: false,
            isGroup: chat.type === 'GROUP',
            archived: false,
            avatarColor: 'bg-indigo-100 text-indigo-600',
            messages: []
          };
        });
        
        setConversations(mappedConversations);
      } catch (error) {
        console.error('Error loading conversations:', error);
        // Keep empty array on error
      }
    };
    loadConversations();
  }, []);

  // Load friends list
  useEffect(() => {
    const loadFriends = async () => {
      try {
        const userId = localStorage.getItem('userId') || localStorage.getItem('userid');
        const token = localStorage.getItem('accessToken');
        
        if (!userId || !token) return;

        const response = await fetch(`${API_BASE}/friends/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          const friendsList = result.friends || [];
          
          // Map to the format expected by StartChatModal
          const mappedFriends = friendsList.map((friend: any) => ({
            id: friend.id,
            name: friend.username || friend.email?.split('@')[0] || 'User',
            avatarColor: 'bg-indigo-100 text-indigo-600',
            initials: (friend.username || friend.email?.split('@')[0] || 'U').substring(0, 2).toUpperCase(),
            isOnline: false,
            status: friend.bio || ''
          }));
          
          setFriends(mappedFriends);
        }
      } catch (error) {
        console.error('Failed to fetch friends:', error);
      }
    };

    loadFriends();
  }, []);

  // Derived State
  const selectedChat = conversations.find(c => c.id === selectedChatId);

  // Handle URL Params for starting chat
  useEffect(() => {
    if (!searchParams) return;
    
    const action = searchParams.get('action');
    const name = searchParams.get('name');
    const userId = searchParams.get('userId');

    if (action === 'start_chat' && (name || userId)) {
      // If we have a userId, try to create/find a direct chat
      if (userId && USE_REAL_API) {
        const createDirectChat = async () => {
          try {
            const newChatData: ApiChat = await authenticatedFetch('/chat/direct', {
              method: 'POST',
              body: JSON.stringify({ participantId: userId })
            });

            // Check if we already have this chat in our state
            const existingChat = conversations.find(c => c.id === newChatData.id);
            if (existingChat) {
              setSelectedChatId(existingChat.id);
            } else {
              // Add to conversations
              const newConversation: Conversation = {
                id: newChatData.id,
                name: name || 'Direct Chat',
                lastMessage: 'Start a conversation',
                time: 'Now',
                unread: 0,
                isTyping: false,
                pinned: false,
                isGroup: false,
                archived: false,
                avatarColor: 'bg-indigo-100 text-indigo-600',
                messages: []
              };
              setConversations(prev => [newConversation, ...prev]);
              setSelectedChatId(newChatData.id);
            }
          } catch (error) {
            console.error('Failed to create direct chat:', error);
          }
        };
        createDirectChat();
        return;
      }

      // Fallback to name-based chat (legacy)
      if (name) {
        // Check if chat already exists
        const existingChat = conversations.find(c => c.name === name && !c.isGroup);
        
        if (existingChat) {
          setSelectedChatId(existingChat.id);
        } else {
          // Create new chat
          const newChat: Conversation = {
            id: `new-chat-${Date.now()}`,
            name: name,
            lastMessage: 'Start a conversation',
            time: 'Now',
            unread: 0,
            isTyping: false,
            pinned: false,
            isGroup: false,
            archived: false,
            avatarColor: 'bg-indigo-100 text-indigo-600',
            messages: []
          };
          
          setConversations(prev => [newChat, ...prev]);
          setSelectedChatId(newChat.id);
        }
      }
    }
  }, [searchParams, conversations]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  // API Integration: Fetch Chats
  useEffect(() => {
    if (!USE_REAL_API) return;

    const fetchChats = async () => {
      try {
        const chats = await authenticatedFetch('/chat');
        console.log('Fetched chats API response:', chats);
        
        // Map backend Chat objects to frontend Conversation objects
        const mappedConversations: Conversation[] = chats.map((chat: ApiChat) => {
            let name = chat.name || 'Unknown Chat';
            if (chat.type === 'DIRECT' && !chat.name) {
                // If direct chat and no name, try to construct a name or use a placeholder
                // In a real app we'd fetch the other user's profile
                name = `Direct Chat`;
            }

            return {
              id: chat.id,
              name: name,
              lastMessage: chat.lastMessage?.content || 'No messages yet',
              time: chat.lastMessage?.createdAt ? new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
              unread: chat.unreadCount || 0,
              isTyping: false,
              pinned: false,
              isGroup: chat.type === 'GROUP',
              archived: false,
              avatarColor: 'bg-indigo-100 text-indigo-600', // Default color
              messages: [] // Messages are fetched when chat is selected
            };
        });
        
        setConversations(mappedConversations);
      } catch (error) {
        console.error('Failed to fetch chats:', error);
      }
    };

    fetchChats();
  }, []);

  // API Integration: Fetch Messages
  useEffect(() => {
    if (!USE_REAL_API || !selectedChatId) return;

    const fetchMessages = async () => {
      try {
        const currentUserId = localStorage.getItem('userid');
        const messages: any[] = await authenticatedFetch(`/chat/${selectedChatId}/messages`);
        
        setConversations(prev => prev.map(c => {
          if (c.id === selectedChatId) {
            return {
              ...c,
              messages: messages.map((m: any) => {
                // Determine message type from backend message_type or messageType
                const messageType = m.messageType || m.message_type || 'TEXT';
                const isImage = messageType === 'IMAGE';
                const isFile = messageType === 'FILE';
                
                return {
                  id: m.id,
                  sender: m.senderId === currentUserId ? 'Me' : 'Other',
                  text: m.content,
                  time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  avatar: m.senderId === currentUserId ? 'ME' : 'O',
                  isMe: m.senderId === currentUserId,
                  type: isImage ? 'image' : isFile ? 'file' : 'text',
                  imageUrl: isImage ? (m.fileUrl || m.file_url) : undefined,
                  fileUrl: isFile ? (m.fileUrl || m.file_url) : undefined,
                  fileName: m.fileName || m.file_name,
                  fileSize: m.fileSize || m.file_size ? `${((m.fileSize || m.file_size) / 1024).toFixed(1)} KB` : undefined,
                  read: m.isRead || m.is_read || false
                };
              })
            };
          }
          return c;
        }));

        // Mark messages as read
        try {
          await authenticatedFetch(`/chat/${selectedChatId}/read`, {
            method: 'POST'
          });
        } catch (error) {
          console.error('Failed to mark messages as read:', error);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };
    
    fetchMessages();
  }, [selectedChatId]);

  // API Integration: Fetch Chat Details
  useEffect(() => {
    if (!USE_REAL_API || !selectedChatId) {
        setChatDetails(null);
        return;
    }

    const fetchDetails = async () => {
        try {
            const chat: ApiChat = await authenticatedFetch(`/chat/${selectedChatId}`);
            
            // In a real app, we would also fetch user details for direct chats or group members
            // Assuming the chat object or a separate endpoint provides this
            // For now, let's assume we can fetch member details if it's a group
            
            let details: { description?: string; members?: ApiUser[] } = {};

            if (chat.type === 'GROUP') {
                details.description = chat.description || "No description available.";
                // details.members = await authenticatedFetch(`/chat/${selectedChatId}/members`);
            } else if (chat.type === 'DIRECT') {
                // Find the other participant
                const currentUserId = localStorage.getItem('userid');
                const otherUserId = chat.participants.find(id => id !== currentUserId);
                if (otherUserId) {
                    try {
                        const user: ApiUser = await authenticatedFetch(`/users/${otherUserId}`);
                        details.description = user.bio || "No bio available.";
                    } catch (e) {
                        console.error('Failed to fetch user details', e);
                    }
                }
            }
            setChatDetails(details);

        } catch (error) {
            console.error('Failed to fetch chat details:', error);
        }
    };

    fetchDetails();
  }, [selectedChatId]);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    window.dispatchEvent(new Event('themeChanged'));
  };

  const filteredConversations = conversations.filter(c => {
    // 1. Archive Filter
    if (filter === 'archived') {
      return c.archived;
    }
    if (c.archived) return false; // Don't show archived in other tabs

    // 2. Category Filter
    if (filter === 'groups' && !c.isGroup) return false;
    if (filter === 'unread' && c.unread === 0) return false;

    // 3. Search Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(query) || 
        c.lastMessage.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Effects
  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedChat?.messages]);

  // Handlers

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!messageInput.trim() || !selectedChatId) return;

    const content = messageInput;
    const tempId = `new-${Date.now()}`;
    
    // Optimistic Update
    setConversations(prev => prev.map(c => {
      if (c.id === selectedChatId) {
        return {
          ...c,
          lastMessage: content,
          time: 'Just now',
          messages: [...c.messages, {
            id: tempId,
            sender: 'Me',
            text: content,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            avatar: 'ME',
            isMe: true,
            type: 'text',
            read: true
          }]
        };
      }
      return c;
    }));

    setMessageInput('');

    if (USE_REAL_API) {
      try {
        await authenticatedFetch(`/chat/${selectedChatId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
      } catch (error) {
        console.error('Failed to send message:', error);
        // Revert optimistic update if needed
      }
    }
  };

  const handleSendCoins = async (amount: number) => {
    if (!selectedChatId) return;

    const content = `💰 Sent ${amount} Magna Coins`;
    const tempId = `new-coin-${Date.now()}`;
    
    // Optimistic Update
    setConversations(prev => prev.map(c => {
      if (c.id === selectedChatId) {
        return {
          ...c,
          lastMessage: content,
          time: 'Just now',
          messages: [...c.messages, {
            id: tempId,
            sender: 'Me',
            text: content,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            avatar: 'ME',
            isMe: true,
            type: 'text', // Keeping as text for now, but could be 'system' or 'coin'
            read: true
          }]
        };
      }
      return c;
    }));

    // If using real API, we would send a special message type or just text
    if (USE_REAL_API) {
      try {
        await authenticatedFetch(`/chat/${selectedChatId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
      } catch (error) {
        console.error('Failed to send coins message:', error);
      }
    }
  };

  const handleDeleteConversation = (id: string) => {
    if (confirm('Are you sure you want to delete this conversation?')) {
      setConversations(prev => prev.filter(c => c.id !== id));
      if (selectedChatId === id) setSelectedChatId(null);
      setShowChatOptions(false);
    }
  };

  const handleDeleteMessage = (chatId: string, messageId: string) => {
    setConversations(prev => prev.map(c => {
      if (c.id === chatId) {
        return {
          ...c,
          messages: c.messages.filter(m => m.id !== messageId)
        };
      }
      return c;
    }));
  };

  const handleArchiveConversation = (id: string) => {
    setConversations(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, archived: !c.archived };
      }
      return c;
    }));
    if (selectedChatId === id) setSelectedChatId(null);
    setShowChatOptions(false);
  };

  const handleCreateGroup = async (name: string, members: string[], avatar?: File) => {
    if (USE_REAL_API) {
      try {
        const newGroupData: ApiChat = await authenticatedFetch('/chat/group', {
          method: 'POST',
          body: JSON.stringify({ name, participantIds: members })
        });

        const newGroup: Conversation = {
          id: newGroupData.id,
          name: newGroupData.name || name,
          lastMessage: 'Group created',
          time: 'Just now',
          unread: 0,
          isTyping: false,
          pinned: false,
          isGroup: true,
          archived: false,
          avatarColor: 'bg-orange-100 text-orange-600', // In real app, generate based on name or avatar
          messages: []
        };
        
        setConversations(prev => [newGroup, ...prev]);
        setSelectedChatId(newGroup.id);
        setIsCreateGroupModalOpen(false);
        setIsActionModalOpen(false);
      } catch (error) {
        console.error('Failed to create group:', error);
        alert('Failed to create group. Please try again.');
      }
      return;
    }

    const newGroup: Conversation = {
      id: `group-${Date.now()}`,
      name,
      lastMessage: 'Group created',
      time: 'Just now',
      unread: 0,
      isTyping: false,
      pinned: false,
      isGroup: true,
      archived: false,
      avatarColor: 'bg-orange-100 text-orange-600', // In real app, generate based on name or avatar
      messages: []
    };
    
    setConversations(prev => [newGroup, ...prev]);
    setSelectedChatId(newGroup.id);
    setIsCreateGroupModalOpen(false);
    setIsActionModalOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedChatId) {
      // Upload file first
      const uploadAndSend = async () => {
        try {
          // Import the upload function
          const { uploadMessageFile } = await import('@/services/messages');
          
          // Upload file
          const uploadResult = await uploadMessageFile(file);
          
          // Determine message type
          const messageType = file.type.startsWith('image/') ? 'IMAGE' : 'FILE';
          
          // Send message with file info
          if (USE_REAL_API) {
            const response = await authenticatedFetch(`/chat/${selectedChatId}/messages`, {
              method: 'POST',
              body: JSON.stringify({
                content: messageType === 'IMAGE' ? 'Sent an image' : `Sent a file: ${file.name}`,
                messageType,
                fileUrl: uploadResult.fileUrl,
                fileName: uploadResult.fileName,
                fileSize: uploadResult.fileSize,
                fileType: uploadResult.fileType
              })
            });
            
            // Add the new message to the conversation (backend returns the created message)
            const currentUserId = localStorage.getItem('userid');
            const newMessage = {
              id: response.id,
              sender: 'Me',
              text: response.content,
              time: new Date(response.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              avatar: 'ME',
              isMe: true,
              type: messageType === 'IMAGE' ? 'image' : 'file',
              imageUrl: messageType === 'IMAGE' ? (response.fileUrl || response.file_url) : undefined,
              fileUrl: messageType === 'FILE' ? (response.fileUrl || response.file_url) : undefined,
              fileName: response.fileName || response.file_name,
              fileSize: response.fileSize || response.file_size ? `${((response.fileSize || response.file_size) / 1024).toFixed(1)} KB` : undefined,
              read: true
            };
            
            setConversations(prev => prev.map(c => {
              if (c.id === selectedChatId) {
                return {
                  ...c,
                  messages: [...c.messages, newMessage],
                  lastMessage: newMessage.text,
                  time: 'Just now'
                };
              }
              return c;
            }));
          } else {
            // Fallback for non-API mode
            const newMessage: Message = {
              id: `file-${Date.now()}`,
              sender: 'Me',
              text: messageType === 'IMAGE' ? 'Sent an image' : `Sent a file: ${file.name}`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              avatar: 'ME',
              isMe: true,
              type: messageType === 'IMAGE' ? 'image' : 'file',
              imageUrl: messageType === 'IMAGE' ? URL.createObjectURL(file) : undefined,
              fileName: messageType === 'FILE' ? file.name : undefined,
              fileSize: `${(file.size / 1024).toFixed(1)} KB`,
              read: false
            };

            setConversations(prev => prev.map(c => {
              if (c.id === selectedChatId) {
                return {
                  ...c,
                  messages: [...c.messages, newMessage],
                  lastMessage: newMessage.text,
                  time: 'Just now'
                };
              }
              return c;
            }));
          }
        } catch (error) {
          console.error('Failed to upload file:', error);
          alert('Failed to upload file. Please try again.');
        }
      };
      
      uploadAndSend();
    }
  };

  const handleUpdateGroup = (id: string, updates: Partial<Conversation>) => {
    setConversations(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, ...updates };
      }
      return c;
    }));
  };

  const handleLeaveGroup = async (id: string) => {
    if (confirm('Are you sure you want to leave this group?')) {
      if (USE_REAL_API) {
        try {
          await authenticatedFetch(`/chat/${id}/leave`, {
            method: 'DELETE'
          });
          // Optimistically update UI
          setConversations(prev => prev.filter(c => c.id !== id));
          if (selectedChatId === id) setSelectedChatId(null);
          setIsGroupInfoModalOpen(false);
        } catch (error) {
          console.error('Failed to leave group:', error);
          alert('Failed to leave group');
        }
        return;
      }
      
      setConversations(prev => prev.filter(c => c.id !== id));
      if (selectedChatId === id) setSelectedChatId(null);
      setIsGroupInfoModalOpen(false);
    }
  };

  const handleRemoveMember = (groupId: string, memberId: string) => {
    console.log(`Removing member ${memberId} from group ${groupId}`);
  };

  const handlePromoteMember = (groupId: string, memberId: string) => {
    console.log(`Promoting member ${memberId} to admin in group ${groupId}`);
  };

  const handleAttachmentSelect = (type: 'document' | 'media') => {
    setIsAttachmentModalOpen(false);
    
    if (fileInputRef.current) {
      if (type === 'document') {
        fileInputRef.current.accept = ".pdf,.doc,.docx,.txt,.xls,.xlsx";
      } else if (type === 'media') {
        fileInputRef.current.accept = "image/*,video/*";
      }
      fileInputRef.current.click();
    }
  };

  const handleStartChat = async (friendId: string) => {
    if (USE_REAL_API) {
      try {
        const newChatData: ApiChat = await authenticatedFetch('/chat/direct', {
          method: 'POST',
          body: JSON.stringify({ participantId: friendId })
        });

        // Check if we already have this chat in our state
        const existingChat = conversations.find(c => c.id === newChatData.id);
        if (existingChat) {
          setSelectedChatId(existingChat.id);
        } else {
          // Add to conversations
          const newConversation: Conversation = {
            id: newChatData.id,
            name: newChatData.name || 'Direct Chat', // Ideally fetch user name
            lastMessage: 'Start a conversation',
            time: 'Now',
            unread: 0,
            isTyping: false,
            pinned: false,
            isGroup: false,
            archived: false,
            avatarColor: 'bg-indigo-100 text-indigo-600',
            messages: []
          };
          setConversations(prev => [newConversation, ...prev]);
          setSelectedChatId(newChatData.id);
        }
        setIsStartChatModalOpen(false);
        setIsActionModalOpen(false);
      } catch (error) {
        console.error('Failed to create chat:', error);
        alert('Failed to start chat. Please try again.');
      }
      return;
    }

    const existingChat = conversations.find(c => !c.isGroup && c.id === friendId);
    
    if (existingChat) {
      setSelectedChatId(existingChat.id);
      setIsStartChatModalOpen(false);
      setIsActionModalOpen(false);
      return;
    }

    const friend = MOCK_FRIENDS.find(f => f.id === friendId);
    
    const newChat: Conversation = {
      id: friendId, 
      name: friend ? friend.name : 'New Chat',
      lastMessage: 'Start a conversation',
      time: 'Now',
      unread: 0,
      isTyping: false,
      pinned: false,
      isGroup: false,
      archived: false,
      avatarColor: friend ? friend.avatarColor : 'bg-indigo-100 text-indigo-600',
      messages: []
    };

    setConversations(prev => [newChat, ...prev]);
    setSelectedChatId(newChat.id);
    setIsStartChatModalOpen(false);
    setIsActionModalOpen(false);
  };

  const handleJoinGroup = (groupId: string, type: 'request' | 'paid', cost?: number) => {
    setIsDiscoverGroupsModalOpen(false);
    if (type === 'paid') {
      alert(`Payment of ${cost} Magna Coins required. Wallet integration coming soon!`);
    } else {
      alert(`Request to join group sent!`);
    }
  };

  return {
    // State
    conversations,
    selectedChatId,
    setSelectedChatId,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    activeTab,
    setActiveTab,
    isActionModalOpen,
    setIsActionModalOpen,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    messageInput,
    setMessageInput,
    showChatOptions,
    setShowChatOptions,
    isCreateGroupModalOpen,
    setIsCreateGroupModalOpen,
    isGroupInfoModalOpen,
    setIsGroupInfoModalOpen,
    isStartChatModalOpen,
    setIsStartChatModalOpen,
    isContactInfoModalOpen,
    setIsContactInfoModalOpen,
    isAttachmentModalOpen,
    setIsAttachmentModalOpen,
    isSendCoinsModalOpen,
    setIsSendCoinsModalOpen,
    isDiscoverGroupsModalOpen,
    setIsDiscoverGroupsModalOpen,
    isDarkMode,
    toggleTheme,
    friends,

    // Refs
    fileInputRef,
    messagesEndRef,

    // Derived State
    selectedChat,
    filteredConversations,

    // Handlers
    handleSendMessage,
    handleSendCoins,
    handleDeleteConversation,
    handleDeleteMessage,
    handleArchiveConversation,
    handleCreateGroup,
    handleFileUpload,
    handleUpdateGroup,
    handleLeaveGroup,
    handleRemoveMember,
    handlePromoteMember,
    handleAttachmentSelect,
    handleStartChat,
    handleJoinGroup,
    chatDetails // Export this
  };
}
