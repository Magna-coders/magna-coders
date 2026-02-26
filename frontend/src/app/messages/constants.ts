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
  phone: string;
  bio: string;
  avatarColor: string;
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
 * Get contact info from a chat
 */
export function getContactInfo(chat: Chat): ContactInfo {
  // Mock contact info - in production, this would fetch from backend
  return {
    id: chat.id,
    name: chat.name,
    email: `${chat.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    phone: '+1 (555) 123-4567',
    bio: 'Full-stack developer passionate about building great products.',
    avatarColor: chat.avatarColor,
  };
}
