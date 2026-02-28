import express, { Router } from 'express';
import { getOpportunities, getOpportunityById, createOpportunity, updateOpportunity, deleteOpportunity, getRecommendedOpportunities } from '../controllers/opportunities';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();

/**
 * @swagger
 * /api/opportunities:
 *   get:
 *     summary: List opportunities with filters
 *     tags: [Opportunities]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Full-text query for title
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of opportunities
 */
router.get('/', asyncHandler(getOpportunities));

/**
 * @swagger
 * /api/opportunities/recommended:
 *   get:
 *     summary: Get recommended opportunities for current user
 *     tags: [Opportunities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommended opportunities
 */
router.get('/recommended', authenticateToken, asyncHandler(getRecommendedOpportunities));

/**
 * @swagger
 * /api/opportunities:
 *   post:
 *     summary: Create a new job posting
 *     tags: [Opportunities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               company:
 *                 type: string
 *               location:
 *                 type: string
 *               salary:
 *                 type: string
 *               job_type:
 *                 type: string
 *               deadline:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Job created successfully
 */
router.post('/', authenticateToken, asyncHandler(createOpportunity));

/**
 * @swagger
 * /api/opportunities/{id}:
 *   get:
 *     summary: Get opportunity by id or slug
 *     tags: [Opportunities]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Opportunity id or slug
 *       - in: query
 *         name: slug
 *         schema:
 *           type: boolean
 *         description: Set to true to treat path as slug
 *     responses:
 *       200:
 *         description: Opportunity object
 *       404:
 *         description: Not found
 */
router.get('/:id', asyncHandler(getOpportunityById));

/**
 * @swagger
 * /api/opportunities/{id}:
 *   put:
 *     summary: Update a job posting
 *     tags: [Opportunities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job updated successfully
 */
router.put('/:id', authenticateToken, asyncHandler(updateOpportunity));

/**
 * @swagger
 * /api/opportunities/{id}:
 *   delete:
 *     summary: Delete a job posting
 *     tags: [Opportunities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job deleted successfully
 */
router.delete('/:id', authenticateToken, asyncHandler(deleteOpportunity));

export default router;
