import { Request, Response } from 'express';
import { ChatType } from '../../types/chat';
import { db } from '../../utils/prismaClient';

const getUserChats = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user as string;

  const chatRooms = await db.chat_room_members.findMany({
    where: { userId },
    include: {
      chatRoom: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                  isVerified: true,
                }
              }
            }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                }
              }
            }
          }
        }
      }
    }
  });

  interface Member {
    chatRoom: {
      id: string;
      name: string;
      type: ChatType;
      chat_room_members: Array<{
        user: {
          id: string;
          username: string;
          avatar_url: string;
          profile_complete_percentage: number;
        };
      }>;
      messages: any[];
    };
    joined_at: Date;
  }

  const formattedChats = chatRooms.map((member: Member) => ({
    id: member.chatRoom.id,
    name: member.chatRoom.name,
    type: member.chatRoom.type,
    members: member.chatRoom.chat_room_members.map(m => m.user),
    lastMessage: member.chatRoom.messages[0] || null,
    joinedAt: member.joined_at,
  }));

  res.status(200).json(formattedChats);
};

const getChatMessages = async (req: Request, res: Response): Promise<void> => {
  const { chatId } = req.params;
  const userId = req.user as string;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;

  // Check if user is member of this chat
  const membership = await db.chat_room_members.findFirst({
    where: {
      chat_room_id: chatId,
      user_id: userId,
    }
  });

  if (!membership) {
    res.status(403).send({ message: 'Access denied.' });
    return;
  }

  const messages = await db.messages.findMany({
    where: { chat_room_id: chatId },
    orderBy: { created_at: 'desc' },
    take: limit,
    skip: (page - 1) * limit,
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          avatar_url: true,
          profile_complete_percentage: true
        }
      }
    }
  });

  res.status(200).json(messages.reverse()); // Reverse to show oldest first
};

const createDirectChat = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user as string;
  const { otherUserId } = req.body;

  if (!otherUserId) {
    res.status(400).send({ message: 'Other user ID is required.' });
    return;
  }

  // Check if users exist
  const [user, otherUser] = await Promise.all([
    db.users.findUnique({ where: { id: userId } }),
    db.users.findUnique({ where: { id: otherUserId } })
  ]);

  if (!user || !otherUser) {
    res.status(404).send({ message: 'User not found.' });
    return;
  }

  // Check if direct chat already exists
  const existingChat = await db.chat_rooms.findFirst({
    where: {
      type: ChatType.DIRECT,
      chat_room_members: {
        every: {
          user_id: { in: [userId, otherUserId] }
        }
      }
    },
    include: {
      chat_room_members: true,
    }
  });

  if (existingChat && existingChat.chat_room_members.length === 2) {
    res.status(200).json(existingChat);
    return;
  }

  // Create new direct chat
  const chatRoom = await db.chat_rooms.create({
    data: {
      type: ChatType.DIRECT,
      chat_room_members: {
        create: [
          { user_id: userId },
          { user_id: otherUserId }
        ]
      }
    },
    include: {
      chat_room_members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar_url: true,
              profile_complete_percentage: true
            }
          }
        }
      }
    }
  });

  res.status(201).json(chatRoom);
};

const createGroupChat = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user as string;
  const { name, memberIds } = req.body;

  if (!name || !memberIds || !Array.isArray(memberIds)) {
    res.status(400).send({ message: 'Chat name and member IDs are required.' });
    return;
  }

  if (memberIds.length < 2) {
    res.status(400).send({ message: 'Group chat must have at least 2 members.' });
    return;
  }

  // Add creator to members if not included
  const allMemberIds = [...new Set([...memberIds, userId])];

  // Verify all users exist
  const users = await db.users.findMany({
    where: { id: { in: allMemberIds } }
  });

  if (users.length !== allMemberIds.length) {
    res.status(404).send({ message: 'One or more users not found.' });
    return;
  }

  const chatRoom = await db.chat_rooms.create({
    data: {
      name,
      type: ChatType.GROUP,
      chat_room_members: {
        create: allMemberIds.map(id => ({ user_id: id }))
      }
    },
    include: {
      chat_room_members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar_url: true,
              profile_complete_percentage: true
            }
          }
        }
      }
    }
  });

  res.status(201).json(chatRoom);
};

const sendMessage = async (req: Request, res: Response): Promise<void> => {
  const { chatId } = req.params;
  const userId = req.user as string;
  const { content, messageType } = req.body;

  if (!content) {
    res.status(400).send({ message: 'Message content is required.' });
    return;
  }

  // Check if user is member of this chat
  const membership = await db.chat_room_members.findFirst({
    where: {
      chat_room_id: chatId,
      user_id: userId,
    }
  });

  if (!membership) {
    res.status(403).send({ message: 'Access denied.' });
    return;
  }

  const message = await db.messages.create({
    data: {
      content,
      message_type: messageType || 'TEXT',
      chat_room_id: chatId,
      sender_id: userId
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          avatar_url: true,
          profile_complete_percentage: true
        }
      }
    }
  });

  res.status(201).json(message);
};

const leaveChat = async (req: Request, res: Response): Promise<void> => {
  const { chatId } = req.params;
  const userId = req.user as string;

  const membership = await db.chatRoomMember.findFirst({
    where: {
      chatRoomId: chatId,
      userId,
    }
  });

  if (!membership) {
    res.status(404).send({ message: 'Not a member of this chat.' });
    return;
  }

  await db.chat_room_members.delete({
    where: { id: membership.id }
  });

  // If it's a direct chat or group chat with only one member left, deactivate it instead of deleting
  const remainingMembers = await db.chat_room_members.count({
    where: { chat_room_id: chatId }
  });

  if (remainingMembers === 0) {
    await db.chat_rooms.update({
      where: { id: chatId },
      data: { is_active: false }
    });
  }

  res.status(200).json({ message: 'Left chat successfully.' });
};

export {
  getUserChats,
  getChatMessages,
  createDirectChat,
  createGroupChat,
  sendMessage,
  leaveChat,
};