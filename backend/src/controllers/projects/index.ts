import { Request, Response } from 'express';
import { prisma, db } from '../../utils/prismaClient';
import paginateResults from '../../utils/paginateResults';

const getProjects = async (req: Request, res: Response): Promise<void> => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const status = req.query.status as any;
  const categoryId = req.query.category as string;
  const sortBy = req.query.sortby as string;

  let orderBy: any = { createdAt: 'desc' };
  switch (sortBy) {
    case 'budget_high':
      orderBy = { budget: 'desc' };
      break;
    case 'budget_low':
      orderBy = { budget: 'asc' };
      break;
    case 'deadline':
      orderBy = { deadline: 'asc' };
      break;
    case 'newest':
      orderBy = { createdAt: 'desc' };
      break;
  }

  const where: any = {};
  if (status) where.status = status;
  if (categoryId) where.categoryId = categoryId;

  const totalCount = await db.projects.count({ where } as any);

  const projects = await db.projects.findMany({
    where,
    orderBy,
    take: limit,
    skip: (page - 1) * limit,
    include: {
      client: {
        select: {
          id: true,
          username: true,
          avatar: true,
          isVerified: true,
        }
      },
      assignedTo: {
        select: {
          id: true,
          username: true,
          avatar: true,
          isVerified: true,
        }
      },
      category: {
        select: {
          id: true,
          name: true,
          icon: true,
        }
      },
      bids: {
        include: {
          bidder: {
            select: {
              id: true,
              username: true,
              avatar: true,
              isVerified: true,
            }
          }
        },
        orderBy: { amount: 'asc' }
      },
      _count: {
        select: { bids: true }
      }
    }
  });

  const paginated = paginateResults(page, limit, totalCount);

  const paginatedProjects = {
    previous: paginated.results.previous,
    results: projects.map((project: any) => ({
      ...project,
      bidsCount: project._count?.bids,
      _count: undefined,
    })),
    next: paginated.results.next,
  };

  res.status(200).json(paginatedProjects);
};

const getProjectById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const project = await db.projects.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          id: true,
          username: true,
          avatar: true,
          isVerified: true,
          bio: true,
          portfolioUrl: true,
        }
      },
      assignedTo: {
        select: {
          id: true,
          username: true,
          avatar: true,
          isVerified: true,
          bio: true,
          portfolioUrl: true,
        }
      },
      category: {
        select: {
          id: true,
          name: true,
          description: true,
        }
      },
      bids: {
        include: {
          bidder: {
            select: {
              id: true,
              username: true,
              avatar: true,
              isVerified: true,
              skills: true,
            }
          }
        },
        orderBy: { amount: 'asc' }
      }
    }
  });

  if (!project) {
    res.status(404).send({ message: 'Project not found.' });
    return;
  }

  res.status(200).json(project);
};

const createProject = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user as string;
  const {
    title,
    description,
    projectType,
    technologies,
    budget,
    deadline,
    categoryId,
  } = req.body;

  if (!title || !description || !budget || !categoryId) {
    res.status(400).send({ message: 'Title, description, budget, and category are required.' });
    return;
  }

  const client = await db.users.findUnique({ where: { id: userId } } as any);
  if (!client) {
    res.status(404).send({ message: 'User not found.' });
    return;
  }

  if (client.role !== 'CLIENT' && client.role !== 'ADMIN') {
    res.status(403).send({ message: 'Only clients can create projects.' });
    return;
  }

  const category = await db.categories.findUnique({ where: { id: categoryId } } as any);
  if (!category) {
    res.status(404).send({ message: 'Category not found.' });
    return;
  }

  const project = await db.projects.create({
    data: {
      title,
      description,
      projectType,
      technologies: technologies || [],
      budget,
      deadline: deadline ? new Date(deadline) : null,
      clientId: userId,
      categoryId,
    },
    include: {
      client: {
        select: {
          id: true,
          username: true,
          avatar: true,
          isVerified: true,
        }
      },
      category: {
        select: {
          id: true,
          name: true,
        }
      }
    }
  });

  res.status(201).json(project);
};

