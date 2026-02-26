import paypal from '@paypal/checkout-server-sdk';

interface PaymentData {
  amount: number;
  description?: string;
  fromUserId: string;
  toUserId?: string;
  projectId?: string;
}

const environment = process.env.PAYPAL_ENV === 'production'
  ? new paypal.core.LiveEnvironment(
      process.env.PAYPAL_CLIENT_ID || '',
      process.env.PAYPAL_CLIENT_SECRET || ''
    )
  : new paypal.core.SandboxEnvironment(
      process.env.PAYPAL_CLIENT_ID || '',
      process.env.PAYPAL_CLIENT_SECRET || ''
    );

const client = new paypal.core.PayPalHttpClient(environment);

// Create PayPal order
export const createPaypalPaymentIntent = async (data: PaymentData): Promise<any> => {
  if (!process.env.PAYPAL_CLIENT_ID) {
    throw new Error('PayPal not configured');
  }

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'USD',
        value: data.amount.toString(),
        breakdown: {
          item_total: {
            currency_code: 'USD',
            value: data.amount.toString()
          }
        }
      },
      description: data.description,
      custom_id: data.fromUserId,
      items: [{
        name: data.description || 'Payment',
        quantity: '1',
        unit_amount: {
          currency_code: 'USD',
          value: data.amount.toString()
        },
        category: 'DIGITAL_GOODS'
      }]
    }],
    application_context: {
      return_url: `${process.env.BASE_URL}/api/payments/paypal/success`,
      cancel_url: `${process.env.BASE_URL}/api/payments/paypal/cancel`
    }
  });

  try {
    const order = await client.execute(request);
    return {
      paymentId: `paypal-${order.result.id}`,
      orderId: order.result.id,
      status: order.result.status,
      links: order.result.links
    };
  } catch (error: any) {
    throw new Error(`PayPal order creation failed: ${error.message}`);
  }
};

// Verify and capture PayPal payment
export const verifyPaypalPayment = async (orderId: string): Promise<any> => {
  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});

  try {
    const capture = await client.execute(request);
    return {
      paymentId: `paypal-${capture.result.id}`,
      orderId: capture.result.id,
      status: capture.result.status,
      amount: capture.result.purchase_units[0].amount,
      payer: capture.result.payer,
      captureId: capture.result.purchase_units[0].payments.captures[0].id
    };
  } catch (error: any) {
    throw new Error(`PayPal payment verification failed: ${error.message}`);
  }
};

// Refund PayPal payment
export const refundPaypalPayment = async (captureId: string, amount?: number, reason?: string): Promise<any> => {
  const request = new paypal.payments.CapturesRefundRequest(captureId);
  request.requestBody({
    amount: amount ? {
      value: amount.toString(),
      currency_code: 'USD'
    } : undefined,
    reason: reason || 'Customer requested refund'
  });

  try {
    const refund = await client.execute(request);
    return {
      refundId: refund.result.id,
      status: refund.result.status,
      amount: refund.result.amount,
      reason: reason
    };
  } catch (error: any) {
    throw new Error(`PayPal refund failed: ${error.message}`);
  }
};

// Get PayPal payment details
export const getPaypalPaymentDetails = async (orderId: string): Promise<any> => {
  const request = new paypal.orders.OrdersGetRequest(orderId);

  try {
    const order = await client.execute(request);
    return {
      paymentId: `paypal-${order.result.id}`,
      orderId: order.result.id,
      status: order.result.status,
      amount: order.result.purchase_units[0].amount,
      payer: order.result.payer,
      create_time: order.result.create_time,
      update_time: order.result.update_time,
      links: order.result.links
    };
  } catch (error: any) {
    throw new Error(`Failed to get PayPal payment details: ${error.message}`);
  }
};