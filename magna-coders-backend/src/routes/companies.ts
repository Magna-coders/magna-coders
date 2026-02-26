import express, { Router } from 'express';
import { getCompanyById, getCompanyBySlug, getCompanyOpportunities } from '../controllers/companies';
import { asyncHandler } from '../middleware/errorHandler';

const router: Router = express.Router();

/**
 * @swagger
 * /api/companies/{id}:
 *   get:
 *     summary: Get company profile by id
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company object
 */
router.get('/:id', asyncHandler(getCompanyById));

/**
 * @swagger
 * /api/companies/slug/{slug}:
 *   get:
 *     summary: Get company by slug
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: slug
 *         schema:
 *           type: string
 *         required: true
 *         description: Company slug
 *     responses:
 *       200:
 *         description: Company object
 */
router.get('/slug/:slug', asyncHandler(getCompanyBySlug));

/**
 * @swagger
 * /api/companies/{id}/opportunities:
 *   get:
 *     summary: Get opportunities for a company
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Company ID
 *     responses:
 *       200:
 *         description: List of opportunities
 */
router.get('/:id/opportunities', asyncHandler(getCompanyOpportunities));

export default router;
