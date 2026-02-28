import express, { Router } from 'express';
import { OTPService } from '../services';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * @swagger
 * components:
 *   schemas:
 *     OTPRequest:
 *       type: object
 *       required:
 *         - identifier
 *       properties:
 *         identifier:
 *           type: string
 *           description: Email or phone number to send OTP to
 *         method:
 *           type: string
 *           enum: [email, sms, whatsapp]
 *           default: email
 *           description: Method to deliver OTP
 *     OTPVerification:
 *       type: object
 *       required:
 *         - identifier
 *         - otp
 *       properties:
 *         identifier:
 *           type: string
 *           description: Email or phone number used in OTP request
 *         otp:
 *           type: string
 *           description: OTP code to verify
 *     OTPResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         deliveryMethod:
 *           type: string
 *           enum: [email, sms, whatsapp]
 */

const router: Router = express.Router();
const otpService = new OTPService();

/**
 * @swagger
 * /api/otp/request:
 *   post:
 *     summary: Request a new OTP
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OTPRequest'
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OTPResponse'
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error
 */
router.post('/request', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { identifier, method } = req.body;

  if (!identifier) {
    return res.status(400).json({
      success: false,
      message: 'Identifier (email or phone) is required'
    });
  }

  const deliveryMethod = method || 'email';

  if (!['email', 'sms', 'whatsapp'].includes(deliveryMethod)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid delivery method. Use: email, sms, or whatsapp'
    });
  }

  // Generate and send OTP
  const otp = otpService.generateOTP();

  const channels: ('email' | 'sms' | 'whatsapp')[] = [deliveryMethod as 'email' | 'sms' | 'whatsapp'];
  await otpService.sendMultiChannelOTP(identifier, otp, channels);

  return res.status(200).json({
    success: true,
    message: `OTP sent via ${deliveryMethod}`,
    deliveryMethod
  });
}));

/**
 * @swagger
 * /api/otp/verify:
 *   post:
 *     summary: Verify an OTP
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OTPVerification'
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OTPResponse'
 *       400:
 *         description: Invalid or expired OTP
 *       500:
 *         description: Server error
 */
router.post('/verify', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { identifier, otp } = req.body;

  if (!identifier || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Identifier and OTP are required'
    });
  }

  const isValid = await otpService.verifyOTP(identifier, otp);

  if (isValid) {
    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    });
  } else {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired OTP'
    });
  }
}));

/**
 * @swagger
 * /api/otp/status/{identifier}:
 *   get:
 *     summary: Get OTP status for an identifier (Development only)
 *     tags: [OTP]
 *     parameters:
 *       - in: path
 *         name: identifier
 *         schema:
 *           type: string
 *         required: true
 *         description: Email or phone number to check OTP status
 *     responses:
 *       200:
 *         description: OTP status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: object
 *                   properties:
 *                     exists:
 *                       type: boolean
 *                     remaining:
 *                       type: number
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       500:
 *         description: Server error
 */
router.get('/status/:identifier', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { identifier } = req.params;

  if (!identifier) {
    return res.status(400).json({
      success: false,
      message: 'Identifier is required'
    });
  }

  // Return basic stats for now
  res.status(200).json({
    success: true,
    stats: {
      total: 0,
      active: 0
    }
  });
  return;
}));



export default router;