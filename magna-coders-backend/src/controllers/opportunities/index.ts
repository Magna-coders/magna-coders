import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

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
        author: { select: { id: true, username: true, avatar_url: true } },
        categories: { select: { id: true, name: true } },
        company_ref: { select: { id: true, name: true, slug: true, logo_url: true } }
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

  const opp = await prisma.opportunities.findFirst({ where, include: { company_ref: true, author: { select: { id: true, username: true, avatar_url: true } } } });
  if (!opp) {
    res.status(404).json({ message: 'Opportunity not found' });
    return;
  }

  res.status(200).json(opp);
};

export { getOpportunities, getOpportunityById };
