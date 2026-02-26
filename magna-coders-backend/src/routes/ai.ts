import express, { Router, Request, Response } from 'express';
import prisma from '../utils/db';
import {
  authenticateAI,
  authorizeUserData,
  filterSensitiveData
} from '../middleware/aiAuth';
import { aiRateLimiter } from '../middleware/aiRateLimiter';

const router: Router = express.Router();

/**
 * Audit logging helper for AI interactions
 * Logs events to ai_interactions table with user_id, session_id, event details, IP, user agent, timestamp
 */
export async function logAIInteraction(params: {
  userId: string;
  sessionId: string;
  querySummary?: string;
  toolsUsed?: any;
  responseSummary?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await (prisma as any).ai_interactions.create({
      data: {
        user_id: params.userId,
        session_id: params.sessionId,
        query_summary: params.querySummary || null,
        tools_used: params.toolsUsed || null,
        response_summary: params.responseSummary || null,
        ip_address: params.ipAddress || null,
        user_agent: params.userAgent || null
      }
    });
  } catch (error) {
    console.error('[AI Routes] Failed to log AI interaction:', error);
    // Don't throw - logging failure shouldn't break the request
  }
}

// Apply middleware chain to all AI routes
router.use(authenticateAI);
router.use(filterSensitiveData);
router.use(aiRateLimiter);

/**
 * GET /api/ai/user-context/:userId
 * Fetch user profile with name, role, skills, experience level, location, subscription tier
 * Excludes sensitive fields (password, email, payment info)
 * Returns within 500ms
 */
router.get(
  '/user-context/:userId',
  authorizeUserData,
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    const { userId } = req.params;

    try {
      // Fetch user with related data
      const user = await (prisma as any).users.findUnique({
        where: { id: userId },
        include: {
          user_skills: {
            include: {
              skills: true
            }
          },
          user_roles: {
            include: {
              roles: true
            }
          }
        }
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'User not found'
        });
        return;
      }

      // Extract skills and roles
      const skills = user.user_skills.map((us: any) => us.skills.name);
      const roles = user.user_roles.map((ur: any) => ur.roles.name);
      const primaryRole = roles[0] || 'user';

      // Determine experience level based on profile completeness and skills
      let experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' = 'beginner';
      if (skills.length >= 10) {
        experienceLevel = 'expert';
      } else if (skills.length >= 5) {
        experienceLevel = 'advanced';
      } else if (skills.length >= 2) {
        experienceLevel = 'intermediate';
      }

      // TODO: Get subscription tier from actual subscription system
      // For now, default to 'free'
      const subscriptionTier: 'free' | 'premium' | 'pro' = 'free';

      const responseTime = Date.now() - startTime;
      console.log(`[AI Routes] user-context response time: ${responseTime}ms`);

      res.status(200).json({
        success: true,
        data: {
          userId: user.id,
          name: user.username,
          role: primaryRole,
          skills: skills,
          experienceLevel: experienceLevel,
          location: user.location || 'Not specified',
          subscriptionTier: subscriptionTier
        }
      });
    } catch (error) {
      console.error('[AI Routes] Error fetching user context:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch user context'
      });
    }
  }
);

/**
 * GET /api/ai/user-skills/:userId
 * Fetch user skills with proficiency levels (0-100) and categories
 * Returns within 500ms
 */
router.get(
  '/user-skills/:userId',
  authorizeUserData,
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    const { userId } = req.params;

    try {
      const userSkills = await prisma.user_skills.findMany({
        where: { user_id: userId },
        include: {
          skills: true
        }
      });

      // Map skills with proficiency levels
      // TODO: Add proficiency tracking to database schema
      // For now, assign default proficiency based on skill count
      const skills = userSkills.map((us: any, index: number) => ({
        name: us.skills.name,
        proficiency: Math.min(50 + index * 5, 100), // Placeholder proficiency
        category: us.skills.description || 'General'
      }));

      const responseTime = Date.now() - startTime;
      console.log(`[AI Routes] user-skills response time: ${responseTime}ms`);

      res.status(200).json({
        success: true,
        data: {
          skills: skills
        }
      });
    } catch (error) {
      console.error('[AI Routes] Error fetching user skills:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch user skills'
      });
    }
  }
);

/**
 * GET /api/ai/user-learning/:userId
 * Fetch course enrollments with progress and status
 * Returns within 500ms
 */
