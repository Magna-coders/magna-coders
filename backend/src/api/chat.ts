import { prisma, db } from '../utils/prismaClient';

export class Chat {
  private prisma: any;

  constructor() {
    this.prisma = prisma;
  }

  // Find chat room by ID
  async findChatRoomById(id: string) {
    return await this.prisma.chatRoom.findUnique({
      where: { id },
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
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                avatar: true,
                isVerified: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }
      }
    });
  }

  // Get user's chat rooms
  async getUserChatRooms(userId: string) {
    const chatRooms = await this.prisma.chatRoomMember.findMany({
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

    return chatRooms.map((member: any) => ({
      id: member.chatRoom.id,
      name: member.chatRoom.name,
      type: member.chatRoom.type,
      members: member.chatRoom.members.map((m: any) => m.user),
      lastMessage: member.chatRoom.messages[0] || null,
      joinedAt: member.joinedAt,
    }));
  }

  // Create direct chat
  async createDirectChat(userId: string, otherUserId: string): Promise<any> {
    // Check if direct chat already exists
    const existingChat = await this.prisma.chatRoom.findFirst({
      where: {
        type: 'DIRECT',
        members: {
          every: {
            userId: { in: [userId, otherUserId] }
          }
        }
      },
      include: {
        members: true,
      }
    });

    if (existingChat && existingChat.members.length === 2) {
      return existingChat;
    }

    // Create new direct chat
    return await this.prisma.chatRoom.create({
      data: {
        type: 'DIRECT',
        members: {
          create: [
            { userId },
            { userId: otherUserId }
          ]
        }
      },
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
        }
      }
    });
  }

  // Create group chat
  async createGroupChat(creatorId: string, name: string, memberIds: string[]): Promise<any> {
    // Add creator to members if not included
    const allMemberIds = [...new Set([...memberIds, creatorId])];

    return await this.prisma.chatRoom.create({
      data: {
        name,
        type: 'GROUP',
        members: {
          create: allMemberIds.map(id => ({ userId: id }))
        }
      },
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
        }
      }
    });
  }

  // Send message
  async sendMessage(chatId: string, senderId: string, content: string, messageType: any = 'TEXT'): Promise<any> {
    // Check if user is member of this chat
    const membership = await this.prisma.chatRoomMember.findFirst({
      where: {
        chatRoomId: chatId,
        userId: senderId,
      }
    });

    if (!membership) {
      throw new Error('Access denied');
    }

    return await this.prisma.message.create({
      data: {
        content,
        messageType,
        chatRoomId: chatId,
        senderId,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
            isVerified: true,
          }
        }
      }
    });
  }

  // Get chat messages
  async getChatMessages(chatId: string, userId: string, options: {
    page?: number;
    limit?: number;
  } = {}) {
    const { page = 1, limit = 50 } = options;

    // Check if user is member of this chat
    const membership = await this.prisma.chatRoomMember.findFirst({
      where: {
        chatRoomId: chatId,
        userId,
      }
    });

    if (!membership) {
      throw new Error('Access denied');
    }

    const messages = await this.prisma.message.findMany({
      where: { chatRoomId: chatId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
            isVerified: true,
          }
        }
      }
    });

    return messages.reverse(); // Return in chronological order
  }

  // Leave chat
  async leaveChat(chatId: string, userId: string): Promise<void> {
    const membership = await this.prisma.chatRoomMember.findFirst({
      where: {
        chatRoomId: chatId,
        userId,
      }
    });

    if (!membership) {
      throw new Error('Not a member of this chat');
    }

    await this.prisma.chatRoomMember.delete({
      where: { id: membership.id }
    });

    // If it's a direct chat or group chat with only one member left, deactivate it
    const remainingMembers = await this.prisma.chatRoomMember.count({
      where: { chatRoomId: chatId }
    });

    if (remainingMembers === 0) {
      await this.prisma.chatRoom.update({
        where: { id: chatId },
        data: { isActive: false }
      });
    }
  }

  // Add member to group chat
  async addMemberToGroup(chatId: string, adderId: string, newMemberId: string): Promise<void> {
    // Check if adder is member and chat is group
    const chat = await this.prisma.chatRoom.findUnique({
      where: { id: chatId },
      include: { members: true }
    });

    if (!chat || chat.type !== 'GROUP') {
      throw new Error('Group chat not found');
    }

  const isMember = chat.members.some((m: any) => m.userId === adderId);
    if (!isMember) {
      throw new Error('Access denied');
    }

    // Check if new member is already in chat
  const alreadyMember = chat.members.some((m: any) => m.userId === newMemberId);
    if (alreadyMember) {
      throw new Error('User is already a member of this chat');
    }

    await this.prisma.chatRoomMember.create({
      data: {
        chatRoomId: chatId,
        userId: newMemberId,
      }
    });
  }

  // Remove member from group chat
  async removeMemberFromGroup(chatId: string, removerId: string, memberId: string): Promise<void> {
    const chat = await this.prisma.chatRoom.findUnique({
      where: { id: chatId },
      include: { members: true }
    });

    if (!chat || chat.type !== 'GROUP') {
      throw new Error('Group chat not found');
    }

    // Only group members can remove others (or self)
  const isMember = chat.members.some((m: any) => m.userId === removerId);
    if (!isMember) {
      throw new Error('Access denied');
    }

  const memberToRemove = chat.members.find((m: any) => m.userId === memberId);
    if (!memberToRemove) {
      throw new Error('User is not a member of this chat');
    }

    await this.prisma.chatRoomMember.delete({
      where: { id: memberToRemove.id }
    });
  }

  // Update group chat name
  async updateGroupName(chatId: string, updaterId: string, name: string): Promise<void> {
    const chat = await this.prisma.chatRoom.findUnique({
      where: { id: chatId },
      include: { members: true }
    });

    if (!chat || chat.type !== 'GROUP') {
      throw new Error('Group chat not found');
    }

  const isMember = chat.members.some((m: any) => m.userId === updaterId);
    if (!isMember) {
      throw new Error('Access denied');
    }

    await this.prisma.chatRoom.update({
      where: { id: chatId },
      data: { name }
    });
  }
}

export default Chat;