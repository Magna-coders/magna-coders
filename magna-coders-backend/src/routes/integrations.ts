import express, { Router } from 'express';
// Integration controllers temporarily disabled
const connectGitHub = (req: any, res: any) => res.status(501).json({ message: 'Integration endpoints temporarily disabled' });
const connectLinkedIn = (req: any, res: any) => res.status(501).json({ message: 'Integration endpoints temporarily disabled' });
const connectTwitter = (req: any, res: any) => res.status(501).json({ message: 'Integration endpoints temporarily disabled' });
const connectDiscord = (req: any, res: any) => res.status(501).json({ message: 'Integration endpoints temporarily disabled' });
const getConnectedPlatforms = (req: any, res: any) => res.status(501).json({ message: 'Integration endpoints temporarily disabled' });
const disconnectPlatform = (req: any, res: any) => res.status(501).json({ message: 'Integration endpoints temporarily disabled' });
const shareToSocialPlatforms = (req: any, res: any) => res.status(501).json({ message: 'Integration endpoints temporarily disabled' });
const syncSocialData = (req: any, res: any) => res.status(501).json({ message: 'Integration endpoints temporarily disabled' });
const githubOAuthCallback = (req: any, res: any) => res.status(501).json({ message: 'Integration endpoints temporarily disabled' });
const linkedinOAuthCallback = (req: any, res: any) => res.status(501).json({ message: 'Integration endpoints temporarily disabled' });
const twitterOAuthCallback = (req: any, res: any) => res.status(501).json({ message: 'Integration endpoints temporarily disabled' });
const discordOAuthCallback = (req: any, res: any) => res.status(501).json({ message: 'Integration endpoints temporarily disabled' });
const createPaymentIntent = (req: any, res: any) => res.status(501).json({ message: 'Integration endpoints temporarily disabled' });
const getPaymentHistory = (req: any, res: any) => res.status(501).json({ message: 'Integration endpoints temporarily disabled' });
const getWalletBalance = (req: any, res: any) => res.status(501).json({ message: 'Integration endpoints temporarily disabled' });
const processRefund = (req: any, res: any) => res.status(501).json({ message: 'Integration endpoints temporarily disabled' });
const walletTransfer = (req: any, res: any) => res.status(501).json({ message: 'Integration endpoints temporarily disabled' });
const getPaymentMethods = (req: any, res: any) => res.status(501).json({ message: 'Integration endpoints temporarily disabled' });
const getPaymentStats = (req: any, res: any) => res.status(501).json({ message: 'Integration endpoints temporarily disabled' });
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';

/**
 * @swagger
 * components:
 *   schemas:
 *     SocialPlatform:
 *       type: object
 *       properties:
 *         platform:
 *           type: string
 *           enum: [github, linkedin, twitter, discord]
 *         connected:
 *           type: boolean
 *         username:
 *           type: string
 *         lastSync:
 *           type: string
 *           format: date-time
 *     PaymentIntent:
 *       type: object
 *       required:
 *         - amount
 *         - currency
 *       properties:
 *         id:
 *           type: string
 *         amount:
 *           type: number
 *         currency:
 *           type: string
 *         status:
 *           type: string
 *           enum: [requires_payment_method, requires_confirmation, succeeded]
 *     PaymentMethod:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         type:
 *           type: string
 *           enum: [card, bank_account]
 *         last4:
 *           type: string
 *         brand:
 *           type: string
 *     WalletBalance:
 *       type: object
 *       properties:
 *         available:
 *           type: number
 *         pending:
 *           type: number
 *         currency:
 *           type: string
 */

const router: Router = express.Router();

/**
 * @swagger
 * /api/integrations/social/github/connect:
 *   post:
 *     summary: Connect GitHub account
 *     tags: [Integrations, Social]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: OAuth authorization code
 *     responses:
 *       200:
 *         description: GitHub account connected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SocialPlatform'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/social/github/connect', authenticateToken, asyncHandler(connectGitHub));

/**
 * @swagger
 * /api/integrations/social/linkedin/connect:
 *   post:
 *     summary: Connect LinkedIn account
 *     tags: [Integrations, Social]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: OAuth authorization code
 *     responses:
 *       200:
 *         description: LinkedIn account connected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SocialPlatform'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/social/linkedin/connect', authenticateToken, asyncHandler(connectLinkedIn));

/**
 * @swagger
 * /api/integrations/social/twitter/connect:
 *   post:
 *     summary: Connect Twitter account
 *     tags: [Integrations, Social]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: OAuth authorization code
 *     responses:
 *       200:
 *         description: Twitter account connected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SocialPlatform'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/social/twitter/connect', authenticateToken, asyncHandler(connectTwitter));

/**
 * @swagger
 * /api/integrations/social/discord/connect:
 *   post:
 *     summary: Connect Discord account
 *     tags: [Integrations, Social]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: OAuth authorization code
 *     responses:
 *       200:
 *         description: Discord account connected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SocialPlatform'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/social/discord/connect', authenticateToken, asyncHandler(connectDiscord));

/**
 * @swagger
 * /api/integrations/social/platforms:
 *   get:
 *     summary: Get all connected social platforms
 *     tags: [Integrations, Social]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Connected platforms retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SocialPlatform'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/social/platforms', authenticateToken, asyncHandler(getConnectedPlatforms));

/**
 * @swagger
 * /api/integrations/social/platforms/{platform}:
 *   delete:
 *     summary: Disconnect a social platform
 *     tags: [Integrations, Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: platform
 *         schema:
 *           type: string
 *           enum: [github, linkedin, twitter, discord]
 *         required: true
 *         description: Platform to disconnect
 *     responses:
 *       200:
 *         description: Platform disconnected successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Platform not found
 *       500:
 *         description: Server error
 */
