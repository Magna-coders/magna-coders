import { PrismaClient } from '@prisma/client';
import { prisma, db } from '../utils/prismaClient';

type ProjectStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
type ProjectType = 'FIXED_PRICE' | 'HOURLY' | 'MILESTONE';
type BidStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export class Project {
  private prisma: any;

  constructor() {
    this.prisma = prisma;
  }

  // Find project by ID
  async findById(id: string) {
    return await db.projects.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            profile_complete_percentage: true,
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
                avatar_url: true,
                profile_complete_percentage: true,
              }
            }
          }
        },
        _count: {
          select: { project_members: true }
        }
      }
    });
  }

  // Get projects with pagination and filtering
  async findMany(options: {
    page?: number;
    limit?: number;
    status?: ProjectStatus;
    categoryId?: string;
    clientId?: string;
    assignedToId?: string;
    sortBy?: string;
    minBudget?: number;
    maxBudget?: number;
    search?: string;
  } = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      categoryId,
      clientId,
      assignedToId,
      sortBy = 'newest',
      minBudget,
      maxBudget,
      search
    } = options;

    let orderBy: any = { created_at: 'desc' };
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
        orderBy = { created_at: 'desc' };
        break;
    }

    let where: any = {};
    if (status) where.status = status;
    if (categoryId) where.category_id = categoryId;
    if (clientId) where.owner_id = clientId;
    if (assignedToId) {
      where.project_members = {
        some: {
          user_id: assignedToId
        }
      };
    }
    if (minBudget || maxBudget) {
      where.budget = {};
      if (minBudget) where.budget.gte = minBudget;
      if (maxBudget) where.budget.lte = maxBudget;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const totalCount = await db.projects.count({ where });

    const projects = await db.projects.findMany({
      where,
      orderBy,
      take: limit,
      skip: (page - 1) * limit,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            profile_complete_percentage: true,
          }
        },
        categories: {
          select: {
            id: true,
            name: true,
          }
        },
        project_members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar_url: true,
                profile_complete_percentage: true,
              }
            }
          }
        },
        _count: {
          select: { project_members: true }
        }
      }
    });

    return {
      projects: projects.map((project: any) => ({
        ...project,
        memberCount: project._count.project_members,
        _count: undefined,
      })),
      totalCount,
      page,
      limit,
    };
  }

  // Create new project
  async create(data: {
    title: string;
    description: string;
    projectType: ProjectType;
    technologies?: string[];
    budget: number;
    deadline?: Date;
    ownerId: string;
    categoryId?: string;
  }) {
    return await db.projects.create({
      data: {
        title: data.title,
        description: data.description || '',
        type: data.projectType,
        technologies: data.technologies || [],
        budget: data.budget,
        deadline: data.deadline,
        owner_id: data.ownerId,
        category_id: data.categoryId,
        status: 'OPEN',
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
        }
      }
    });
  }

  // Update project
  async update(id: string, data: {
    title?: string;
    description?: string;
    projectType?: ProjectType;
    technologies?: string[];
    budget?: number;
    deadline?: Date;
    categoryId?: string;
    status?: ProjectStatus;
  }) {
    return await db.projects.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.projectType && { type: data.projectType }),
        ...(data.technologies && { technologies: data.technologies }),
        ...(data.budget && { budget: data.budget }),
        ...(data.deadline && { deadline: data.deadline }),
        ...(data.categoryId && { category_id: data.categoryId }),
        ...(data.status && { status: data.status }),
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
        project_members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar_url: true,
              }
            }
          }
        }
      }
    });
  }

  // Delete project
  async delete(id: string) {
    return await db.projects.delete({
      where: { id }
    });
  }

  // Add member to project
  async addMember(projectId: string, userId: string, role: string = 'member') {
    const existing = await db.project_members.findFirst({
      where: {
        project_id: projectId,
        user_id: userId
      }
    });

    if (existing) {
      throw new Error('User is already a member of this project');
    }

    return await db.project_members.create({
      data: {
        project_id: projectId,
        user_id: userId,
        role: role
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
          }
        }
      }
    });
  }

  // Remove member from project
  async removeMember(projectId: string, userId: string) {
    const member = await db.project_members.findFirst({
      where: {
        project_id: projectId,
        user_id: userId
      }
    });

    if (!member) {
      throw new Error('User is not a member of this project');
    }

    return await db.project_members.delete({
      where: { id: member.id }
    });
  }

  // Update project status with validation
  async updateStatus(id: string, status: ProjectStatus, updatedBy: string) {
    const project = await db.projects.findUnique({
      where: { id },
      include: {
        project_members: true
      }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const isMember = project.project_members.some((m: any) => m.user_id === updatedBy);
    const isOwner = project.owner_id === updatedBy;

    if (!isOwner && !isMember) {
      throw new Error('Not authorized to update project status');
    }

    // Validate status transitions
    if (project.status === 'COMPLETED' && status !== 'COMPLETED') {
      throw new Error('Cannot change status of completed project');
    }

    if (project.status === 'CANCELLED' && status !== 'CANCELLED') {
      throw new Error('Cannot change status of cancelled project');
    }

    return await db.projects.update({
      where: { id },
      data: {
        status,
        updated_at: new Date()
      }
    });
  }

  // Search projects
  async search(query: string, options: {
    page?: number;
    limit?: number;
    categoryId?: string;
    status?: ProjectStatus;
  } = {}) {
    const {
      page = 1,
      limit = 20,
      categoryId,
      status
    } = options;

    const where: any = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ]
    };

    if (categoryId) where.category_id = categoryId;
    if (status) where.status = status;

    const totalCount = await db.projects.count({ where });

    const projects = await db.projects.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
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
        project_members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar_url: true,
              }
            }
          }
        },
        _count: {
          select: { project_members: true }
        }
      }
    });

    return {
      projects: projects.map((project: any) => ({
        ...project,
        memberCount: project._count.project_members,
        _count: undefined
      })),
      totalCount,
      page,
      limit
    };
  }

  // Get user's projects (as owner or member)
  async getUserProjects(userId: string, options: {
    page?: number;
    limit?: number;
    role?: 'owner' | 'member' | 'both';
    status?: ProjectStatus;
  } = {}) {
    const {
      page = 1,
      limit = 20,
      role = 'both',
      status
    } = options;

    let where: any = {};
    if (role === 'owner') {
      where.owner_id = userId;
    } else if (role === 'member') {
      where.project_members = {
        some: { user_id: userId }
      };
    } else {
      where.OR = [
        { owner_id: userId },
        {
          project_members: {
            some: { user_id: userId }
          }
        }
      ];
    }

    if (status) {
      where.status = status;
    }

    return await db.projects.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
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
        project_members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar_url: true,
              }
            }
          }
        },
        _count: {
          select: { project_members: true }
        }
      }
    });
  }
}

export default Project;