import { Project } from '../api';
import { db } from '../utils/prismaClient';

type ProjectType = 'FIXED_PRICE' | 'HOURLY' | 'MILESTONE';
type ProjectStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

class ProjectService {
  private projectModel: Project;

  constructor() {
    this.projectModel = new Project();
  }

  // Create new project
  async createProject(projectData: {
    title: string;
    description: string;
    projectType: ProjectType;
    technologies: string[];
    budget: number;
    deadline?: Date;
    clientId: string;
    categoryId?: string;
  }) {
    // Validate required fields
    if (!projectData.title?.trim() || !projectData.description?.trim() || !projectData.budget) {
      throw new Error('Title, description, and budget are required');
    }

    if (projectData.budget <= 0) {
      throw new Error('Budget must be greater than 0');
    }

    return await this.projectModel.create({
      title: projectData.title,
      description: projectData.description,
      projectType: projectData.projectType,
      technologies: projectData.technologies,
      budget: projectData.budget,
      deadline: projectData.deadline,
      ownerId: projectData.clientId,
      categoryId: projectData.categoryId
    });
  }

  // Get projects with filtering
  async getProjects(options: {
    page?: number;
    limit?: number;
    status?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    categoryId?: string;
    clientId?: string;
    assignedToId?: string;
    sortBy?: string;
  } = {}) {
    return await this.projectModel.findMany(options);
  }

  // Get single project
  async getProjectById(id: string) {
    const project = await this.projectModel.findById(id);
    if (!project) {
      throw new Error('Project not found');
    }
    return project;
  }

  // Update project
  async updateProject(id: string, updates: Partial<{
    title: string;
    description: string;
    technologies: string[];
    budget: number;
    deadline: Date;
    status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  }>, clientId: string) {
    const project = await this.projectModel.findById(id);
    if (!project) {
      throw new Error('Project not found');
    }

    if (project.clientId !== clientId) {
      throw new Error('Access denied');
    }

    if (project.status !== 'OPEN') {
      throw new Error('Can only update open projects');
    }

    return await this.projectModel.update(id, updates);
  }

  // Delete project
  async deleteProject(id: string, clientId: string) {
    const project = await this.projectModel.findById(id);
    if (!project) {
      throw new Error('Project not found');
    }

    if (project.clientId !== clientId) {
      throw new Error('Access denied');
    }

    if (project.status !== 'OPEN') {
      throw new Error('Can only delete open projects');
    }

    await this.projectModel.delete(id);
    return { message: 'Project deleted successfully' };
  }

  // Place bid on project
  async placeBid(projectId: string, bidderId: string, amount: number, proposal: string) {
    if (amount <= 0) {
      throw new Error('Bid amount must be greater than 0');
    }

    if (!proposal?.trim()) {
      throw new Error('Proposal is required');
    }

    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    if (project.status !== 'OPEN') {
      throw new Error('Can only bid on open projects');
    }

    return await db.project_bids.create({
      data: {
        project_id: projectId,
        user_id: bidderId,
        amount,
        proposal: proposal.trim(),
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar_url: true
          }
        }
      }
    });
  }

  // Accept bid
  async acceptBid(projectId: string, bidId: string, clientId: string) {
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    if (project.owner_id !== clientId) {
      throw new Error('Only project owner can accept bids');
    }

    if (project.status !== 'OPEN') {
      throw new Error('Can only accept bids on open projects');
    }

    const bid = await db.project_bids.findUnique({
      where: { id: bidId }
    });

    if (!bid) {
      throw new Error('Bid not found');
    }

    if (bid.status !== 'PENDING') {
      throw new Error('Can only accept pending bids');
    }

    // Start transaction to update bid and project
    const [updatedBid, updatedProject] = await db.$transaction([
      // Update bid status
      db.project_bids.update({
        where: { id: bidId },
        data: { status: 'ACCEPTED' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar_url: true
            }
          }
        }
      }),
      // Update project status and add member
      db.projects.update({
        where: { id: projectId },
        data: {
          status: 'IN_PROGRESS',
          project_members: {
            create: {
              user_id: bid.user_id,
              role: 'member'
            }
          }
        }
      })
    ]);

    // Award tokens to developer (would be handled by user service)
    
    return {
      bid: updatedBid,
      project: updatedProject
    };
  }

  // Update project status
  async updateProjectStatus(id: string, status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED', updatedBy: string) {
    await this.projectModel.updateStatus(id, status, updatedBy);
    return { message: `Project status updated to ${status}` };
  }

  // Get user's projects
  async getUserProjects(userId: string, options: {
    page?: number;
    limit?: number;
    role?: 'owner' | 'member' | 'both';
    status?: ProjectStatus;
  } = {}) {
    return await this.projectModel.getUserProjects(userId, options);
  }

  // Get open projects
  async getOpenProjects(options: {
    page?: number;
    limit?: number;
    categoryId?: string;
    sortBy?: string;
  } = {}) {
    return await this.projectModel.findMany({
      ...options,
      status: 'OPEN',
    });
  }

  // Get projects by category
  async getProjectsByCategory(categoryId: string, options: {
    page?: number;
    limit?: number;
    status?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  } = {}) {
    return await this.projectModel.findMany({
      ...options,
      categoryId,
    });
  }

  // Get projects by budget range
  async getProjectsByBudgetRange(minBudget: number, maxBudget: number, options: {
    page?: number;
    limit?: number;
    status?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  } = {}) {
    // This would require a custom query in the model
    // For now, we'll filter in memory
    const projects = await this.projectModel.findMany({
      ...options,
      limit: 1000, // Get more to filter
    });

    const filteredProjects = projects.projects.filter(
      (project: { budget: number }) => project.budget && project.budget >= minBudget && project.budget <= maxBudget
    );

    return {
      ...projects,
      projects: filteredProjects.slice(0, options.limit || 20),
      totalCount: filteredProjects.length,
    };
  }

  // Get project statistics
  async getProjectStats() {
    // This would require custom aggregation queries
    // For now, return basic counts
    const [openCount, inProgressCount, completedCount] = await Promise.all([
      this.projectModel.findMany({ status: 'OPEN', limit: 1 }).then(r => r.totalCount),
      this.projectModel.findMany({ status: 'IN_PROGRESS', limit: 1 }).then(r => r.totalCount),
      this.projectModel.findMany({ status: 'COMPLETED', limit: 1 }).then(r => r.totalCount),
    ]);

    return {
      open: openCount,
      inProgress: inProgressCount,
      completed: completedCount,
      total: openCount + inProgressCount + completedCount,
    };
  }
}

export default ProjectService;