router.delete('/social/platforms/:platform', authenticateToken, asyncHandler(disconnectPlatform));

/**
 * @swagger
 * /api/integrations/social/share:
 *   post:
 *     summary: Share content to social platforms
 *     tags: [Integrations, Social]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - platforms
 *             properties:
 *               content:
 *                 type: string
 *               platforms:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [github, linkedin, twitter, discord]
 *     responses:
 *       200:
 *         description: Content shared successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/social/share', authenticateToken, asyncHandler(shareToSocialPlatforms));

/**
 * @swagger
 * /api/integrations/social/sync:
 *   post:
 *     summary: Sync data from connected social platforms
 *     tags: [Integrations, Social]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               platforms:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [github, linkedin, twitter, discord]
 *     responses:
 *       200:
 *         description: Data synced successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/social/sync', authenticateToken, asyncHandler(syncSocialData));

/**
 * @swagger
 * /api/integrations/social/github/callback:
 *   get:
 *     summary: GitHub OAuth callback endpoint
 *     tags: [Integrations, Social]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: OAuth authorization code
 *     responses:
 *       200:
 *         description: OAuth callback processed successfully
 *       400:
 *         description: Invalid callback parameters
 *       500:
 *         description: Server error
 */
router.get('/social/github/callback', asyncHandler(githubOAuthCallback));

/**
 * @swagger
 * /api/integrations/social/linkedin/callback:
 *   get:
 *     summary: LinkedIn OAuth callback endpoint
 *     tags: [Integrations, Social]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: OAuth authorization code
 *     responses:
 *       200:
 *         description: OAuth callback processed successfully
 *       400:
 *         description: Invalid callback parameters
 *       500:
 *         description: Server error
 */
router.get('/social/linkedin/callback', asyncHandler(linkedinOAuthCallback));

/**
 * @swagger
 * /api/integrations/social/twitter/callback:
 *   get:
 *     summary: Twitter OAuth callback endpoint
 *     tags: [Integrations, Social]
 *     parameters:
 *       - in: query
 *         name: oauth_token
 *         schema:
 *           type: string
 *         required: true
 *         description: OAuth token
 *       - in: query
 *         name: oauth_verifier
 *         schema:
 *           type: string
 *         required: true
 *         description: OAuth verifier
 *     responses:
 *       200:
 *         description: OAuth callback processed successfully
 *       400:
 *         description: Invalid callback parameters
 *       500:
 *         description: Server error
 */
router.get('/social/twitter/callback', asyncHandler(twitterOAuthCallback));

/**
 * @swagger
 * /api/integrations/social/discord/callback:
 *   get:
 *     summary: Discord OAuth callback endpoint
 *     tags: [Integrations, Social]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: OAuth authorization code
 *     responses:
 *       200:
 *         description: OAuth callback processed successfully
 *       400:
 *         description: Invalid callback parameters
 *       500:
 *         description: Server error
 */
router.get('/social/discord/callback', asyncHandler(discordOAuthCallback));

/**
 * @swagger
 * /api/integrations/payments/create:
 *   post:
 *     summary: Create a payment intent
 *     tags: [Integrations, Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - currency
 *             properties:
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *               paymentMethodId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment intent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentIntent'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/payments/create', authenticateToken, asyncHandler(createPaymentIntent));

/**
 * @swagger
 * /api/integrations/payments/history:
 *   get:
 *     summary: Get payment history
 *     tags: [Integrations, Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Payment history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PaymentIntent'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/payments/history', authenticateToken, asyncHandler(getPaymentHistory));

/**
 * @swagger
 * /api/integrations/payments/methods:
 *   get:
 *     summary: Get saved payment methods
 *     tags: [Integrations, Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment methods retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PaymentMethod'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/payments/methods', asyncHandler(getPaymentMethods));

/**
 * @swagger
 * /api/integrations/payments/stats:
 *   get:
 *     summary: Get payment statistics
 *     tags: [Integrations, Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalPayments:
 *                   type: number
 *                 totalAmount:
 *                   type: number
 *                 averageAmount:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/payments/stats', authenticateToken, asyncHandler(getPaymentStats));

/**
 * @swagger
 * /api/integrations/payments/refund:
 *   post:
 *     summary: Process a refund
 *     tags: [Integrations, Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentIntentId
 *             properties:
 *               paymentIntentId:
 *                 type: string
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentIntent'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/payments/refund', authenticateToken, asyncHandler(processRefund));

/**
 * @swagger
 * /api/integrations/payments/wallet-transfer:
 *   post:
 *     summary: Transfer funds between wallets
 *     tags: [Integrations, Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - recipientId
 *             properties:
 *               amount:
 *                 type: number
 *               recipientId:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transfer completed successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/payments/wallet-transfer', authenticateToken, asyncHandler(walletTransfer));

/**
 * @swagger
 * /api/integrations/wallet/balance:
 *   get:
 *     summary: Get wallet balance
 *     tags: [Integrations, Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WalletBalance'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/wallet/balance', authenticateToken, asyncHandler(getWalletBalance));

export default router;