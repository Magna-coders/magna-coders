import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Simple file create endpoint for recording uploaded file metadata.
const createFile = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user as string;
  const { url, filename, mime_type, size, purpose } = req.body;

  if (!userId) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  if (!url || !filename) {
    res.status(400).json({ message: 'url and filename are required' });
    return;
  }

  const file = await prisma.files.create({ data: { id: uuidv4(), url, filename, mime_type: mime_type || 'application/octet-stream', size: size || null, uploaded_by: userId, purpose: purpose || null } });
  res.status(201).json(file);
};

const deleteFile = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user as string;
  const { id } = req.params;

  if (!userId) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const file = await prisma.files.findUnique({ where: { id } });
  if (!file) {
    res.status(404).json({ message: 'File not found' });
    return;
  }

  if (file.uploaded_by !== userId) {
    res.status(403).json({ message: 'Not allowed' });
    return;
  }

  await prisma.files.delete({ where: { id } });
  res.status(200).json({ message: 'Deleted' });
};

export { createFile, deleteFile };
