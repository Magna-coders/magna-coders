
import express, { Router } from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  getProjectMembers,
  getProjectTasks,
  getProjectFiles,
  getProjectActivity,
  createProjectTask,
  updateProjectTask,
  deleteProjectTask,
  uploadProjectFile,
  deleteProjectFile,
  getUserProjects,
} from '../controllers/projects';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();

// Project Tasks/Issues
router.get('/:projectId/tasks', authenticateToken, asyncHandler(getProjectTasks));
router.post('/:projectId/tasks', authenticateToken, asyncHandler(createProjectTask));
router.put('/:projectId/tasks/:taskId', authenticateToken, asyncHandler(updateProjectTask));
router.delete('/:projectId/tasks/:taskId', authenticateToken, asyncHandler(deleteProjectTask));

// Project Files/Assets
router.get('/:projectId/files', authenticateToken, asyncHandler(getProjectFiles));
router.post('/:projectId/files', authenticateToken, asyncHandler(uploadProjectFile));
router.delete('/:projectId/files/:fileId', authenticateToken, asyncHandler(deleteProjectFile));

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - budget
 *         - ownerId
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the project
 *         title:
 *           type: string
 *           description: Project title
 *         description:
 *           type: string
 *           description: Detailed project description
 *         budget:
 *           type: number
 *           description: Project budget
 *         status:
 *           type: string
 *           enum: [OPEN, IN_PROGRESS, COMPLETED, CANCELLED]
 *           description: Current status of the project
 *         ownerId:
 *           type: string
 *           description: ID of the user who created the project
 *         assignedTo:
 *           type: string
 *           description: ID of the user assigned to the project
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Bid:
 *       type: object
 *       required:
 *         - amount
 *         - projectId
 *         - bidderId
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the bid
 *         amount:
 *           type: number
 *           description: Bid amount
 *         projectId:
 *           type: string
 *           description: ID of the project
 *         bidderId:
 *           type: string
 *           description: ID of the user placing the bid
 *         status:
 *           type: string
 *           enum: [PENDING, ACCEPTED, REJECTED]
 *           description: Current status of the bid
 *         createdAt:
 *           type: string
 *           format: date-time
 */


/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, IN_PROGRESS, COMPLETED, CANCELLED]
 *         description: Filter projects by status
 *     responses:
 *       200:
 *         description: List of projects retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projects:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/', asyncHandler(getProjects));

/**
 * @swagger
 * /api/projects/user/{userId}:
 *   get:
 *     summary: Get user's projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: false
 *         description: User ID (optional, defaults to current user)
 *     responses:
 *       200:
 *         description: User projects retrieved successfully
 */
router.get('/user/:userId?', authenticateToken, asyncHandler(getUserProjects));

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get a project by ID
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.get('/:id', asyncHandler(getProjectById));

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
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
 *               - budget
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               budget:
 *                 type: number
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', authenticateToken, asyncHandler(createProject));

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               budget:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [OPEN, IN_PROGRESS, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authenticateToken, asyncHandler(updateProject));

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticateToken, asyncHandler(deleteProject));

/**
 * @swagger
 * /api/projects/{id}/bid:
 *   post:
 *     summary: Place a bid on a project
 *     tags: [Projects, Bids]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Bid amount
 *               message:
 *                 type: string
 *                 description: Optional message with the bid
 *     responses:
 *       201:
 *         description: Bid placed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bid'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
// router.post('/:id/bid', authenticateToken, asyncHandler(placeBid));

/**
 * @swagger
 * /api/projects/{projectId}/bid/{bidId}/accept:
 *   post:
 *     summary: Accept a bid on a project
 *     tags: [Projects, Bids]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         schema:
 *           type: string
 *         required: true
 *         description: Project ID
 *       - in: path
 *         name: bidId
 *         schema:
 *           type: string
 *         required: true
 *         description: Bid ID to accept
 *     responses:
 *       200:
 *         description: Bid accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *                 bid:
 *                   $ref: '#/components/schemas/Bid'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project or bid not found
 *       500:
 *         description: Server error
 */
// router.post('/:projectId/bid/:bidId/accept', authenticateToken, asyncHandler(acceptBid));


// --- Project Members ---
router.post('/:projectId/members', authenticateToken, asyncHandler(addProjectMember));
router.delete('/:projectId/members/:userId', authenticateToken, asyncHandler(removeProjectMember));

// Project Members
router.get('/:projectId/members', authenticateToken, asyncHandler(getProjectMembers));

// Project Activity/History
router.get('/:projectId/activity', authenticateToken, asyncHandler(getProjectActivity));

export default router;