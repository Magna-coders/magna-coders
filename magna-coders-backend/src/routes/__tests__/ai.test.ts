import request from 'supertest';
import express, { Express } from 'express';
import aiRoutes from '../ai';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    users: {
      findUnique: jest.fn(),
    },
    user_skills: {
      findMany: jest.fn(),
    },
    projects: {
      findMany: jest.fn(),
    },
    opportunities: {
      findMany: jest.fn(),
    },
    ai_interactions: {
      create: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

describe('AI Routes Integration Tests', () => {
  let app: Express;
  let prisma: any;
  const validApiKey = 'test-api-key-at-least-32-characters-long';
  const testUserId = 'test-user-123';

  beforeAll(() => {
    // Set environment variables
    process.env.AI_API_KEY = validApiKey;
    process.env.NODE_ENV = 'test';

    // Create Express app with AI routes
    app = express();
    app.use(express.json());
    
    // Mock req.user for authorization tests
    app.use((req, res, next) => {
      // Extract user ID from test header for authorization
      const userId = req.headers['x-test-user-id'] as string;
      if (userId) {
        req.user = userId;
      }
      next();
    });
    
    app.use('/api/ai', aiRoutes);

    // Get mocked Prisma instance
    prisma = new PrismaClient();
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Authentication Tests', () => {
    it('should reject requests without API key (401)', async () => {
      const response = await request(app)
        .get(`/api/ai/user-context/${testUserId}`)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Unauthorized',
        message: 'API key required',
      });
    });

    it('should reject requests with invalid API key (401)', async () => {
      const response = await request(app)
        .get(`/api/ai/user-context/${testUserId}`)
        .set('X-API-Key', 'invalid-key')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid API key',
      });
    });

    it('should accept requests with valid API key', async () => {
      // Mock user data
      prisma.users.findUnique.mockResolvedValue({
        id: testUserId,
        username: 'testuser',
        location: 'Test City',
        user_skills: [],
        user_roles: [{ roles: { name: 'developer' } }],
      });

      const response = await request(app)
        .get(`/api/ai/user-context/${testUserId}`)
        .set('X-API-Key', validApiKey)
        .set('X-Test-User-Id', testUserId)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Authorization Tests', () => {
    it('should reject access to other user data (403)', async () => {
      const otherUserId = 'other-user-456';

      const response = await request(app)
        .get(`/api/ai/user-context/${otherUserId}`)
        .set('X-API-Key', validApiKey)
        .set('X-Test-User-Id', testUserId)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Forbidden',
        message: 'Access denied to requested resource',
      });

      // Verify audit log was created
      expect(prisma.ai_interactions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user_id: testUserId,
            session_id: 'unauthorized_attempt',
            query_summary: expect.stringContaining(otherUserId),
          }),
        })
      );
    });

    it('should allow access to own user data', async () => {
      prisma.users.findUnique.mockResolvedValue({
        id: testUserId,
        username: 'testuser',
        location: 'Test City',
        user_skills: [],
        user_roles: [{ roles: { name: 'developer' } }],
      });

      const response = await request(app)
        .get(`/api/ai/user-context/${testUserId}`)
        .set('X-API-Key', validApiKey)
        .set('X-Test-User-Id', testUserId)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(testUserId);
    });
  });

  describe('GET /api/ai/user-context/:userId', () => {
    it('should return user context with all required fields', async () => {
      const mockUser = {
        id: testUserId,
        username: 'John Doe',
        location: 'San Francisco',
        user_skills: [
          { skills: { name: 'JavaScript' } },
          { skills: { name: 'TypeScript' } },
          { skills: { name: 'React' } },
        ],
        user_roles: [{ roles: { name: 'developer' } }],
      };

      prisma.users.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .get(`/api/ai/user-context/${testUserId}`)
        .set('X-API-Key', validApiKey)
        .set('X-Test-User-Id', testUserId)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          userId: testUserId,
          name: 'John Doe',
          role: 'developer',
          skills: ['JavaScript', 'TypeScript', 'React'],
          experienceLevel: 'intermediate',
          location: 'San Francisco',
          subscriptionTier: 'free',
        },
      });
    });

    it('should determine experience level based on skill count', async () => {
      const mockUserExpert = {
        id: testUserId,
        username: 'Expert User',
        location: 'NYC',
        user_skills: Array(12).fill({ skills: { name: 'Skill' } }),
        user_roles: [{ roles: { name: 'developer' } }],
      };

      prisma.users.findUnique.mockResolvedValue(mockUserExpert);

      const response = await request(app)
        .get(`/api/ai/user-context/${testUserId}`)
        .set('X-API-Key', validApiKey)
        .set('X-Test-User-Id', testUserId)
        .expect(200);

      expect(response.body.data.experienceLevel).toBe('expert');
    });

    it('should return 404 for non-existent user', async () => {
      prisma.users.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/ai/user-context/${testUserId}`)
        .set('X-API-Key', validApiKey)
        .set('X-Test-User-Id', testUserId)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Not Found',
        message: 'User not found',
      });
    });

    it('should filter sensitive data from response', async () => {
      const mockUserWithSensitiveData = {
        id: testUserId,
        username: 'testuser',
        email: 'test@example.com', // Should be filtered
        password_hash: 'hashed_password', // Should be filtered
        location: 'Test City',
        user_skills: [],
        user_roles: [{ roles: { name: 'developer' } }],
      };

      prisma.users.findUnique.mockResolvedValue(mockUserWithSensitiveData);

      const response = await request(app)
        .get(`/api/ai/user-context/${testUserId}`)
        .set('X-API-Key', validApiKey)
        .set('X-Test-User-Id', testUserId)
        .expect(200);

      // Verify sensitive fields are not in response
      const responseString = JSON.stringify(response.body);
      expect(responseString).not.toContain('test@example.com');
      expect(responseString).not.toContain('hashed_password');
      expect(responseString).not.toContain('password');
    });
  });

  describe('GET /api/ai/user-skills/:userId', () => {
    it('should return user skills with proficiency levels', async () => {
      const mockSkills = [
        { skills: { name: 'JavaScript', description: 'Programming' } },
        { skills: { name: 'Python', description: 'Programming' } },
        { skills: { name: 'Docker', description: 'DevOps' } },
      ];

      prisma.user_skills.findMany.mockResolvedValue(mockSkills);

      const response = await request(app)
        .get(`/api/ai/user-skills/${testUserId}`)
        .set('X-API-Key', validApiKey)
        .set('X-Test-User-Id', testUserId)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          skills: expect.arrayContaining([
            expect.objectContaining({
              name: 'JavaScript',
              proficiency: expect.any(Number),
              category: 'Programming',
            }),
          ]),
        },
      });

      expect(response.body.data.skills).toHaveLength(3);
    });

    it('should return empty array for user with no skills', async () => {
      prisma.user_skills.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get(`/api/ai/user-skills/${testUserId}`)
        .set('X-API-Key', validApiKey)
        .set('X-Test-User-Id', testUserId)
        .expect(200);

      expect(response.body.data.skills).toEqual([]);
    });
  });

  describe('GET /api/ai/user-learning/:userId', () => {
    it('should return user learning data', async () => {
      const response = await request(app)
        .get(`/api/ai/user-learning/${testUserId}`)
        .set('X-API-Key', validApiKey)
        .set('X-Test-User-Id', testUserId)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          enrollments: expect.any(Array),
        },
      });
    });
  });

  describe('GET /api/ai/user-projects/:userId', () => {
    it('should return user projects with required fields', async () => {
      const mockProjects = [
        {
          id: 'proj-1',
          title: 'E-commerce Platform',
          description: 'Full description',
          short_description: 'Short desc',
          tech_stack: ['React', 'Node.js', 'PostgreSQL'],
          status: 'in-progress',
        },
        {
          id: 'proj-2',
          title: 'Mobile App',
          description: 'Mobile app description',
          short_description: null,
          tech_stack: ['React Native', 'Firebase'],
          status: 'completed',
        },
      ];

      prisma.projects.findMany.mockResolvedValue(mockProjects);

      const response = await request(app)
        .get(`/api/ai/user-projects/${testUserId}`)
        .set('X-API-Key', validApiKey)
        .set('X-Test-User-Id', testUserId)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          projects: [
            {
              id: 'proj-1',
              title: 'E-commerce Platform',
              description: 'Short desc',
              technologies: ['React', 'Node.js', 'PostgreSQL'],
              status: 'in-progress',
            },
            {
              id: 'proj-2',
              title: 'Mobile App',
              description: 'Mobile app description',
              technologies: ['React Native', 'Firebase'],
              status: 'completed',
            },
          ],
        },
      });
    });

    it('should limit projects to 20', async () => {
      const mockProjects = Array(30)
        .fill(null)
        .map((_, i) => ({
          id: `proj-${i}`,
          title: `Project ${i}`,
          description: `Description ${i}`,
          tech_stack: ['Tech'],
          status: 'draft',
        }));

      prisma.projects.findMany.mockResolvedValue(mockProjects.slice(0, 20));

      const response = await request(app)
        .get(`/api/ai/user-projects/${testUserId}`)
        .set('X-API-Key', validApiKey)
        .set('X-Test-User-Id', testUserId)
        .expect(200);

      expect(response.body.data.projects.length).toBeLessThanOrEqual(20);
    });
  });

  describe('GET /api/ai/community-posts', () => {
    it('should search posts by query parameter', async () => {
      const mockPosts = [
        {
          id: 'post-1',
          title: 'React Best Practices',
          content: 'Content about React best practices...',
          users: { username: 'john_doe' },
          post_tags: [{ tags: { name: 'react' } }, { tags: { name: 'javascript' } }],
          created_at: new Date(),
        },
      ];

      (prisma as any).posts = {
        findMany: jest.fn().mockResolvedValue(mockPosts),
      };

      const response = await request(app)
        .get('/api/ai/community-posts?query=React&limit=10')
        .set('X-API-Key', validApiKey)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          posts: [
            {
              id: 'post-1',
              title: 'React Best Practices',
              excerpt: expect.stringContaining('Content about React'),
              author: 'john_doe',
              tags: ['react', 'javascript'],
            },
          ],
        },
      });
    });

    it('should respect limit parameter', async () => {
      const mockPosts = Array(20)
        .fill(null)
        .map((_, i) => ({
          id: `post-${i}`,
          title: `Post ${i}`,
          content: `Content ${i}`,
          users: { username: 'user' },
          post_tags: [],
          created_at: new Date(),
        }));

      (prisma as any).posts = {
        findMany: jest.fn().mockResolvedValue(mockPosts.slice(0, 5)),
      };

      const response = await request(app)
        .get('/api/ai/community-posts?limit=5')
        .set('X-API-Key', validApiKey)
        .expect(200);

      expect(response.body.data.posts.length).toBeLessThanOrEqual(5);
    });

    it('should cap limit at 50', async () => {
      (prisma as any).posts = {
        findMany: jest.fn().mockResolvedValue([]),
      };

      await request(app)
        .get('/api/ai/community-posts?limit=100')
        .set('X-API-Key', validApiKey)
        .expect(200);

      // Verify findMany was called with take: 50 (max)
      expect((prisma as any).posts.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      );
    });
  });

  describe('GET /api/ai/job-matches/:userId', () => {
    it('should return job matches with match scores', async () => {
      const mockUserSkills = [
        { skills: { name: 'JavaScript' } },
        { skills: { name: 'React' } },
        { skills: { name: 'Node.js' } },
      ];

      const mockOpportunities = [
        {
          id: 'job-1',
          title: 'Frontend Developer',
          company: 'Tech Corp',
          description: 'Looking for JavaScript and React developer',
          job_type: 'full-time',
          location: 'Remote',
        },
        {
          id: 'job-2',
          title: 'Backend Developer',
          company: 'Dev Inc',
          description: 'Node.js backend developer needed',
          job_type: 'contract',
          location: 'NYC',
        },
      ];

      prisma.user_skills.findMany.mockResolvedValue(mockUserSkills);
      prisma.opportunities.findMany.mockResolvedValue(mockOpportunities);

      const response = await request(app)
        .get(`/api/ai/job-matches/${testUserId}`)
        .set('X-API-Key', validApiKey)
        .set('X-Test-User-Id', testUserId)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          matches: expect.arrayContaining([
            expect.objectContaining({
              jobId: expect.any(String),
              title: expect.any(String),
              company: expect.any(String),
              matchScore: expect.any(Number),
              requiredSkills: expect.any(Array),
            }),
          ]),
        },
      });

      // Verify match scores are between 0-100
      response.body.data.matches.forEach((match: any) => {
        expect(match.matchScore).toBeGreaterThanOrEqual(0);
        expect(match.matchScore).toBeLessThanOrEqual(100);
      });
    });

    it('should return top 10 matches sorted by score', async () => {
      const mockUserSkills = [{ skills: { name: 'JavaScript' } }];
      const mockOpportunities = Array(15)
        .fill(null)
        .map((_, i) => ({
          id: `job-${i}`,
          title: `Job ${i}`,
          company: 'Company',
          description: i % 2 === 0 ? 'JavaScript developer' : 'Other skills',
          job_type: 'full-time',
          location: 'Remote',
        }));

      prisma.user_skills.findMany.mockResolvedValue(mockUserSkills);
      prisma.opportunities.findMany.mockResolvedValue(mockOpportunities);

      const response = await request(app)
        .get(`/api/ai/job-matches/${testUserId}`)
        .set('X-API-Key', validApiKey)
        .set('X-Test-User-Id', testUserId)
        .expect(200);

      expect(response.body.data.matches.length).toBeLessThanOrEqual(10);

      // Verify matches are sorted by score (descending)
      const scores = response.body.data.matches.map((m: any) => m.matchScore);
      const sortedScores = [...scores].sort((a, b) => b - a);
      expect(scores).toEqual(sortedScores);
    });
  });

  describe('Response Time Tests', () => {
    it('should respond within 500ms for user-context endpoint', async () => {
      prisma.users.findUnique.mockResolvedValue({
        id: testUserId,
        username: 'testuser',
        location: 'Test City',
        user_skills: [],
        user_roles: [{ roles: { name: 'developer' } }],
      });

      const startTime = Date.now();

      await request(app)
        .get(`/api/ai/user-context/${testUserId}`)
        .set('X-API-Key', validApiKey)
        .set('X-Test-User-Id', testUserId)
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(500);
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle database errors gracefully', async () => {
      prisma.users.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get(`/api/ai/user-context/${testUserId}`)
        .set('X-API-Key', validApiKey)
        .set('X-Test-User-Id', testUserId)
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch user context',
      });
    });

    it('should return 401 when authentication required but not provided', async () => {
      const response = await request(app)
        .get(`/api/ai/user-context/${testUserId}`)
        .set('X-API-Key', validApiKey)
        // No X-Test-User-Id header
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    });
  });
});
