import express, { Router } from 'express';
import { toggleBookmark, getBookmarkState } from '../controllers/bookmarks';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();

/**
 * @swagger
 * /api/bookmarks/{id}/bookmark:
 *   post:
 *     summary: Toggle bookmark for an opportunity
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Opportunity ID
 *     responses:
 *       200:
 *         description: Bookmark state toggled
 */
router.post('/:id/bookmark', authenticateToken, asyncHandler(toggleBookmark));

/**
 * @swagger
 * /api/bookmarks/{id}/bookmark:
 *   get:
 *     summary: Get bookmark state for an opportunity for current user
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Opportunity ID
 *     responses:
 *       200:
 *         description: Bookmark state
 */
router.get('/:id/bookmark', authenticateToken, asyncHandler(getBookmarkState));

export default router;