router.get(
  '/user-learning/:userId',
  authorizeUserData,
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    const { userId } = req.params;

    try {
      // TODO: Implement course enrollment system
      // For now, return empty array as placeholder
      const enrollments: any[] = [];

      const responseTime = Date.now() - startTime;
      console.log(`[AI Routes] user-learning response time: ${responseTime}ms`);

      res.status(200).json({
        success: true,
        data: {
          enrollments: enrollments
        }
      });
    } catch (error) {
      console.error('[AI Routes] Error fetching user learning:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch user learning data'
      });
    }
  }
);

/**
 * GET /api/ai/user-projects/:userId
 * Fetch project summaries with technologies and status
 * Returns within 500ms
 */
router.get(
  '/user-projects/:userId',
  authorizeUserData,
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    const { userId } = req.params;

    try {
      const projects = await prisma.projects.findMany({
        where: { owner_id: userId },
        select: {
          id: true,
          title: true,
          description: true,
          tech_stack: true,
          status: true,
          short_description: true
        },
        take: 20 // Limit to 20 most recent projects
      });

      const projectSummaries = projects.map(project => ({
        id: project.id,
        title: project.title,
        description: project.short_description || project.description || '',
        technologies: project.tech_stack || [],
        status: project.status || 'draft'
      }));

      const responseTime = Date.now() - startTime;
      console.log(`[AI Routes] user-projects response time: ${responseTime}ms`);

      res.status(200).json({
        success: true,
        data: {
          projects: projectSummaries
        }
      });
    } catch (error) {
      console.error('[AI Routes] Error fetching user projects:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch user projects'
      });
    }
  }
);

/**
 * GET /api/ai/community-posts
 * Search public posts by query parameter with limit
 * Returns within 500ms
 */
router.get(
  '/community-posts',
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    const { query, limit = '10' } = req.query;
    const limitNum = Math.min(parseInt(limit as string, 10) || 10, 50);

    try {
      const whereClause: any = {};

      // If query provided, search in title and content
      if (query && typeof query === 'string') {
        whereClause.OR = [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } }
        ];
      }

      const posts = await (prisma as any).posts.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          content: true,
          users: {
            select: {
              username: true
            }
          },
          post_tags: {
            select: {
              tags: {
                select: {
                  name: true
                }
              }
            },
            take: 5 // Limit tags per post
          }
        },
        take: limitNum,
        orderBy: {
          created_at: 'desc'
        }
      });

      const postSummaries = posts.map((post: any) => ({
        id: post.id,
        title: post.title,
        excerpt: post.content ? post.content.substring(0, 200) + '...' : '',
        author: post.users.username,
        tags: post.post_tags.map((pt: any) => pt.tags.name)
      }));

      const responseTime = Date.now() - startTime;
      console.log(`[AI Routes] community-posts response time: ${responseTime}ms`);

      res.status(200).json({
        success: true,
        data: {
          posts: postSummaries
        }
      });
    } catch (error) {
      console.error('[AI Routes] Error fetching community posts:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch community posts'
      });
    }
  }
);

/**
 * GET /api/ai/job-matches/:userId
 * Fetch job matches with match scores and required skills
 * Returns within 500ms
 */
router.get(
  '/job-matches/:userId',
  authorizeUserData,
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    const { userId } = req.params;

    try {
      // Fetch user skills for matching
      const userSkills = await prisma.user_skills.findMany({
        where: { user_id: userId },
        include: {
          skills: true
        }
      });

      const userSkillNames = userSkills.map((us: any) => us.skills.name.toLowerCase());

      // Fetch opportunities
      const opportunities = await prisma.opportunities.findMany({
        select: {
          id: true,
          title: true,
          company: true,
          description: true,
          job_type: true,
          location: true
        },
        take: 50 // Get more to filter and rank
      });

      // Calculate match scores based on skill overlap
      const matches = opportunities.map(opp => {
        // Extract skills from description (simple keyword matching)
        const description = (opp.description || '').toLowerCase();
        const matchedSkills = userSkillNames.filter(skill =>
          description.includes(skill)
        );

        const matchScore = userSkillNames.length > 0
          ? Math.round((matchedSkills.length / userSkillNames.length) * 100)
          : 0;

        return {
          jobId: opp.id,
          title: opp.title,
          company: opp.company || 'Unknown',
          matchScore: matchScore,
          requiredSkills: matchedSkills
        };
      })
        .filter(match => match.matchScore > 0) // Only include matches
        .sort((a, b) => b.matchScore - a.matchScore) // Sort by match score
        .slice(0, 10); // Top 10 matches

      const responseTime = Date.now() - startTime;
      console.log(`[AI Routes] job-matches response time: ${responseTime}ms`);

      res.status(200).json({
        success: true,
        data: {
          matches: matches
        }
      });
    } catch (error) {
      console.error('[AI Routes] Error fetching job matches:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch job matches'
      });
    }
  }
);

export default router;
