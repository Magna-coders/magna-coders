import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const getCompanyById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const company = await prisma.companies.findUnique({ where: { id } });
  if (!company) {
    res.status(404).json({ message: 'Company not found' });
    return;
  }
  res.status(200).json(company);
};

const getCompanyBySlug = async (req: Request, res: Response): Promise<void> => {
  const { slug } = req.params;
  const company = await prisma.companies.findFirst({ where: { slug } });
  if (!company) {
    res.status(404).json({ message: 'Company not found' });
    return;
  }
  res.status(200).json(company);
};

const getCompanyOpportunities = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const opportunities = await prisma.opportunities.findMany({ where: { company_id: id } });
  res.status(200).json({ total: opportunities.length, items: opportunities });
};

export { getCompanyById, getCompanyBySlug, getCompanyOpportunities };
