import { Request, Response } from 'express';
import paypal from '@paypal/checkout-server-sdk';
import PaymentService from '../../services/paymentService';

const paypalClient = new paypal.core.PayPalHttpClient(
  new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID || '',
    process.env.PAYPAL_CLIENT_SECRET || ''
  )
);

import { PaymentStatus } from '../../types/payments';
const paymentService = new PaymentService();

// PayPal webhook handler
const handlePayPalWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = req.body;

    // Verify webhook signature (recommended for production)
    // const verified = await verifyPayPalWebhook(req);
    // if (!verified) {
    //   return res.status(400).json({ error: 'Invalid webhook signature' });
    // }

    console.log('PayPal webhook received:', event.event_type);

    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        {
          const captureId = event.resource && event.resource.id ? event.resource.id : undefined;
          if (captureId) {
            await paymentService.confirmPayPalPayment(captureId, PaymentStatus.COMPLETED);
            console.log(`PayPal payment ${captureId} completed`);
          } else {
            console.log('PayPal PAYMENT.CAPTURE.COMPLETED received without resource.id');
          }
        }
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        {
          const deniedId = event.resource && event.resource.id ? event.resource.id : undefined;
          if (deniedId) {
            await paymentService.confirmPayPalPayment(deniedId, PaymentStatus.FAILED);
            console.log(`PayPal payment ${deniedId} denied`);
          } else {
            console.log('PayPal PAYMENT.CAPTURE.DENIED received without resource.id');
          }
        }
        break;

      case 'PAYMENT.CAPTURE.REFUNDED':
        console.log(`PayPal payment ${event.resource.id} refunded`);
        // Handle refund logic
        break;

      case 'CHECKOUT.ORDER.APPROVED':
        console.log(`PayPal order ${event.resource.id} approved`);
        // Order approved, ready for capture
        break;

      default:
        console.log(`Unhandled PayPal event: ${event.event_type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing PayPal webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// Verify PayPal webhook signature (implement in production)
const verifyPayPalWebhook = async (req: Request): Promise<boolean> => {
  // PayPal webhook signature verification
  // This is a placeholder - implement proper verification
  return true;
};

// Test webhook endpoint (remove in production)
const testPayPalWebhook = async (req: Request, res: Response): Promise<void> => {
  const { orderId, status } = req.body;

  if (!orderId || !status) {
    res.status(400).json({
      success: false,
      message: 'Order ID and status are required'
    });
    return;
  }

  try {
    await paymentService.confirmPayPalPayment(orderId, status);
    res.status(200).json({
      success: true,
      message: `PayPal order ${orderId} status updated to ${status}`
    });
  } catch (error) {
    console.error('Test PayPal webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Test webhook processing failed'
    });
  }
};

// Capture PayPal order (after approval)
const capturePayPalOrder = async (req: Request, res: Response): Promise<void> => {
  const { orderId } = req.params;

  if (!orderId) {
    res.status(400).json({ success: false, message: 'orderId is required' });
    return;
  }

  try {
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    const capture = await paypalClient.execute(request);

    // Update payment status
    await paymentService.confirmPayPalPayment(orderId, PaymentStatus.COMPLETED);

    res.status(200).json({
      success: true,
      message: 'PayPal order captured successfully',
      data: capture.result
    });
  } catch (error) {
    console.error('PayPal order capture failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to capture PayPal order'
    });
  }
};

export {
  handlePayPalWebhook,
  testPayPalWebhook,
  capturePayPalOrder,
};