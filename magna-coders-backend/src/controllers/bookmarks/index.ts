import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const toggleBookmark = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user as string;
  const { id } = req.params; // opportunity id
  
  console.log('Toggle bookmark - userId:', userId, 'opportunityId:', id, 'params:', req.params);
  
  if (!id) {
    res.status(400).json({ message: 'opportunity id required', params: req.params });
    return;
  }

  if (!userId) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const existing = await prisma.bookmarks.findFirst({ where: { user_id: userId, opportunity_id: id } });
  if (existing) {
    await prisma.bookmarks.delete({ where: { id: existing.id } });
    res.status(200).json({ bookmarked: false });
    return;
  }

  const bookmark = await prisma.bookmarks.create({ data: { id: uuidv4(), user_id: userId, opportunity_id: id as string } });
  res.status(201).json({ bookmarked: true, id: bookmark.id });
};

const getBookmarkState = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user as string;
  const { id } = req.params; // opportunity id

  if (!userId) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const existing = await prisma.bookmarks.findFirst({ where: { user_id: userId, opportunity_id: id } });
  res.status(200).json({ bookmarked: !!existing, id: existing?.id || null });
};

const getUserBookmarks = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user as string;

  if (!userId) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const bookmarks = await prisma.bookmarks.findMany({
    where: { user_id: userId },
    include: {
      opportunities: {
        include: {
          users: { select: { id: true, username: true, avatar_url: true } },
          categories: { select: { id: true, name: true } }
        }
      }
    },
    orderBy: { saved_at: 'desc' }
  });

  res.status(200).json({ bookmarks });
};

export { toggleBookmark, getBookmarkState, getUserBookmarks };
