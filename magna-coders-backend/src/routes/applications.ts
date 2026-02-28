import express, { Router } from 'express';
import { createApplication, getApplicationsForOpportunity, getUserApplications, updateApplicationStatus, uploadResume } from '../controllers/applications';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../services/fileUpload';

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

/**
 * @swagger
 * /api/applications/{id}/status:
 *   put:
 *     summary: Update application status (job poster only)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [submitted, reviewed, accepted, rejected]
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.put('/:id/status', authenticateToken, asyncHandler(updateApplicationStatus));

/**
 * @swagger
 * /api/applications/{id}/upload-resume:
 *   post:
 *     summary: Upload resume/portfolio for an application
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Resume uploaded successfully
 */
router.post('/:id/upload-resume', authenticateToken, upload.single('file'), asyncHandler(uploadResume));

export default router;
