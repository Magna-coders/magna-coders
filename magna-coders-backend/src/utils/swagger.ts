import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Magna Coders API Documentation',
      version,
      description: 'API documentation for Magna Coders backend services',
      contact: {
        name: 'API Support',
        email: 'support@magnacoder.com'
      },
    },
    servers: [
      {
        url: 'https://b5d1-41-89-129-11.ngrok-free.app',
        description: 'Local development server'
      },
            {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Local development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'string' } },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            limit: { type: 'integer' },
            page: { type: 'integer' },
            totalPages: { type: 'integer' }
          }
        },
        MinimalUser: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            displayName: { type: 'string' },
            avatar: { type: 'string', nullable: true }
          }
        },
        UserProfile: {
          type: 'object',
          properties: {
            bio: { type: 'string', nullable: true },
            location: { type: 'string', nullable: true },
            website: { type: 'string', nullable: true },
            social: {
              type: 'object',
              properties: {
                twitter: { type: 'string', nullable: true },
                github: { type: 'string', nullable: true },
                linkedIn: { type: 'string', nullable: true }
              }
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            displayName: { type: 'string', nullable: true },
            avatar: { type: 'string', nullable: true },
            profile: { $ref: '#/components/schemas/UserProfile' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Tag: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' }
          }
        },
        Comment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            content: { type: 'string' },
            author: { $ref: '#/components/schemas/MinimalUser' },
            parentId: { type: 'string', nullable: true },
            replies: { type: 'array', items: { $ref: '#/components/schemas/Comment' } },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Post: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            slug: { type: 'string' },
            excerpt: { type: 'string', nullable: true },
            content: { type: 'string' },
            coverImage: { type: 'string', nullable: true },
            author: { $ref: '#/components/schemas/MinimalUser' },
            category: { $ref: '#/components/schemas/Category' },
            tags: { type: 'array', items: { $ref: '#/components/schemas/Tag' } },
            comments: { type: 'array', items: { $ref: '#/components/schemas/Comment' } },
            likesCount: { type: 'integer' },
            viewsCount: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        PostInput: {
          type: 'object',
          required: ['title', 'content'],
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            excerpt: { type: 'string' },
            coverImage: { type: 'string' },
            categoryId: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            isPublished: { type: 'boolean' }
          }
        },
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            budget: { type: 'number' },
            status: { type: 'string' },
            owner: { $ref: '#/components/schemas/MinimalUser' },
            assignedTo: { $ref: '#/components/schemas/MinimalUser' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Payment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            amount: { type: 'number' },
            currency: { type: 'string' },
            method: { type: 'string' },
            status: { type: 'string' },
            fromUser: { $ref: '#/components/schemas/MinimalUser' },
            toUser: { $ref: '#/components/schemas/MinimalUser' },
            project: { $ref: '#/components/schemas/Project' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      },
      parameters: {
        PageParam: { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        LimitParam: { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        PostIdParam: { name: 'postId', in: 'path', required: true, schema: { type: 'string' } }
      },
      requestBodies: {
        PostBody: { description: 'Post creation payload', required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/PostInput' } } } },
        CommentBody: { description: 'Comment payload', required: true, content: { 'application/json': { schema: { type: 'object', required: ['content'], properties: { content: { type: 'string' }, parentId: { type: 'string', nullable: true } } } } } }
      },
      responses: {
        GenericError: { description: 'Error response', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        PaginatedPosts: { description: 'Paginated posts response', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, meta: { $ref: '#/components/schemas/PaginationMeta' }, data: { type: 'array', items: { $ref: '#/components/schemas/Post' } } } } } } },
        PostResponse: { description: 'Single post', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Post' } } } } } }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: [
    './src/routes/*.ts',
    './src/api/*.ts',
  ]
};

export const swaggerSpec = swaggerJsdoc(options);