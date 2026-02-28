import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        avatar_url: true, // mapped to profilePicture in frontend
        bio: true,
        created_at: true, // mapped to createdAt in frontend
      },
    });

    // Map database fields to frontend expected format
    const formattedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.username,
      profilePicture: user.avatar_url,
      bio: user.bio,
      createdAt: user.created_at,
    }));

    res.status(200).json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};
