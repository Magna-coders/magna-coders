import express, { Router } from 'express';
// Webhook controllers temporarily disabled
const handleStripeWebhook = (req: any, res: any) => res.status(501).json({ message: 'Webhook endpoints temporarily disabled' });
const testStripeWebhook = (req: any, res: any) => res.status(501).json({ message: 'Webhook endpoints temporarily disabled' });
const handlePayPalWebhook = (req: any, res: any) => res.status(501).json({ message: 'Webhook endpoints temporarily disabled' });
const testPayPalWebhook = (req: any, res: any) => res.status(501).json({ message: 'Webhook endpoints temporarily disabled' });
const capturePayPalOrder = (req: any, res: any) => res.status(501).json({ message: 'Webhook endpoints temporarily disabled' });
const handleMpesaWebhook = (req: any, res: any) => res.status(501).json({ message: 'Webhook endpoints temporarily disabled' });
const validateMpesaPayment = (req: any, res: any) => res.status(501).json({ message: 'Webhook endpoints temporarily disabled' });
const confirmMpesaPayment = (req: any, res: any) => res.status(501).json({ message: 'Webhook endpoints temporarily disabled' });
const queryMpesaPaymentStatus = (req: any, res: any) => res.status(501).json({ message: 'Webhook endpoints temporarily disabled' });

/**
 * @swagger
 * components:
 *   schemas:
 *     WebhookResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         timestamp:
 *           type: string
 *           format: date-time
 *     PayPalOrder:
 *       type: object
 *       properties:
 *         orderId:
 *           type: string
 *         status:
 *           type: string
 *           enum: [CREATED, SAVED, APPROVED, VOIDED, COMPLETED, PAYER_ACTION_REQUIRED]
 *     MpesaPayment:
 *       type: object
 *       properties:
 *         checkoutRequestId:
 *           type: string
 *         resultCode:
 *           type: string
 *         resultDesc:
 *           type: string
 *         amount:
 *           type: number
 *         mpesaReceiptNumber:
 *           type: string
 *         transactionDate:
 *           type: string
 *           format: date-time
 */

const router: Router = express.Router();

/**
 * @swagger
 * /api/webhooks/stripe:
 *   post:
 *     summary: Handle Stripe webhook events
 *     tags: [Webhooks, Stripe]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook handled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WebhookResponse'
 *       400:
 *         description: Invalid webhook payload
 *       401:
 *         description: Invalid Stripe signature
 *       500:
 *         description: Server error
 */
router.post('/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

/**
 * @swagger
 * /api/webhooks/stripe/test:
 *   post:
 *     summary: Test Stripe webhook handling (Development only)
 *     tags: [Webhooks, Stripe]
 *     responses:
 *       200:
 *         description: Test webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WebhookResponse'
 *       500:
 *         description: Server error
 */
router.post('/stripe/test', testStripeWebhook); // Remove in production

/**
 * @swagger
 * /api/webhooks/paypal:
 *   post:
 *     summary: Handle PayPal webhook events
 *     tags: [Webhooks, PayPal]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook handled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WebhookResponse'
 *       400:
 *         description: Invalid webhook payload
 *       401:
 *         description: Invalid PayPal signature
 *       500:
 *         description: Server error
 */
router.post('/paypal', handlePayPalWebhook);

/**
 * @swagger
 * /api/webhooks/paypal/test:
 *   post:
 *     summary: Test PayPal webhook handling (Development only)
 *     tags: [Webhooks, PayPal]
 *     responses:
 *       200:
 *         description: Test webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WebhookResponse'
 *       500:
 *         description: Server error
 */
router.post('/paypal/test', testPayPalWebhook); // Remove in production

/**
 * @swagger
 * /api/webhooks/paypal/capture/{orderId}:
 *   post:
 *     summary: Capture a PayPal order payment
 *     tags: [Webhooks, PayPal]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         schema:
 *           type: string
 *         required: true
 *         description: PayPal order ID to capture
 *     responses:
 *       200:
 *         description: Payment captured successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PayPalOrder'
 *       400:
 *         description: Invalid order ID
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post('/paypal/capture/:orderId', capturePayPalOrder);

/**
 * @swagger
 * /api/webhooks/mpesa/callback:
 *   post:
 *     summary: Handle M-Pesa callback notifications
 *     tags: [Webhooks, M-Pesa]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Callback processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WebhookResponse'
 *       400:
 *         description: Invalid callback payload
 *       500:
 *         description: Server error
 */
router.post('/mpesa/callback', handleMpesaWebhook);

/**
 * @swagger
 * /api/webhooks/mpesa/validation:
 *   post:
 *     summary: Validate M-Pesa payment before processing
 *     tags: [Webhooks, M-Pesa]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionType
 *               - accountReference
 *               - amount
 *             properties:
 *               transactionType:
 *                 type: string
 *               accountReference:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Payment validated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WebhookResponse'
 *       400:
 *         description: Invalid payment details
 *       500:
 *         description: Server error
 */
router.post('/mpesa/validation', validateMpesaPayment);

/**
 * @swagger
 * /api/webhooks/mpesa/confirm:
 *   post:
 *     summary: Confirm M-Pesa payment after processing
 *     tags: [Webhooks, M-Pesa]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MpesaPayment'
 *     responses:
 *       200:
 *         description: Payment confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WebhookResponse'
 *       400:
 *         description: Invalid confirmation details
 *       500:
 *         description: Server error
 */
router.post('/mpesa/confirm', confirmMpesaPayment);

/**
 * @swagger
 * /api/webhooks/mpesa/status/{checkoutRequestId}:
 *   get:
 *     summary: Query M-Pesa payment status
 *     tags: [Webhooks, M-Pesa]
 *     parameters:
 *       - in: path
 *         name: checkoutRequestId
 *         schema:
 *           type: string
 *         required: true
 *         description: M-Pesa checkout request ID
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MpesaPayment'
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.get('/mpesa/status/:checkoutRequestId', queryMpesaPaymentStatus);

/**
 * @swagger
 * /api/webhooks/verify:
 *   get:
 *     summary: Verify webhook endpoints are active
 *     tags: [Webhooks]
 *     responses:
 *       200:
 *         description: Webhook endpoints are active
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 providers:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/verify', (req: express.Request, res: express.Response) => {
  res.status(200).json({
    success: true,
    message: 'Webhook endpoint is active',
    timestamp: new Date().toISOString(),
    providers: ['stripe', 'paypal', 'mpesa']
  });
});

export default router;