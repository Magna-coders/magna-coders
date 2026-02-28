import express, { Router } from 'express';
import { createFile, deleteFile } from '../controllers/files';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();

/**
 * @swagger
 * /api/files:
 *   post:
 *     summary: Register uploaded file metadata
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url, filename]
 *             properties:
 *               url:
 *                 type: string
 *               filename:
 *                 type: string
 *               mime_type:
 *                 type: string
 *               size:
 *                 type: integer
 *               purpose:
 *                 type: string
 *     responses:
 *       201:
 *         description: File metadata created
 */
router.post('/', authenticateToken, asyncHandler(createFile));

/**
 * @swagger
 * /api/files/{id}:
 *   delete:
 *     summary: Delete file metadata
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: File ID
 *     responses:
 *       200:
 *         description: File deleted
 */
router.delete('/:id', authenticateToken, asyncHandler(deleteFile));

export default router;
