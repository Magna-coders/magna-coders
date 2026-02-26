
class ProjectService {
  private projectModel: any;

  constructor() {
    this.projectModel = null;
  }

  // Create new project
  async createProject(projectData: {
    title: string;
    description: string;
    projectType: 'WEBSITE' | 'MOBILE_APP' | 'DESKTOP_APP' | 'API' | 'OTHER';
    technologies: string[];
    budget: number;
    deadline?: Date;
    clientId: string;
    categoryId: string;
  }) {
    // Validate required fields
    if (!projectData.title?.trim() || !projectData.description?.trim() || !projectData.budget) {
      throw new Error('Title, description, and budget are required');
    }

    if (projectData.budget <= 0) {
      throw new Error('Budget must be greater than 0');
    }

    return await this.projectModel.create(projectData);
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

    return await this.projectModel.placeBid(projectId, bidderId, amount, proposal);
  }

  // Accept bid
  async acceptBid(projectId: string, bidId: string, clientId: string) {
    const result = await this.projectModel.acceptBid(projectId, bidId, clientId);

    // Award tokens to developer
    // This would be handled by the user service

    return result;
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
    role?: 'client' | 'assignee' | 'both';
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
      (project: any) => project.budget && project.budget >= minBudget && project.budget <= maxBudget
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
      this.projectModel.findMany({ status: 'OPEN', limit: 1 }).then((r: any) => r.totalCount),
      this.projectModel.findMany({ status: 'IN_PROGRESS', limit: 1 }).then((r: any) => r.totalCount),
      this.projectModel.findMany({ status: 'COMPLETED', limit: 1 }).then((r: any) => r.totalCount),
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