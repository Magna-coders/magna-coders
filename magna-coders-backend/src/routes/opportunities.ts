import express, { Router } from 'express';
import { getOpportunities, getOpportunityById } from '../controllers/opportunities';
import { asyncHandler } from '../middleware/errorHandler';

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

export default router;
