import { PrismaClient } from '@prisma/client';
import { prisma, db } from '../utils/prismaClient';

// Type definitions matching the schema
type UserRole = 'ADMIN' | 'DEVELOPER' | 'CLIENT' | 'MODERATOR';
type UserAvailability = 'available' | 'busy' | 'offline';

export class User {
  private prisma: any;

  constructor() {
    this.prisma = prisma;
  }

  // Find user by ID
  async findById(id: string) {
    return await db.users.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            roles: true
          }
        },
        skills: {
          include: {
            skills: true
          }
        },
        categories: {
          include: {
            categories: true
          }
        }
      }
    });
  }

  // Find user by username (case insensitive)
  async findByUsername(username: string) {
    return await db.users.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive'
        }
      },
      include: {
        roles: {
          include: {
            roles: true
          }
        }
      }
    });
  }

  // Find user by email
  async findByEmail(email: string) {
    return await db.users.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            roles: true
          }
        }
      }
    });
  }

  // Create new user
  async create(data: {
    username: string;
    email: string;
    availability?: UserAvailability;
    avatar_url?: string;
    location?: string;
    bio?: string;
    website_url?: string;
    github_url?: string;
    linkedin_url?: string;
    twitter_url?: string;
    whatsapp_url?: string;
  }) {
    return await db.users.create({
      data: {
        ...data,
        profile_complete_percentage: this.calculateProfileCompletion(data),
      },
      include: {
        roles: {
          include: {
            roles: true
          }
        }
      }
    });
  }

  // Update user
  async update(id: string, data: {
    username?: string;
    email?: string;
    availability?: UserAvailability;
    avatar_url?: string;
    location?: string;
    bio?: string;
    website_url?: string;
    github_url?: string;
    linkedin_url?: string;
    twitter_url?: string;
    whatsapp_url?: string;
  }) {
    const updateData = {
      ...data,
      profile_complete_percentage: this.calculateProfileCompletion({
        ...(await this.findById(id)),
        ...data
      }),
      updated_at: new Date()
    };

    return await db.users.update({
      where: { id },
      data: updateData,
      include: {
        roles: {
          include: {
            roles: true
          }
        },
        skills: {
          include: {
            skills: true
          }
        },
        categories: {
          include: {
            categories: true
          }
        }
      }
    });
  }

  // Delete user
  async delete(id: string) {
    // First remove user's social connections
    await Promise.all([
      db.user_roles.deleteMany({ where: { user_id: id } }),
      db.user_skills.deleteMany({ where: { user_id: id } }),
      db.user_categories.deleteMany({ where: { user_id: id } })
    ]);

    return await db.users.delete({
      where: { id }
    });
  }

  // Get user profile with relations
  async getProfile(id: string) {
    return await db.users.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            roles: true
          }
        },
        skills: {
          include: {
            skills: true
          }
        },
        categories: {
          include: {
            categories: true
          }
        },
        posts: {
          take: 5,
          orderBy: { created_at: 'desc' },
          include: {
            categories: true,
            _count: {
              select: {
                comments: true,
                likes: true
              }
            }
          }
        },
        projects: {
          take: 5,
          orderBy: { created_at: 'desc' },
          include: {
            categories: true,
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
            }
          }
        },
        _count: {
          select: {
            posts: true,
            projects: true,
            comments: true,
            likes: true,
            messages: true
          }
        }
      }
    });
  }

  // Get user's posts with pagination
  async getUserPosts(userId: string, page: number = 1, limit: number = 20) {
    return await db.posts.findMany({
      where: { author_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        categories: true,
        post_media: {
          include: {
            media: true
          }
        },
        comments: {
          take: 3,
          orderBy: { created_at: 'desc' },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatar_url: true
              }
            }
          }
        },
        _count: {
          select: {
            comments: true,
            likes: true
          }
        }
      }
    });
  }

  // Get user's projects
  async getUserProjects(userId: string, page: number = 1, limit: number = 20) {
    return await db.projects.findMany({
      where: {
        OR: [
          { owner_id: userId },
          {
            project_members: {
              some: { user_id: userId }
            }
          }
        ]
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        categories: true,
        owner: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            profile_complete_percentage: true
          }
        },
        project_members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar_url: true,
                profile_complete_percentage: true
              }
            }
          }
        }
      }
    });
  }

  // Manage user roles
  async addRole(userId: string, roleId: string) {
    return await db.user_roles.create({
      data: {
        user_id: userId,
        role_id: roleId
      },
      include: {
        roles: true,
        users: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });
  }

  async removeRole(userId: string, roleId: string) {
    const userRole = await db.user_roles.findFirst({
      where: {
        user_id: userId,
        role_id: roleId
      }
    });

    if (!userRole) {
      throw new Error('User does not have this role');
    }

    return await db.user_roles.delete({
      where: { id: userRole.id }
    });
  }

  // Manage user skills
  async addSkill(userId: string, skillId: string) {
    return await db.user_skills.create({
      data: {
        user_id: userId,
        skill_id: skillId
      },
      include: {
        skills: true,
        users: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });
  }

  async removeSkill(userId: string, skillId: string) {
    const userSkill = await db.user_skills.findFirst({
      where: {
        user_id: userId,
        skill_id: skillId
      }
    });

    if (!userSkill) {
      throw new Error('User does not have this skill');
    }

    return await db.user_skills.delete({
      where: { id: userSkill.id }
    });
  }

  // Search users
  async search(query: string, options: {
    page?: number;
    limit?: number;
    roleId?: string;
    skillId?: string;
    categoryId?: string;
    availability?: UserAvailability;
  } = {}) {
    const {
      page = 1,
      limit = 20,
      roleId,
      skillId,
      categoryId,
      availability
    } = options;

    const where: any = {
      OR: [
        { username: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { bio: { contains: query, mode: 'insensitive' } }
      ]
    };

    if (roleId) {
      where.roles = {
        some: { role_id: roleId }
      };
    }

    if (skillId) {
      where.skills = {
        some: { skill_id: skillId }
      };
    }

    if (categoryId) {
      where.categories = {
        some: { category_id: categoryId }
      };
    }

    if (availability) {
      where.availability = availability;
    }

    const [users, totalCount] = await Promise.all([
      db.users.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        include: {
          roles: {
            include: {
              roles: true
            }
          },
          skills: {
            include: {
              skills: true
            }
          },
          categories: {
            include: {
              categories: true
            }
          },
          _count: {
            select: {
              posts: true,
              projects: true,
              followers: true
            }
          }
        },
        orderBy: { profile_complete_percentage: 'desc' }
      }),
      db.users.count({ where })
    ]);

    return {
      users,
      totalCount,
      page,
      limit
    };
  }
  // Helper method to calculate profile completion percentage
  private calculateProfileCompletion(data: any): number {
    const fields = [
      'avatar_url',
      'location',
      'bio',
      'website_url',
      'github_url',
      'linkedin_url',
      'twitter_url',
      'whatsapp_url'
    ];

    const completedFields = fields.filter(field => !!data[field]).length;
    return Math.round((completedFields / fields.length) * 100);
  }
}

export default User;