const updateProject = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user as string;
  const updates = req.body;

  const project = await db.projects.findUnique({
    where: { id },
    include: { client: true }
  });

  if (!project) {
    res.status(404).send({ message: 'Project not found.' });
    return;
  }

  if (project.clientId !== userId) {
    res.status(403).send({ message: 'Access denied.' });
    return;
  }

  if (project.status !== 'OPEN') {
    res.status(400).send({ message: 'Can only update open projects.' });
    return;
  }

  const updatedProject = await db.projects.update({
    where: { id },
    data: {
      ...updates,
      deadline: updates.deadline ? new Date(updates.deadline) : project.deadline,
    },
    include: {
      client: {
        select: {
          id: true,
          username: true,
          avatar: true,
        }
      },
      category: {
        select: {
          id: true,
          name: true,
        }
      }
    }
  });

  res.status(200).json(updatedProject);
};

const deleteProject = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user as string;

  const project = await db.projects.findUnique({
    where: { id },
    include: { client: true }
  });

  if (!project) {
    res.status(404).send({ message: 'Project not found.' });
    return;
  }

  if (project.clientId !== userId) {
    res.status(403).send({ message: 'Access denied.' });
    return;
  }

  if (project.status !== 'OPEN') {
    res.status(400).send({ message: 'Can only delete open projects.' });
    return;
  }

  await db.projects.delete({ where: { id } });

  res.status(204).end();
};

const placeBid = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user as string;
  const { amount, proposal } = req.body;

  if (!amount || !proposal) {
    res.status(400).send({ message: 'Bid amount and proposal are required.' });
    return;
  }

  const project = await db.projects.findUnique({ where: { id } } as any);
  if (!project) {
    res.status(404).send({ message: 'Project not found.' });
    return;
  }

  if (project.status !== 'OPEN') {
    res.status(400).send({ message: 'Project is not open for bids.' });
    return;
  }

  const bidder = await db.users.findUnique({ where: { id: userId } } as any);
  if (!bidder) {
    res.status(404).send({ message: 'User not found.' });
    return;
  }

  if (bidder.role !== 'DEVELOPER' && bidder.role !== 'ADMIN') {
    res.status(403).send({ message: 'Only developers can place bids.' });
    return;
  }

  // Check if user already bid on this project
  const existingBid = await db.bids.findFirst({
    where: {
      projectId: id,
      bidderId: userId,
    }
  });

  if (existingBid) {
    res.status(400).send({ message: 'You have already placed a bid on this project.' });
    return;
  }

  const bid = await db.bids.create({
    data: {
      amount,
      proposal,
      project: { connect: { id } },
      bidder: { connect: { id: userId } },
    },
    include: {
      bidder: {
        select: {
          id: true,
          username: true,
          avatar: true,
          isVerified: true,
          skills: true,
        }
      }
    }
  });

  res.status(201).json(bid);
};

const acceptBid = async (req: Request, res: Response): Promise<void> => {
  const { projectId, bidId } = req.params;
  const userId = req.user as string;

  const project = await db.projects.findUnique({
    where: { id: projectId },
    include: { client: true }
  });

  if (!project) {
    res.status(404).send({ message: 'Project not found.' });
    return;
  }

  if (project.clientId !== userId) {
    res.status(403).send({ message: 'Access denied.' });
    return;
  }

  const bid = await db.bids.findUnique({
    where: { id: bidId },
    include: { bidder: true }
  });

  if (!bid || bid.projectId !== projectId) {
    res.status(404).send({ message: 'Bid not found.' });
    return;
  }

  // Update project
  await db.projects.update({
    where: { id: projectId },
    data: {
      assignedToId: bid.bidderId,
      status: 'IN_PROGRESS',
    }
  });

  // Update bid status
  await db.bids.update({
    where: { id: bidId },
    data: { status: 'ACCEPTED' }
  });

  // Reject other bids
  await db.bids.updateMany({
    where: {
      projectId,
      id: { not: bidId }
    },
    data: { status: 'REJECTED' }
  });

  // Award tokens to developer
  await db.users.update({
    where: { id: bid.bidderId },
    data: { tokens: { increment: 50 } }
  });

  res.status(200).json({ message: 'Bid accepted successfully.' });
};

export {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  placeBid,
  acceptBid,
};