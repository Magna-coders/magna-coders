import Stripe from 'stripe';

const stripe: Stripe | null = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' as any })
  : null;

interface PaymentData {
  amount: number;
  description?: string;
  fromUserId: string;
  toUserId?: string;
  projectId?: string;
}

interface StripePaymentRequest {
  amount: number;
  description?: string;
  fromUserId: string;
  toUserId?: string;
  projectId?: string;
}

interface StripePaymentResponse {
  paymentId: string;
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
}

interface StripeError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
  type?: string;
}

const logger = {
  info: (message: string, data?: any) => {
    console.log(`[STRIPE INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[STRIPE ERROR] ${message}`, error ? JSON.stringify(error, null, 2) : '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[STRIPE WARN] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

export const createStripePaymentIntent = async (data: StripePaymentRequest): Promise<StripePaymentResponse> => {
  try {
    if (!stripe) {
      const error: StripeError = {
        code: 'STRIPE_NOT_CONFIGURED',
        message: 'Stripe not configured. Missing secret key.',
        statusCode: 500
      };
      logger.error('Stripe configuration error', error);
      throw error;
    }

    if (!data.amount || data.amount <= 0) {
      const error: StripeError = {
        code: 'INVALID_AMOUNT',
        message: 'Payment amount must be greater than 0',
        statusCode: 400,
        details: { amount: data.amount }
      };
      logger.error('Invalid payment amount', error);
      throw error;
    }

    if (!data.fromUserId) {
      const error: StripeError = {
        code: 'INVALID_USER_ID',
        message: 'User ID is required',
        statusCode: 400,
        details: { fromUserId: data.fromUserId }
      };
      logger.error('Invalid user ID', error);
      throw error;
    }

    logger.info('Creating Stripe payment intent', {
      amount: data.amount,
      currency: 'usd',
      fromUserId: data.fromUserId
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(data.amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        fromUserId: data.fromUserId,
        toUserId: data.toUserId ?? '',
        projectId: data.projectId ?? '',
      },
      description: data.description,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    const response: StripePaymentResponse = {
      paymentId: `stripe-${paymentIntent.id}`,
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status
    };

    logger.info('Stripe payment intent created successfully', {
      paymentIntentId: paymentIntent.id,
      amount: data.amount,
      status: paymentIntent.status
    });

    return response;

  } catch (error: any) {
    if (error.type) {
      const stripeError: StripeError = {
        code: error.code || 'STRIPE_API_ERROR',
        message: error.message || 'Stripe API error occurred',
        statusCode: 400,
        details: error,
        type: error.type
      };
      logger.error('Stripe API error', stripeError);
      throw stripeError;
    }

    if (error.code && error.statusCode) {
      throw error;
    }
    
    logger.error('Unexpected error in createStripePaymentIntent', error);

    const unexpectedError: StripeError = {
      code: 'UNEXPECTED_ERROR',
      message: 'An unexpected error occurred while creating payment intent',
      statusCode: 500,
      details: error.message
    };
    throw unexpectedError;
  }
};