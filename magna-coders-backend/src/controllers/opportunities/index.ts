import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const getOpportunities = async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.max(Number(req.query.limit || 10), 1);
  const skip = (page - 1) * limit;
  const { q, category, location, company, status, sort } = req.query as Record<string, string>;

  const where: any = {};
  if (q) where.title = { contains: q, mode: 'insensitive' };
  if (category) where.category_id = category;
  if (location) where.location = { contains: location, mode: 'insensitive' };
  if (company) where.company = { contains: company, mode: 'insensitive' };
  if (status) where.status = status;

  const orderBy: any = {};
  if (sort === 'newest') orderBy.created_at = 'desc';
  else orderBy.created_at = 'desc';

  const [items, total] = await Promise.all([
    prisma.opportunities.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        users: { select: { id: true, username: true, avatar_url: true } },
        categories: { select: { id: true, name: true } },
        companies: { select: { id: true, name: true, slug: true, logo_url: true } }
      }
    }),
    prisma.opportunities.count({ where })
  ]);

  const totalPages = Math.ceil(total / limit);

  res.status(200).json({ meta: { page, limit, total, totalPages }, items });
};

const getOpportunityById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const bySlug = req.query.slug === 'true';

  const where = bySlug ? { slug: id } : { id };

  const opp = await prisma.opportunities.findFirst({ where, include: { companies: true, users: { select: { id: true, username: true, avatar_url: true } } } });
  if (!opp) {
    res.status(404).json({ message: 'Opportunity not found' });
    return;
  }

  res.status(200).json(opp);
};

const createOpportunity = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user as string;
    const { title, description, company, location, salary, job_type, deadline, category_id } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!title || !description) {
      res.status(400).json({ success: false, message: 'Title and description are required' });
      return;
    }

    const opportunity = await prisma.opportunities.create({
      data: {
        id: uuidv4(),
        title,
        description,
        company: company || null,
        location: location || null,
        salary: salary || null,
        job_type: job_type || 'Full-time',
        deadline: deadline ? new Date(deadline) : null,
        author_id: userId,
        category_id: category_id || null
      },
      include: {
        users: { select: { id: true, username: true, avatar_url: true } }
      }
    });

    res.status(201).json({ success: true, data: opportunity });
  } catch (error: any) {
    console.error('Create opportunity error:', error);
    res.status(500).json({ success: false, message: 'Failed to create job posting' });
  }
};

const updateOpportunity = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user as string;
    const { id } = req.params;
    const { title, description, company, location, salary, job_type, deadline } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // Check if user owns this opportunity
    const existing = await prisma.opportunities.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Job not found' });
      return;
    }

    if (existing.author_id !== userId) {
      res.status(403).json({ success: false, message: 'You can only edit your own job postings' });
      return;
    }

    const updated = await prisma.opportunities.update({
      where: { id },
      data: {
        title: title || existing.title,
        description: description || existing.description,
        company: company !== undefined ? company : existing.company,
        location: location !== undefined ? location : existing.location,
        salary: salary !== undefined ? salary : existing.salary,
        job_type: job_type || existing.job_type,
        deadline: deadline ? new Date(deadline) : existing.deadline,
        updated_at: new Date()
      }
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Update opportunity error:', error);
    res.status(500).json({ success: false, message: 'Failed to update job posting' });
  }
};

const deleteOpportunity = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user as string;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // Check if user owns this opportunity
    const existing = await prisma.opportunities.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Job not found' });
      return;
    }

    if (existing.author_id !== userId) {
      res.status(403).json({ success: false, message: 'You can only delete your own job postings' });
      return;
    }

    await prisma.opportunities.delete({ where: { id } });

    res.status(200).json({ success: true, message: 'Job deleted successfully' });
  } catch (error: any) {
    console.error('Delete opportunity error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete job posting' });
  }
};

const getRecommendedOpportunities = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user as string;
    const limit = Math.max(Number(req.query.limit || 10), 1);

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // Get user profile to match skills
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { bio: true, location: true }
    });

    // For now, simple recommendation based on location
    // In production, you'd use skills matching, ML, etc.
    const where: any = {};
    if (user?.location) {
      where.location = { contains: user.location, mode: 'insensitive' };
    }

    const opportunities = await prisma.opportunities.findMany({
      where,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        users: { select: { id: true, username: true, avatar_url: true } },
        companies: { select: { id: true, name: true, logo_url: true } }
      }
    });

    res.status(200).json({ success: true, data: opportunities });
  } catch (error: any) {
    console.error('Get recommended opportunities error:', error);
    res.status(500).json({ success: false, message: 'Failed to get recommendations' });
  }
};

export { getOpportunities, getOpportunityById, createOpportunity, updateOpportunity, deleteOpportunity, getRecommendedOpportunities };
