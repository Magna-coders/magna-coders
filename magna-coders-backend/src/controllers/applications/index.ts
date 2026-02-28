import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const createApplication = async (req: Request, res: Response): Promise<void> => {
  try {
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

    // Check if user already applied
    const existingApplication = await prisma.applications.findFirst({
      where: {
        opportunity_id: opportunityId,
        user_id: userId
      }
    });

    if (existingApplication) {
      res.status(400).json({ message: 'You have already applied to this job' });
      return;
    }

    // Get opportunity details for notification
    const opportunity = await prisma.opportunities.findUnique({
      where: { id: opportunityId },
      select: { title: true, author_id: true }
    });

    if (!opportunity) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    // Get applicant details
    const applicant = await prisma.users.findUnique({
      where: { id: userId },
      select: { username: true }
    });

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

    // Create notification for job poster
    await prisma.notifications.create({
      data: {
        id: uuidv4(),
        user_id: opportunity.author_id,
        title: 'New Job Application',
        message: `${applicant?.username || 'Someone'} applied to your job: ${opportunity.title}`,
        is_read: false,
        application_id: application.id,
        opportunity_id: opportunityId
      }
    });

    res.status(201).json({ 
      success: true,
      application_id: application.id, 
      status: application.status, 
      submitted_at: application.submitted_at 
    });
  } catch (error: any) {
    console.error('Create application error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit application' });
  }
};

const getApplicationsForOpportunity = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user as string;
  const { id } = req.params;

  if (!userId) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  // Check if user owns this opportunity
  const opportunity = await prisma.opportunities.findUnique({
    where: { id },
    select: { author_id: true }
  });

  if (!opportunity) {
    res.status(404).json({ message: 'Job not found' });
    return;
  }

  if (opportunity.author_id !== userId) {
    res.status(403).json({ message: 'You can only view applications for your own jobs' });
    return;
  }

  const applications = await prisma.applications.findMany({ 
    where: { opportunity_id: id }, 
    include: { 
      users: { 
        select: { 
          id: true, 
          username: true, 
          avatar_url: true,
          bio: true,
          location: true,
          github_url: true,
          linkedin_url: true,
          website_url: true
        } 
      } 
    },
    orderBy: { submitted_at: 'desc' }
  });

  res.status(200).json({ total: applications.length, items: applications });
};

const getUserApplications = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user as string;

  if (!userId) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const apps = await prisma.applications.findMany({ 
    where: { user_id: userId }, 
    include: { opportunities: true },
    orderBy: { submitted_at: 'desc' }
  });
  res.status(200).json({ total: apps.length, items: apps });
};

const updateApplicationStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user as string;
    const { id } = req.params;
    const { status } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!['submitted', 'reviewed', 'accepted', 'rejected'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }

    // Get application with opportunity details
    const application = await prisma.applications.findUnique({
      where: { id },
      include: {
        opportunities: { select: { author_id: true, title: true } },
        users: { select: { username: true } }
      }
    });

    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found' });
      return;
    }

    // Only job poster can update application status
    if (application.opportunities.author_id !== userId) {
      res.status(403).json({ success: false, message: 'You can only update applications for your own jobs' });
      return;
    }

    const updated = await prisma.applications.update({
      where: { id },
      data: { status }
    });

    // Notify applicant of status change
    if (status === 'accepted' || status === 'rejected') {
      await prisma.notifications.create({
        data: {
          id: uuidv4(),
          user_id: application.user_id,
          title: `Application ${status === 'accepted' ? 'Accepted' : 'Rejected'}`,
          message: `Your application for "${application.opportunities.title}" has been ${status}`,
          is_read: false,
          application_id: id,
          opportunity_id: application.opportunity_id
        }
      });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Update application status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update application status' });
  }
};

const uploadResume = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user as string;
    const { id } = req.params; // application id
    const file = req.file;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    // Get application
    const application = await prisma.applications.findUnique({
      where: { id }
    });

    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found' });
      return;
    }

    // Only applicant can upload resume
    if (application.user_id !== userId) {
      res.status(403).json({ success: false, message: 'You can only upload resume for your own applications' });
      return;
    }

    // Update application with resume URL
    const resumeUrl = `/uploads/${file.filename}`;
    const updated = await prisma.applications.update({
      where: { id },
      data: { resume_url: resumeUrl }
    });

    res.status(200).json({ 
      success: true, 
      message: 'Resume uploaded successfully',
      resume_url: resumeUrl
    });
  } catch (error: any) {
    console.error('Upload resume error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload resume' });
  }
};

export { createApplication, getApplicationsForOpportunity, getUserApplications, updateApplicationStatus, uploadResume };