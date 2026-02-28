import express, { Router } from 'express';
import { getAllSkills, getUserSkills, addUserSkill, removeUserSkill } from '../controllers/skills';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();

/**
 * @swagger
 * /api/skills:
 *   get:
 *     summary: Get all available skills
 *     tags: [Skills]
 *     responses:
 *       200:
 *         description: List of all skills
 */
router.get('/', asyncHandler(getAllSkills));

/**
 * @swagger
 * /api/skills/me:
 *   get:
 *     summary: Get current user's skills
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's skills
 */
router.get('/me', authenticateToken, asyncHandler(getUserSkills));

/**
 * @swagger
 * /api/skills/me:
 *   post:
 *     summary: Add skill to current user
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - skillName
 *             properties:
 *               skillName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Skill added successfully
 */
router.post('/me', authenticateToken, asyncHandler(addUserSkill));

/**
 * @swagger
 * /api/skills/me/{skillId}:
 *   delete:
 *     summary: Remove skill from current user
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: skillId
 *         schema:
 *           type: string
 *         required: true
 *         description: Skill ID
 *     responses:
 *       200:
 *         description: Skill removed successfully
 */
router.delete('/me/:skillId', authenticateToken, asyncHandler(removeUserSkill));

export default router;
