import { Request, Response } from 'express';
import { db } from '../../utils/prismaClient';

const getComments = async (req: Request, res: Response): Promise<void> => {
  const { postId } = req.params;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const post = await db.posts.findUnique({ where: { id: postId } });
  if (!post) {
    res.status(404).send({ message: 'Post not found.' });
    return;
  }

  const comments = await db.comments.findMany({
    where: { post_id: postId },
    orderBy: { created_at: 'asc' },
    take: limit,
    skip: (page - 1) * limit,
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatar_url: true,
          profile_complete_percentage: true,
        }
      },
      comment_replies: {
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar_url: true,
              profile_complete_percentage: true
            }
          },
          _count: {
            select: { likes: true }
          }
        },
        orderBy: { created_at: 'asc' }
      },
      _count: {
        select: { likes: true, comment_replies: true }
      }
    }
  });

  const commentsWithCounts = comments.map((comment: any) => ({
    ...comment,
    likesCount: comment._count.likes,
    repliesCount: comment._count.comment_replies,
    _count: undefined,
  }));

  res.status(200).json(commentsWithCounts);
};

const createComment = async (req: Request, res: Response): Promise<void> => {
  const { postId } = req.params;
  const userId = req.user as string;
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    res.status(400).send({ message: 'Comment content is required.' });
    return;
  }

  const post = await db.posts.findUnique({ where: { id: postId } });
  if (!post) {
    res.status(404).send({ message: 'Post not found.' });
    return;
  }

  const author = await db.users.findUnique({ where: { id: userId } });
  if (!author) {
    res.status(404).send({ message: 'User not found.' });
    return;
  }

  const comment = await db.comments.create({
    data: {
      content: content.trim(),
      post_id: postId,
      author_id: userId
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatar_url: true,
          profile_complete_percentage: true
        }
      }
    }
  });

  // Update post comment count
  await db.posts.update({
    where: { id: postId },
    data: { comments_count: { increment: 1 } }
  });

  res.status(201).json(comment);
};

const updateComment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user as string;
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    res.status(400).send({ message: 'Comment content is required.' });
    return;
  }

  const comment = await db.comments.findUnique({
    where: { id },
    include: { author: true }
  });

  if (!comment) {
    res.status(404).send({ message: 'Comment not found.' });
    return;
  }

  if (comment.author_id !== userId) {
    res.status(403).send({ message: 'Access denied.' });
    return;
  }

  const updatedComment = await db.comments.update({
    where: { id },
    data: {
      content: content.trim(),
      is_edited: true,
      updated_at: new Date(),
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatar_url: true,
          profile_complete_percentage: true
        }
      }
    }
  });

  res.status(200).json(updatedComment);
};

const deleteComment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user as string;

  const comment = await db.comments.findUnique({
    where: { id },
    include: { author: true }
  });

  if (!comment) {
    res.status(404).send({ message: 'Comment not found.' });
    return;
  }

  if (comment.author_id !== userId) {
    res.status(403).send({ message: 'Not authorized to delete this comment.' });
    return;
  }

  // Delete the comment - this will cascade delete replies and likes due to the schema configuration
  await db.comments.delete({ where: { id } });

  res.status(200).json({ message: 'Comment deleted successfully.' });
};

const deleteReply = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user as string;

  const reply = await db.comment_replies.findUnique({
    where: { id },
    include: { author: true, comment: true }
  });

  if (!reply) {
    res.status(404).send({ message: 'Reply not found.' });
    return;
  }

  if (reply.author_id !== userId) {
    res.status(403).send({ message: 'Not authorized to delete this reply.' });
    return;
  }

  // Delete the reply - this will cascade delete likes due to the schema configuration
  await db.comment_replies.delete({ where: { id } });

  // Update comment reply count
  await db.comments.update({
    where: { id: reply.comment_id },
    data: { comment_replies_count: { decrement: 1 } }
  });

  res.status(200).json({ message: 'Reply deleted successfully.' });
};

const createReply = async (req: Request, res: Response): Promise<void> => {
  const { commentId } = req.params;
  const userId = req.user as string;
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    res.status(400).send({ message: 'Reply content is required.' });
    return;
  }

  const comment = await db.comments.findUnique({ where: { id: commentId } });
  if (!comment) {
    res.status(404).send({ message: 'Comment not found.' });
    return;
  }

  const author = await db.users.findUnique({ where: { id: userId } });
  if (!author) {
    res.status(404).send({ message: 'User not found.' });
    return;
  }

  const reply = await db.comment_replies.create({
    data: {
      content: content.trim(),
      comment_id: commentId,
      author_id: userId
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatar_url: true,
          profile_complete_percentage: true
        }
      }
    }
  });

  // Update comment reply count
  await db.comments.update({
    where: { id: commentId },
    data: { comment_replies_count: { increment: 1 } }
  });

  res.status(201).json(reply);
};

const likeComment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user as string;

  const comment = await db.comments.findUnique({ where: { id } });
  if (!comment) {
    res.status(404).send({ message: 'Comment not found.' });
    return;
  }

  const existingLike = await db.likes.findFirst({
    where: {
      user_id: userId,
      comment_id: id,
    }
  });

  if (existingLike) {
    // Unlike
    await db.likes.delete({ where: { id: existingLike.id } });
    await db.comments.update({
      where: { id },
      data: { likes_count: { decrement: 1 } }
    });
    res.status(200).json({ liked: false });
  } else {
    // Like
    await db.likes.create({
      data: {
        user_id: userId,
        comment_id: id
      }
    });
    await db.comments.update({
      where: { id },
      data: { likes_count: { increment: 1 } }
    });
    res.status(200).json({ liked: true });
  }
};

const likeReply = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user as string;

  const reply = await db.comment_replies.findUnique({ where: { id } });
  if (!reply) {
    res.status(404).send({ message: 'Reply not found.' });
    return;
  }

  const existingLike = await db.likes.findFirst({
    where: {
      user_id: userId,
      reply_id: id,
    }
  });

  if (existingLike) {
    // Unlike
    await db.likes.delete({ where: { id: existingLike.id } });
    await db.comment_replies.update({
      where: { id },
      data: { likes_count: { decrement: 1 } }
    });
    res.status(200).json({ liked: false });
  } else {
    // Like
    await db.likes.create({
      data: {
        user_id: userId,
        reply_id: id
      }
    });
    await db.comment_replies.update({
      where: { id },
      data: { likes_count: { increment: 1 } }
    });
    res.status(200).json({ liked: true });
  }
};

export {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  createReply,
  likeComment,
  likeReply,
};