import Razorpay from 'razorpay';

interface PaymentData {
  amount: number;
  description?: string;
  fromUserId: string;
  toUserId?: string;
  projectId?: string;
}

interface RazorpayOrderRequest {
  amount: number;
  currency: string;
  receipt?: string;
  payment_capture?: boolean;
  notes?: Record<string, string>;
}

interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  offer_id: string | null;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

interface RazorpayError {
  code: string;
  description: string;
  source: string;
  step: string;
  reason: string;
  metadata: Record<string, any>;
}

interface ClientError {
  message: string;
  statusCode: number;
  details?: any;
}

const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    })
  : null;

const logger = {
  info: (message: string, data?: any) => {
    console.log(`[RAZORPAY INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[RAZORPAY ERROR] ${message}`, error ? JSON.stringify(error, null, 2) : '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[RAZORPAY WARN] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

export const createRazorpayPaymentIntent = async (data: PaymentData): Promise<RazorpayOrderResponse> => {
  try {
    if (!razorpay) {
      const error: ClientError = {
        message: 'Razorpay not configured. Missing API keys.',
        statusCode: 500
      };
      logger.error('Razorpay configuration error', error);
      throw error;
    }

    if (!data.amount || data.amount <= 0) {
      const error: ClientError = {
        message: 'Invalid payment amount. Amount must be greater than 0.',
        statusCode: 400,
        details: { amount: data.amount }
      };
      logger.error('Invalid payment amount', error);
      throw error;
    }

    const orderRequest: RazorpayOrderRequest = {
      amount: Math.round(data.amount * 100), // Convert to paisa
      currency: 'INR',
      receipt: `rcpt_${data.fromUserId}_${Date.now()}`,
      payment_capture: true,
      notes: {
        fromUserId: data.fromUserId,
        toUserId: data.toUserId || '',
        projectId: data.projectId || '',
        description: data.description || ''
      }
    };

    logger.info('Creating Razorpay order', {
      amount: data.amount,
      currency: orderRequest.currency,
      fromUserId: data.fromUserId
    });

    const order = await razorpay.orders.create(orderRequest);

    logger.info('Razorpay order created successfully', {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status
    });

    return order as RazorpayOrderResponse;

  } catch (error: any) {
    if (error.code) {
      const razorpayError: RazorpayError = {
        code: error.code,
        description: error.description,
        source: error.source,
        step: error.step,
        reason: error.reason,
        metadata: error.metadata
      };

      logger.error('Razorpay SDK error', razorpayError);

      const clientError: ClientError = {
        message: `Payment creation failed: ${error.description}`,
        statusCode: 400,
        details: razorpayError
      };
      throw clientError;
    }

    logger.error('Unexpected error in createRazorpayPaymentIntent', error);

    const clientError: ClientError = {
      message: 'An unexpected error occurred while creating payment',
      statusCode: 500,
      details: error.message
    };
    throw clientError;
  }

  // we will do the razor pay intergration today night with all other payment intergration
  //mpesa
  //paypall
  //bank account
  //wallet payment
  // i will insert the cryptograthy index by today night insertino method
  // then sasa tutaintergrate na frontend fully 
};