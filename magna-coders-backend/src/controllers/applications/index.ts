import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const createApplication = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user as string;
  const { resumeUrl, coverLetter, metadata } = req.body;
  const opportunityId = (req.params && (req.params as any).id) || req.body.opportunityId;

  if (!userId) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  if (!opportunityId) {
    res.status(400).json({ message: 'opportunityId is required' });
    return;
  }

  const application = await prisma.applications.create({
    data: {
      id: uuidv4(),
      opportunity_id: opportunityId,
      user_id: userId,
      resume_url: resumeUrl || null,
      cover_letter: coverLetter || null,
      metadata: metadata || null
    }
  });

  res.status(201).json({ application_id: application.id, status: application.status, submitted_at: application.submitted_at });
};

const getApplicationsForOpportunity = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user as string;
  const { id } = req.params;

  if (!userId) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  // Only the owner/author of the opportunity or admin should call this in production
  const applications = await prisma.applications.findMany({ where: { opportunity_id: id }, include: { user: { select: { id: true, username: true, avatar_url: true } } } });

  res.status(200).json({ total: applications.length, items: applications });
};

const getUserApplications = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user as string;

  if (!userId) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const apps = await prisma.applications.findMany({ where: { user_id: userId }, include: { opportunity: true } });
  res.status(200).json({ total: apps.length, items: apps });
};

export { createApplication, getApplicationsForOpportunity, getUserApplications };
  
// Path: src/controllers/opportunity.controller.tsimport { Request, Response } from 'express';