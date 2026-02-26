import express, { Router } from 'express';
// Chat controllers temporarily disabled
const getUserChats = (req: any, res: any) => res.status(501).json({ message: 'Chat endpoints temporarily disabled' });
const getChatMessages = (req: any, res: any) => res.status(501).json({ message: 'Chat endpoints temporarily disabled' });
const createDirectChat = (req: any, res: any) => res.status(501).json({ message: 'Chat endpoints temporarily disabled' });
const createGroupChat = (req: any, res: any) => res.status(501).json({ message: 'Chat endpoints temporarily disabled' });
const sendMessage = (req: any, res: any) => res.status(501).json({ message: 'Chat endpoints temporarily disabled' });
const leaveChat = (req: any, res: any) => res.status(501).json({ message: 'Chat endpoints temporarily disabled' });
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';

/**
 * @swagger
 * components:
 *   schemas:
 *     Chat:
 *       type: object
 *       required:
 *         - type
 *         - participants
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the chat
 *         type:
 *           type: string
 *           enum: [DIRECT, GROUP]
 *           description: Type of chat (direct message or group chat)
 *         name:
 *           type: string
 *           description: Name of the group chat (only for group chats)
 *         participants:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs participating in the chat
 *         createdAt:
 *           type: string
 *           format: date-time
 *         lastMessage:
 *           $ref: '#/components/schemas/Message'
 *     Message:
 *       type: object
 *       required:
 *         - content
 *         - chatId
 *         - senderId
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the message
 *         content:
 *           type: string
 *           description: Message content
 *         chatId:
 *           type: string
 *           description: ID of the chat this message belongs to
 *         senderId:
 *           type: string
 *           description: ID of the user who sent the message
 *         createdAt:
 *           type: string
 *           format: date-time
 */

const router: Router = express.Router();

// All chat routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/chat:
 *   get:
 *     summary: Get all chats for the current user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [DIRECT, GROUP]
 *         description: Filter chats by type
 *     responses:
 *       200:
 *         description: List of chats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Chat'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', asyncHandler(getUserChats));

/**
 * @swagger
 * /api/chat/direct:
 *   post:
 *     summary: Create a direct chat with another user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participantId
 *             properties:
 *               participantId:
 *                 type: string
 *                 description: ID of the user to start a chat with
 *     responses:
 *       201:
 *         description: Direct chat created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chat'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/direct', asyncHandler(createDirectChat));

/**
 * @swagger
 * /api/chat/group:
 *   post:
 *     summary: Create a group chat
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - participantIds
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the group chat
 *               participantIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs to add to the group
 *     responses:
 *       201:
 *         description: Group chat created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chat'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: One or more users not found
 *       500:
 *         description: Server error
 */
router.post('/group', asyncHandler(createGroupChat));

/**
 * @swagger
 * /api/chat/{chatId}/messages:
 *   get:
 *     summary: Get messages from a chat
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         schema:
 *           type: string
 *         required: true
 *         description: Chat ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Number of messages per page
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a member of this chat
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Server error
 */
router.get('/:chatId/messages', asyncHandler(getChatMessages));

/**
 * @swagger
 * /api/chat/{chatId}/messages:
 *   post:
 *     summary: Send a message to a chat
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         schema:
 *           type: string
 *         required: true
 *         description: Chat ID
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
 *                 description: Message content
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a member of this chat
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Server error
 */
router.post('/:chatId/messages', asyncHandler(sendMessage));

/**
 * @swagger
 * /api/chat/{chatId}/leave:
 *   delete:
 *     summary: Leave a chat
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         schema:
 *           type: string
 *         required: true
 *         description: Chat ID
 *     responses:
 *       200:
 *         description: Successfully left the chat
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a member of this chat
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Server error
 */
router.delete('/:chatId/leave', asyncHandler(leaveChat));

export default router;