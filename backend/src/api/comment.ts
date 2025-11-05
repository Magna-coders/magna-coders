import { prisma, db } from '../utils/prismaClient';

export class Comment {
  private prisma: any;

  constructor() {
    this.prisma = prisma;
  }

  // Find comment by ID
  async findById(id: string) {
    return await this.prisma.comment.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
            isVerified: true,
            verificationBadge: true,
          }
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatar: true,
                isVerified: true,
              }
            },
            _count: {
              select: { likes: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: { likes: true, replies: true }
        }
      }
    });
  }

  // Get comments for a post
  async findByPostId(postId: string, options: {
    page?: number;
    limit?: number;
  } = {}) {
    const { page = 1, limit = 20 } = options;

    const comments = await this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
            isVerified: true,
            verificationBadge: true,
          }
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatar: true,
                isVerified: true,
              }
            },
            _count: {
              select: { likes: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: { likes: true, replies: true }
        }
      }
    });

    return comments.map((comment: any) => ({
      ...comment,
      likesCount: comment._count.likes,
      repliesCount: comment._count.replies,
      _count: undefined,
    }));
  }

  // Create new comment
  async create(data: {
    content: string;
    postId: string;
    authorId: string;
  }): Promise<any> {
    const comment = await this.prisma.comment.create({
      data: {
        content: data.content,
        postId: data.postId,
        authorId: data.authorId,
      }
    });

    // Increment post comment count
    await this.prisma.post.update({
      where: { id: data.postId },
      data: { commentsCount: { increment: 1 } }
    });

    return comment;
  }

  // Update comment
  async update(id: string, content: string, authorId: string): Promise<any> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: { author: true }
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.authorId !== authorId) {
      throw new Error('Access denied');
    }

    return await this.prisma.comment.update({
      where: { id },
      data: {
        content,
        isEdited: true,
        updatedAt: new Date(),
      }
    });
  }

  // Delete comment
  async delete(id: string, authorId: string): Promise<void> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: { author: true, post: true }
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.authorId !== authorId) {
      throw new Error('Access denied');
    }

    await this.prisma.comment.delete({ where: { id } });

    // Decrement post comment count
    await this.prisma.post.update({
      where: { id: comment.postId },
      data: { commentsCount: { decrement: 1 } }
    });
  }

  // Like/unlike comment
  async toggleLike(commentId: string, userId: string): Promise<{ liked: boolean }> {
    const existingLike = await this.prisma.like.findFirst({
      where: {
        userId,
        commentId,
      }
    });

    if (existingLike) {
      // Unlike
      await this.prisma.like.delete({ where: { id: existingLike.id } });
      await this.prisma.comment.update({
        where: { id: commentId },
        data: { likesCount: { decrement: 1 } }
      });
      return { liked: false };
    } else {
      // Like
      await this.prisma.like.create({
        data: {
          user: { connect: { id: userId } },
          comment: { connect: { id: commentId } },
        }
      });
      await this.prisma.comment.update({
        where: { id: commentId },
        data: { likesCount: { increment: 1 } }
      });
      return { liked: true };
    }
  }

  // Create reply to comment
  async createReply(data: {
    content: string;
    commentId: string;
    authorId: string;
  }) {
    const reply = await this.prisma.reply.create({
      data: {
        content: data.content,
        commentId: data.commentId,
        authorId: data.authorId,
      }
    });

    // Increment comment reply count
    await this.prisma.comment.update({
      where: { id: data.commentId },
      data: { repliesCount: { increment: 1 } }
    });

    return reply;
  }

  // Update reply
  async updateReply(id: string, content: string, authorId: string) {
    const reply = await this.prisma.reply.findUnique({
      where: { id },
      include: { author: true }
    });

    if (!reply) {
      throw new Error('Reply not found');
    }

    if (reply.authorId !== authorId) {
      throw new Error('Access denied');
    }

    return await this.prisma.reply.update({
      where: { id },
      data: {
        content,
        isEdited: true,
        updatedAt: new Date(),
      }
    });
  }

  // Delete reply
  async deleteReply(id: string, authorId: string): Promise<void> {
    const reply = await this.prisma.reply.findUnique({
      where: { id },
      include: { author: true, comment: true }
    });

    if (!reply) {
      throw new Error('Reply not found');
    }

    if (reply.authorId !== authorId) {
      throw new Error('Access denied');
    }

    await this.prisma.reply.delete({ where: { id } });

    // Decrement comment reply count
    await this.prisma.comment.update({
      where: { id: reply.commentId },
      data: { repliesCount: { decrement: 1 } }
    });
  }

  // Like/unlike reply
  async toggleReplyLike(replyId: string, userId: string): Promise<{ liked: boolean }> {
    const existingLike = await this.prisma.like.findFirst({
      where: {
        userId,
        replyId,
      }
    });

    if (existingLike) {
      // Unlike
      await this.prisma.like.delete({ where: { id: existingLike.id } });
      await this.prisma.reply.update({
        where: { id: replyId },
        data: { likesCount: { decrement: 1 } }
      });
      return { liked: false };
    } else {
      // Like
      await this.prisma.like.create({
        data: {
          user: { connect: { id: userId } },
          reply: { connect: { id: replyId } },
        }
      });
      await this.prisma.reply.update({
        where: { id: replyId },
        data: { likesCount: { increment: 1 } }
      });
      return { liked: true };
    }
  }
}

export default Comment;