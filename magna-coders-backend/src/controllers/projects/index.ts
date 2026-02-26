import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import paginateResults from '../../utils/paginateResults';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const getProjects = async (req: Request, res: Response): Promise<void> => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const categoryId = req.query.category as string;
  const sortBy = req.query.sortby as string;

  let orderBy: any = { created_at: 'desc' };
  switch (sortBy) {
    case 'budget_high':
      orderBy = { created_at: 'desc' };
      break;
    case 'budget_low':
      orderBy = { created_at: 'asc' };
      break;
    case 'deadline':
      orderBy = { created_at: 'asc' };
      break;
    case 'newest':
      orderBy = { created_at: 'desc' };
      break;
  }

  const where: any = {};
  if (categoryId) where.category_id = categoryId;

  const totalCount = await prisma.projects.count({ where });

  const projects = await prisma.projects.findMany({
    where,
    orderBy,
    take: limit,
    skip: (page - 1) * limit,
    include: {
      owner: {
        select: { id: true, username: true, avatar_url: true }
      },
      categories: {
        select: { id: true, name: true }
      },
      project_members: true,
      _count: {
        select: { project_members: true }
      }
    }
  });

  const paginated = paginateResults(page, limit, totalCount);

  const paginatedProjects = {
    previous: paginated.results.previous,
    results: projects.map(project => ({
      ...project,
      type: 'project',
      membersJoined: project._count.project_members,
      deadlineProgress: project.deadline
        ? Math.max(0, Math.min(100, 100 - ((Date.now() - project.created_at!.getTime()) / (project.deadline.getTime() - project.created_at!.getTime())) * 100))
        : null,
      timeLeft: project.deadline ? Math.max(0, Math.floor((project.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null
    })),
    next: paginated.results.next,
  };

  res.status(200).json(paginatedProjects);
};

const getProjectById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const project = await prisma.projects.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          username: true,
          avatar_url: true,
          bio: true,
        }
      },
      categories: {
        select: {
          id: true,
          name: true,
          description: true,
        }
      },
      project_members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar_url: true
            }
          }
        }
      },
      _count: {
        select: { project_members: true }
      }
    }
  });

  if (!project) {
    res.status(404).send({ message: 'Project not found.' });
    return;
  }

  res.status(200).json({
    ...project,
    type: 'project',
    membersJoined: project._count.project_members,
    deadlineProgress: project.deadline
      ? Math.max(0, Math.min(100, 100 - ((Date.now() - project.created_at!.getTime()) / (project.deadline.getTime() - project.created_at!.getTime())) * 100))
      : null,
    timeLeft: project.deadline ? Math.max(0, Math.floor((project.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null
  });
};

const createProject = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user as string;
  const {
    title,
    description,
    categoryId,
    membersNeeded,
    deadline,
  } = req.body;

  if (!title || !description) {
    res.status(400).send({ message: 'Title and description are required.' });
    return;
  }

  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).send({ message: 'User not found.' });
    return;
  }

  if (categoryId) {
    const category = await prisma.categories.findUnique({ where: { id: categoryId } });
    if (!category) {
      res.status(404).send({ message: 'Category not found.' });
      return;
    }
  }

  const project = await prisma.projects.create({
    data: {
      id: uuidv4(),
      title,
      description,
      owner_id: userId,
      category_id: categoryId || null,
      members_needed: membersNeeded || 0,
      deadline: deadline ? new Date(deadline) : null,
    },
    include: {
      owner: {
        select: {
          id: true,
          username: true,
          avatar_url: true,
        }
      },
      categories: {
        select: {
          id: true,
          name: true,
        }
      },
      _count: {
        select: { project_members: true }
      }
    }
  });

  res.status(201).json({
    ...project,
    type: 'project',
    membersJoined: project._count.project_members
  });
};

const updateProject = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user as string;
  const { title, description, category_id, membersNeeded, deadline } = req.body;

  const project = await prisma.projects.findUnique({
    where: { id },
    include: { owner: true }
  });

  if (!project) {
    res.status(404).send({ message: 'Project not found.' });
    return;
  }

  if (project.owner_id !== userId) {
    res.status(403).send({ message: 'Access denied.' });
    return;
  }

  const updatedProject = await prisma.projects.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(description && { description }),
      ...(category_id && { category_id }),
      ...(membersNeeded !== undefined && { members_needed: membersNeeded }),
      ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
      updated_at: new Date(),
    },
    include: {
      owner: {
        select: {
          id: true,
          username: true,
          avatar_url: true,
        }
      },
      categories: {
        select: {
          id: true,
          name: true,
        }
      },
      _count: {
        select: { project_members: true }
      }
    }
  });

  res.status(200).json({
    ...updatedProject,
    type: 'project',
    membersJoined: updatedProject._count.project_members
  });
};

const deleteProject = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user as string;

  const project = await prisma.projects.findUnique({
    where: { id },
    include: { owner: true }
  });

  if (!project) {
    res.status(404).send({ message: 'Project not found.' });
    return;
  }

  if (project.owner_id !== userId) {
    res.status(403).send({ message: 'Access denied.' });
    return;
  }

  await prisma.projects.delete({ where: { id } });

  res.status(204).end();
};




// --- Project Members ---
const addProjectMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.projectId as string;
    const { userId, role } = req.body;
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }
    const project = await prisma.projects.findUnique({ where: { id: projectId } });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const member = await prisma.project_members.create({
      data: {
        id: uuidv4(),
        project_id: projectId,
        user_id: userId,
        role: role || 'member',
      },
      include: { user: { select: { id: true, username: true, avatar_url: true } } }
    });
    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add project member', details: error instanceof Error ? error.message : error });
  }
};

const removeProjectMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, userId } = req.params;
    const member = await prisma.project_members.findFirst({ where: { project_id: projectId, user_id: userId } });
    if (!member) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }
    await prisma.project_members.delete({ where: { id: member.id } });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove project member', details: error instanceof Error ? error.message : error });
  }
};

const getProjectMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const members = await prisma.project_members.findMany({
      where: { project_id: projectId },
      include: { user: { select: { id: true, username: true, avatar_url: true }, }, },
    });
    res.status(200).json({ members });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get project members', details: error instanceof Error ? error.message : error });
  }
};
const getProjectActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const activity = await prisma.project_events.findMany({
      where: { project_id: projectId },
      orderBy: { created_at: 'desc' },
      include: {
        users: { select: { id: true, username: true, avatar_url: true } }
      }
    });
    res.status(200).json({ activity });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get project activity', details: error instanceof Error ? error.message : error });
  }
};
const getProjectFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const files = await prisma.project_attachments.findMany({
      where: { project_id: projectId },
      include: {
        files: { select: { id: true, url: true, filename: true, mime_type: true, size: true, uploaded_at: true } }
      }
    });
    res.status(200).json({ files: files.map(f => f.files) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get project files', details: error instanceof Error ? error.message : error });
  }
};
const getProjectTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const tasks = await prisma.project_tasks.findMany({
      where: { project_id: projectId },
      orderBy: { created_at: 'desc' },
    });
    res.status(200).json({ tasks });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get project tasks', details: error instanceof Error ? error.message : error });
  }
};

export {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  getProjectMembers,
  getProjectActivity,
  getProjectFiles,
  getProjectTasks,
};