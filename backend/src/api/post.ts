import { PrismaClient, Prisma } from '@prisma/client';
import { db } from '../utils/prismaClient';
import { PostType } from '../types/posts';

export class Post {
  private prisma: any;

  constructor() {}

  // Find post by ID
  async findById(id: string) {
    return await db.posts.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            profile_complete_percentage: true,
          }
        },
        categories: {
          include: {
            categories: true
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatar_url: true,
              }
            },
            comment_replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    username: true,
                    avatar_url: true,
                  }
                },
                _count: {
                  select: { likes: true }
                }
              }
            },
            _count: {
              select: { likes: true, comment_replies: true }
            }
          },
          orderBy: { created_at: 'asc' }
        },
        post_media: {
          include: {
            media: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          }
        }
      }
    });
  }

  // Get posts with pagination and filtering
  async findMany(options: {
    page?: number;
    limit?: number;
    sortBy?: string;
    categoryId?: string;
    authorId?: string;
  } = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'new',
      categoryId,
      authorId,
    } = options;

    let orderBy: any = { created_at: 'desc' };

    switch (sortBy) {
      case 'new':
        orderBy = { created_at: 'desc' };
        break;
      case 'old':
        orderBy = { created_at: 'asc' };
        break;
      case 'top':
        orderBy = [
          { likes_count: 'desc' },
          { created_at: 'desc' }
        ];
        break;
      case 'trending':
        orderBy = [
          { comments_count: 'desc' },
          { created_at: 'desc' }
        ];
        break;
    }

    const where: any = {};
    if (categoryId) {
      where.categories = {
        some: { category_id: categoryId }
      };
    }
    if (authorId) where.author_id = authorId;

    const totalCount = await db.posts.count({ where });

    const posts = await db.posts.findMany({
      where,
      orderBy,
      take: limit,
      skip: (page - 1) * limit,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            profile_complete_percentage: true
          }
        },
        categories: {
          include: {
            categories: true
          }
        },
        post_media: {
          include: {
            media: true
          }
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          }
        }
      }
    });

    return {
      posts: posts.map((post: any) => ({
        ...post,
        commentsCount: post._count.comments,
        likesCount: post._count.likes,
        _count: undefined,
      })),
      totalCount,
      page,
      limit,
    };
  }

  // Create new post
  async create(data: {
    title: string;
    content?: string;
    post_type: PostType;
    tags?: string[];
    author_id: string;
    category_ids?: string[];
    media_ids?: string[];
  }) {
    return await db.posts.create({
      data: {
        title: data.title,
        content: data.content,
        post_type: data.post_type,
        tags: data.tags || [],
        author_id: data.author_id,
        categories: data.category_ids ? {
          createMany: {
            data: data.category_ids.map(id => ({ category_id: id }))
          }
        } : undefined,
        post_media: data.media_ids ? {
          createMany: {
            data: data.media_ids.map(id => ({ media_id: id }))
          }
        } : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar_url: true
          }
        },
        categories: {
          include: {
            categories: true
          }
        },
        post_media: {
          include: {
            media: true
          }
        }
      }
    });
  }

  // Update post
  async update(id: string, data: {
    title?: string;
    content?: string;
    post_type?: PostType;
    tags?: string[];
    category_ids?: string[];
    media_ids?: string[];
  }) {
    const updateData: any = {
      ...data,
      updated_at: new Date(),
    };

    if (data.category_ids) {
      // First remove existing categories
      await db.post_categories.deleteMany({
        where: { post_id: id }
      });

      // Then add new ones
      updateData.categories = {
        createMany: {
          data: data.category_ids.map(id => ({ category_id: id }))
        }
      };
    }

    if (data.media_ids) {
      // First remove existing media
      await db.post_media.deleteMany({
        where: { post_id: id }
      });

      // Then add new ones
      updateData.post_media = {
        createMany: {
          data: data.media_ids.map(id => ({ media_id: id }))
        }
      };
    }

    return await db.posts.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar_url: true
          }
        },
        categories: {
          include: {
            categories: true
          }
        },
        post_media: {
          include: {
            media: true
          }
        }
      }
    });
  }

  // Delete post
  async delete(id: string) {
    // First remove post's relations
    await Promise.all([
      db.post_categories.deleteMany({ where: { post_id: id } }),
      db.post_media.deleteMany({ where: { post_id: id } }),
      db.likes.deleteMany({ where: { post_id: id } }),
      db.comments.deleteMany({ where: { post_id: id } })
    ]);

    return await db.posts.delete({
      where: { id }
    });
  }

  // Like/unlike post
  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean }> {
    const existingLike = await db.likes.findFirst({
      where: {
        user_id: userId,
        post_id: postId,
      }
    });

    if (existingLike) {
      // Unlike
      await db.likes.delete({ where: { id: existingLike.id } });
      await db.posts.update({
        where: { id: postId },
        data: { likes_count: { decrement: 1 } }
      });
      return { liked: false };
    } else {
      // Like
      await db.likes.create({
        data: {
          user_id: userId,
          post_id: postId
        }
      });
      await db.posts.update({
        where: { id: postId },
        data: { likes_count: { increment: 1 } }
      });
      return { liked: true };
    }
  }

  // Increment view count
  async incrementViews(id: string): Promise<void> {
    await db.posts.update({
      where: { id },
      data: { views_count: { increment: 1 } }
    });
  }

  // Search posts
  async search(query: string, options: {
    page?: number;
    limit?: number;
    categoryId?: string;
  } = {}) {
    const { page = 1, limit = 20, categoryId } = options;

    const where: any = {
      OR: [
        {
          title: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          content: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          tags: {
            has: query
          }
        }
      ]
    };

    if (categoryId) {
      where.categories = {
        some: { category_id: categoryId }
      };
    }

    const [posts, totalCount] = await Promise.all([
      db.posts.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar_url: true,
              profile_complete_percentage: true
            }
          },
          categories: {
            include: {
              categories: true
            }
          },
          post_media: {
            include: {
              media: true
            }
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            }
          }
        }
      }),
      db.posts.count({ where })
    ]);

    return {
      posts: posts.map((post: any) => ({
        ...post,
        commentsCount: post._count.comments,
        likesCount: post._count.likes,
        _count: undefined,
      })),
      totalCount,
      page,
      limit,
    };
  }
}

export default Post;