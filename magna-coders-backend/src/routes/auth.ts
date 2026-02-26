import express, { Router } from 'express';
import {
  register,
  login,
  getUserProfile,
  updateUserProfile,
  refreshToken,
  handleOAuthCallback,
  linkOAuthAccount,
  signOut
} from '../controllers/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

// OAuth rate limiter: 5 requests per 15 minutes per IP
const oauthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
  // Remove custom keyGenerator to use default (handles IPv6 correctly)
});

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the user
 *         email:
 *           type: string
 *           description: User email address
 *         password:
 *           type: string
 *           description: User password
 *         name:
 *           type: string
 *           description: User's full name
 *         profilePicture:
 *           type: string
 *           description: URL to user's profile picture
 *         bio:
 *           type: string
 *           description: User's biography
 *     AuthResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: JWT authentication token
 *         user:
 *           $ref: '#/components/schemas/User'
 */

const router: Router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email, phone number or username
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', asyncHandler(login));

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token using a refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', asyncHandler(refreshToken));

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - username
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               username:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid input
 *       409:
 *         description: User already exists
 *       500:
 *         description: Server error
 */
router.post('/register', asyncHandler(register));

/**
 * @swagger
 * /api/auth/profile/{id}:
 *   get:
 *     summary: Get user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/profile/:id', authenticateToken, asyncHandler(getUserProfile));

/**
 * @swagger
 * /api/auth/profile/{id}:
 *   put:
 *     summary: Update user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/profile/:id', authenticateToken, asyncHandler(updateUserProfile));

/**
 * @swagger
 * /api/auth/oauth/callback:
 *   post:
 *     summary: Handle OAuth callback from Google authentication
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *               - providerAccountId
 *               - accessToken
 *               - expiresAt
 *               - tokenType
 *               - scope
 *               - email
 *               - name
 *             properties:
 *               provider:
 *                 type: string
 *                 example: google
 *               providerAccountId:
 *                 type: string
 *               accessToken:
 *                 type: string
 *               refreshToken:
 *                 type: string
 *               expiresAt:
 *                 type: number
 *               tokenType:
 *                 type: string
 *               scope:
 *                 type: string
 *               idToken:
 *                 type: string
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               image:
 *                 type: string
 *     responses:
 *       200:
 *         description: OAuth authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     sessionToken:
 *                       type: string
 *       400:
 *         description: Invalid provider or request
 *       401:
 *         description: Token validation failed
 *       429:
 *         description: Too many authentication attempts
 *       500:
 *         description: Authentication failed
 */
router.post('/oauth/callback', oauthRateLimiter, asyncHandler(handleOAuthCallback));

/**
 * @swagger
 * /api/auth/oauth/link:
 *   post:
 *     summary: Link Google account to existing user account
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *               - providerAccountId
 *               - accessToken
 *               - expiresAt
 *               - tokenType
 *               - scope
 *               - email
 *             properties:
 *               provider:
 *                 type: string
 *                 example: google
 *               providerAccountId:
 *                 type: string
 *               accessToken:
 *                 type: string
 *               refreshToken:
 *                 type: string
 *               expiresAt:
 *                 type: number
 *               tokenType:
 *                 type: string
 *               scope:
 *                 type: string
 *               idToken:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account linked successfully
 *       400:
 *         description: Email mismatch or already linked
 *       401:
 *         description: Authentication required
 *       404:
 *         description: User not found
 *       429:
 *         description: Too many authentication attempts
 *       500:
 *         description: Failed to link account
 */
router.post('/oauth/link', authenticateToken, oauthRateLimiter, asyncHandler(linkOAuthAccount));

/**
 * @swagger
 * /api/auth/signout:
 *   post:
 *     summary: Sign out user and delete session
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionToken:
 *                 type: string
 *                 description: Specific session token to delete (optional, deletes all sessions if not provided)
 *     responses:
 *       200:
 *         description: Signed out successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Failed to sign out
 */
router.post('/signout', authenticateToken, asyncHandler(signOut));

export default router;