import { Request, Response } from 'express';
import Stripe from 'stripe';
import PaymentService from '../../services/paymentService';

const stripe: Stripe | null = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, ({ apiVersion: '2023-10-16' } as any))
  : null;

import { PaymentStatus } from '../../types/payments';
const paymentService = new PaymentService();

// Stripe webhook handler
const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.error('Stripe webhook secret not configured');
    res.status(500).json({ error: 'Webhook configuration error' });
    return;
  }

  let event: Stripe.Event;

  try {
    if (!stripe) {
      console.error('Stripe not configured for webhooks');
      res.status(503).json({ error: 'Stripe not configured' });
      return;
    }

    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    res.status(400).json({ error: 'Webhook signature verification failed' });
    return;
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await paymentService.confirmStripePayment(paymentIntent.id, PaymentStatus.COMPLETED);
        console.log(`Payment ${paymentIntent.id} succeeded`);
        break;

      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        await paymentService.confirmStripePayment(failedPaymentIntent.id, PaymentStatus.FAILED);
        console.log(`Payment ${failedPaymentIntent.id} failed`);
        break;

      case 'payment_intent.canceled':
        const canceledPaymentIntent = event.data.object as Stripe.PaymentIntent;
        await paymentService.confirmStripePayment(canceledPaymentIntent.id, PaymentStatus.CANCELLED);
        console.log(`Payment ${canceledPaymentIntent.id} canceled`);
        break;

      case 'charge.dispute.created':
        const dispute = event.data.object as Stripe.Dispute;
        console.log(`Charge dispute created: ${dispute.id}`);
        // Handle dispute logic here
        break;

      case 'charge.refunded':
        const refund = event.data.object as Stripe.Charge;
        console.log(`Charge refunded: ${refund.id}`);
        // Handle refund confirmation
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing Stripe webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// Test webhook endpoint (remove in production)
const testStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const { paymentIntentId, status } = req.body;

  if (!paymentIntentId || !status) {
    res.status(400).json({
      success: false,
      message: 'Payment intent ID and status are required'
    });
    return;
  }

  try {
    await paymentService.confirmStripePayment(paymentIntentId, status);
    res.status(200).json({
      success: true,
      message: `Payment ${paymentIntentId} status updated to ${status}`
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Test webhook processing failed'
    });
  }
};

export {
  handleStripeWebhook,
  testStripeWebhook,
};