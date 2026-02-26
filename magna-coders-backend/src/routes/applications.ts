import express, { Router } from 'express';
import { createApplication, getApplicationsForOpportunity, getUserApplications } from '../controllers/applications';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();

/**
 * @swagger
 * /api/applications/{id}/apply:
 *   post:
 *     summary: Apply to an opportunity
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Opportunity ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resumeUrl:
 *                 type: string
 *               coverLetter:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Application submitted
 *       400:
 *         description: Bad request
 */

router.post('/:id/apply', authenticateToken, asyncHandler(createApplication));

/**
 * @swagger
 * /api/applications/me:
 *   get:
 *     summary: Get current user's applications
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of applications
 */
router.get('/me', authenticateToken, asyncHandler(getUserApplications));

/**
 * @swagger
 * /api/applications/{id}/applications:
 *   get:
 *     summary: Get applications for an opportunity
 *     tags: [Applications]
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
 *         description: Applications list
 */
router.get('/:id/applications', authenticateToken, asyncHandler(getApplicationsForOpportunity));

export default router;
