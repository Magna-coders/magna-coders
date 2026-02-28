// Helper functions for messages page

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  isTyping?: boolean;
  avatarColor: string;
  isGroup?: boolean;
  messages: any[];
}

interface GroupMember {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
}

interface ContactInfo {
  id: string;
  name: string;
  email: string;
  bio: string;
  roles?: string[];
  lookingFor?: string[];
  location: string;
  status?: string;
  connected?: boolean;
  avatarColor: string;
  initials: string;
  avatar?: string;
  websiteUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  whatsappUrl?: string;
  instagramUrl?: string;
}

/**
 * Get group members from a chat
 */
export function getGroupMembers(chat: Chat): GroupMember[] {
  // Mock group members - in production, this would fetch from backend
  return [
    { id: '1', name: 'You', role: 'Admin', avatarColor: 'from-blue-500 to-purple-500' },
    { id: '2', name: 'Alice Johnson', role: 'Member', avatarColor: 'from-green-500 to-teal-500' },
    { id: '3', name: 'Bob Smith', role: 'Member', avatarColor: 'from-orange-500 to-red-500' },
    { id: '4', name: 'Carol White', role: 'Member', avatarColor: 'from-pink-500 to-rose-500' },
  ];
}

/**
 * Get contact info from a chat - returns a promise to fetch from backend
 */
export async function getContactInfo(chat: Chat): Promise<ContactInfo> {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  
  try {
    // Get the other participant's ID from the chat
    const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userid') : null;
    
    // Fetch chat details to get participant IDs
    const chatResponse = await fetch(`${API_BASE}/chat/${chat.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      const otherUserId = chatData.participants?.find((id: string) => id !== currentUserId);
      
      if (otherUserId) {
        // Fetch user details
        const userResponse = await fetch(`${API_BASE}/users/${otherUserId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const user = userData.user || userData;
          
          return {
            id: user.id,
            name: user.username || user.fullName || chat.name,
            email: user.email || '',
            bio: user.bio || 'No bio available.',
            location: user.location || 'Unknown',
            avatarColor: chat.avatarColor,
            initials: (user.username || chat.name).substring(0, 2).toUpperCase(),
            avatar: user.avatarUrl || user.avatar_url,
            websiteUrl: user.websiteUrl || user.website_url,
            githubUrl: user.githubUrl || user.github_url,
            linkedinUrl: user.linkedinUrl || user.linkedin_url,
            twitterUrl: user.twitterUrl || user.twitter_url,
            whatsappUrl: user.whatsappUrl || user.whatsapp_url,
            instagramUrl: user.instagramUrl || user.instagram_url,
            roles: user.roles || [],
            lookingFor: user.lookingFor || user.looking_for || [],
            status: user.availability || 'available',
            connected: true
          };
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch contact info:', error);
  }
  
  // Fallback to mock data
  return {
    id: chat.id,
    name: chat.name,
    email: `${chat.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    bio: 'Full-stack developer passionate about building great products.',
    location: 'Unknown',
    avatarColor: chat.avatarColor,
    initials: chat.name.substring(0, 2).toUpperCase(),
    status: 'available',
    connected: true
  };
}

// Mock friends list for StartChatModal
export const MOCK_FRIENDS = [
  { id: '1', name: 'Alice Johnson', avatarColor: 'bg-green-100 text-green-600', initials: 'AJ', isOnline: true, status: 'Available for projects' },
  { id: '2', name: 'Bob Smith', avatarColor: 'bg-blue-100 text-blue-600', initials: 'BS', isOnline: false, status: 'Busy with work' },
  { id: '3', name: 'Carol White', avatarColor: 'bg-purple-100 text-purple-600', initials: 'CW', isOnline: true, status: 'Looking for collaborators' },
];
