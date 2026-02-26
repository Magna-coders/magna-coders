import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

/**
 * Get all comments for a post with pagination and nested replies
 */
const getComments = async (req: Request, res: Response): Promise<void> => {
	const { id: postId } = req.params;
	const page = Math.max(Number(req.query.page || 1), 1);
	const limit = Math.max(Number(req.query.limit || 10), 1);
	const skip = (page - 1) * limit;

	const comments = await prisma.comments.findMany({
		where: { post_id: postId, parent_id: null },
		skip,
		take: limit,
		orderBy: { created_at: 'desc' },
		include: {
			users: {
				select: { id: true, username: true, avatar_url: true }
			},
			replies: {
				orderBy: { created_at: 'asc' },
				include: {
					users: {
						select: { id: true, username: true, avatar_url: true }
					}
				}
			}
		}
	});

	const total = await prisma.comments.count({
		where: { post_id: postId, parent_id: null }
	});

	const totalPages = Math.ceil(total / limit);

	res.status(200).json({
		comments: comments.map(c => ({
			...c,
			author: c.users, // Map users to author for frontend compatibility
			replies: c.replies?.map(r => ({
				...r,
				author: r.users
			}))
		})),
		totalPages,
		currentPage: page,
		total
	});
};

/**
 * Get a single comment by ID
 */
const getCommentById = async (req: Request, res: Response): Promise<void> => {
	const { commentId } = req.params;

	const comment = await prisma.comments.findUnique({
		where: { id: commentId },
		include: {
			users: {
				select: { id: true, username: true, avatar_url: true }
			},
			replies: {
				orderBy: { created_at: 'asc' },
				include: {
					users: {
						select: { id: true, username: true, avatar_url: true }
					}
				}
			}
		}
	});

	if (!comment) {
		res.status(404).json({ message: 'Comment not found' });
		return;
	}

	res.status(200).json({
		...comment,
		author: comment.users,
		replies: comment.replies?.map(r => ({
			...r,
			author: r.users
		}))
	});
};

/**
 * Create a new comment on a post or reply to a comment
 */
const createComment = async (req: Request, res: Response): Promise<void> => {
	const { id: postId } = req.params;
	const userId = req.user;
	const { content, parentId } = req.body;

	if (!userId || !postId) {
		res.status(401).json({ message: 'Authentication required' });
		return;
	}

	if (!content || typeof content !== 'string' || content.trim().length === 0) {
		res.status(400).json({ message: 'Comment content is required' });
		return;
	}

	// Verify post exists
	const post = await prisma.posts.findUnique({ where: { id: postId } });
	if (!post) {
		res.status(404).json({ message: 'Post not found' });
		return;
	}

	// If parentId provided, verify parent comment exists
	if (parentId) {
		const parentComment = await prisma.comments.findUnique({
			where: { id: parentId }
		});
		if (!parentComment || parentComment.post_id !== postId) {
			res.status(400).json({ message: 'Invalid parent comment' });
			return;
		}
	}

	const comment = await prisma.comments.create({
		data: {
			id: uuidv4(),
			content: content.trim(),
			post_id: postId as string,
			author_id: userId,
			parent_id: parentId || null
		},
		include: {
			users: {
				select: { id: true, username: true, avatar_url: true }
			}
		}
	});

	res.status(201).json({
		...comment,
		author: comment.users
	});
};

/**
 * Update a comment
 */
const updateComment = async (req: Request, res: Response): Promise<void> => {
	const { commentId } = req.params;
	const userId = req.user;
	const { content } = req.body;

	if (!userId) {
		res.status(401).json({ message: 'Authentication required' });
		return;
	}

	if (!content || typeof content !== 'string' || content.trim().length === 0) {
		res.status(400).json({ message: 'Comment content is required' });
		return;
	}

	const comment = await prisma.comments.findUnique({
		where: { id: commentId }
	});

	if (!comment) {
		res.status(404).json({ message: 'Comment not found' });
		return;
	}

	if (comment.author_id !== userId) {
		res.status(403).json({ message: 'Access denied' });
		return;
	}

	const updated = await prisma.comments.update({
		where: { id: commentId },
		data: { content: content.trim() },
		include: {
			users: {
				select: { id: true, username: true, avatar_url: true }
			}
		}
	});

	res.status(200).json({
		...updated,
		author: updated.users
	});
};

/**
 * Delete a comment
 */
const deleteComment = async (req: Request, res: Response): Promise<void> => {
	const { commentId } = req.params;
	const userId = req.user;

	if (!userId) {
		res.status(401).json({ message: 'Authentication required' });
		return;
	}

	const comment = await prisma.comments.findUnique({
		where: { id: commentId }
	});

	if (!comment) {
		res.status(404).json({ message: 'Comment not found' });
		return;
	}

	if (comment.author_id !== userId) {
		res.status(403).json({ message: 'Access denied' });
		return;
	}

	// Delete all replies first
	await prisma.comments.deleteMany({
		where: { parent_id: commentId }
	});

	// Delete the comment
	await prisma.comments.delete({
		where: { id: commentId }
	});

	res.status(200).json({ message: 'Comment deleted successfully' });
};

export { getComments, getCommentById, createComment, updateComment, deleteComment };

// Toggle like on a comment
const likeComment = async (req: Request, res: Response): Promise<void> => {
	const { id: commentId } = req.params;
	const userId = req.user as string;

	if (!userId) {
		res.status(401).json({ message: 'Authentication required' });
		return;
	}

	const comment = await prisma.comments.findUnique({ where: { id: commentId } });
	if (!comment) {
		res.status(404).json({ message: 'Comment not found' });
		return;
	}

	const existing = await prisma.likes.findFirst({ where: { comment_id: commentId, user_id: userId } });
	if (existing) {
		await prisma.likes.delete({ where: { id: existing.id } });
		const likesCount = await prisma.likes.count({ where: { comment_id: commentId } });
		res.status(200).json({ liked: false, likesCount });
		return;
	}

	await prisma.likes.create({ data: { id: uuidv4(), comment_id: commentId, user_id: userId } });
	const likesCount = await prisma.likes.count({ where: { comment_id: commentId } });
	res.status(200).json({ liked: true, likesCount });
};

// For replies we can reuse the same toggle by id
const likeReply = likeComment;

export { likeComment, likeReply };
