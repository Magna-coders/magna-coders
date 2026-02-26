import express, { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import {
	getComments,
	createComment,
	updateComment,
	deleteComment,
	getCommentById,
	likeComment,
	likeReply
} from '../controllers/comments';

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       required:
 *         - content
 *         - authorId
 *         - postId
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the comment
 *         content:
 *           type: string
 *           description: Comment content
 *         authorId:
 *           type: string
 *           description: ID of the user who created the comment
 *         postId:
 *           type: string
 *           description: ID of the post this comment belongs to
 *         parentId:
 *           type: string
 *           description: ID of the parent comment (for replies)
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         likes:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs who liked the comment
 *     Reply:
 *       allOf:
 *         - $ref: '#/components/schemas/Comment'
 *         - type: object
 *           required:
 *             - parentId
 */

const router: Router = express.Router();

/**
 * @swagger
 * /api/comments/post/{postId}:
 *   get:
 *     summary: Get all comments for a post
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: string
 *         required: true
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.get('/post/:id', asyncHandler(getComments));

/**
 * @swagger
 * /api/comments/post/{postId}:
 *   post:
 *     summary: Create a new comment on a post
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: string
 *         required: true
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.post('/post/:id', authenticateToken, asyncHandler(createComment));

/**
 * @swagger
 * /api/comments/{id}:
 *   put:
 *     summary: Update a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authenticateToken, asyncHandler(updateComment));

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticateToken, asyncHandler(deleteComment));

/**
 * @swagger
 * /api/comments/{commentId}/reply:
 *   post:
 *     summary: Create a reply to a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         schema:
 *           type: string
 *         required: true
 *         description: Parent comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reply created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reply'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Parent comment not found
 *       500:
 *         description: Server error
 */
// createReply: delegate to createComment by resolving parent comment -> post id
const createReply = async (req: any, res: any) => {
	const { commentId } = req.params;
	// find parent comment to get post id
	try {
	} catch (e) {
		// ignore
	}
	// lookup parent via Prisma directly
	const { PrismaClient } = await import('@prisma/client');
	const p = new PrismaClient();
	const parentComment = await p.comments.findUnique({ where: { id: commentId } });
	await p.$disconnect();
	if (!parentComment) {
		res.status(404).json({ message: 'Parent comment not found' });
		return;
	}
	// set post id param expected by createComment (it expects req.params.id)
	req.params.id = parentComment.post_id;
	req.body.parentId = commentId;
	return createComment(req, res);
};
router.post('/:commentId/reply', authenticateToken, asyncHandler(createReply));

/**
 * @swagger
 * /api/comments/{id}/like:
 *   post:
 *     summary: Like/Unlike a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment liked/unliked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Server error
 */
router.post('/:id/like', authenticateToken, asyncHandler(likeComment));

/**
 * @swagger
 * /api/comments/reply/{id}/like:
 *   post:
 *     summary: Like/Unlike a reply
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Reply ID
 *     responses:
 *       200:
 *         description: Reply liked/unliked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reply'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Reply not found
 *       500:
 *         description: Server error
 */
router.post('/reply/:id/like', authenticateToken, asyncHandler(likeReply));

export default router;