import {
  processWalletPayment,
  getWalletBalance,
  createStripePaymentIntent,
  createPaypalPaymentIntent,
  verifyPaypalPayment,
  refundPaypalPayment,
  getPaypalPaymentDetails,
  createRazorpayPaymentIntent,
  createMpesaPaymentIntent,
  verifyMpesaPaymentIntent,
  handleMpesaPaymentConfirmation,
  processMpesaPayment
} from './payment/index';

interface PaymentData {
  amount: number;
  description?: string;
  fromUserId: string;
  toUserId?: string;
  projectId?: string;
}

class PaymentService {
  // Wallet payment methods
  async processWalletPayment(data: PaymentData): Promise<any> {
    if (!data.toUserId) {
      throw new Error('Recipient user ID required for wallet payments');
    }
    return await processWalletPayment(data as any);
  }

  async getWalletBalance(userId: string): Promise<any> {
    return await getWalletBalance(userId);
  }

  // Stripe payment methods
  async createStripePaymentIntent(data: PaymentData): Promise<any> {
    return await createStripePaymentIntent(data);
  }

  // PayPal payment methods
  async createPaypalPaymentIntent(data: PaymentData): Promise<any> {
    return await createPaypalPaymentIntent(data);
  }

  async verifyPaypalPayment(orderId: string): Promise<any> {
    return await verifyPaypalPayment(orderId);
  }

  async refundPaypalPayment(captureId: string, amount?: number, reason?: string): Promise<any> {
    return await refundPaypalPayment(captureId, amount, reason);
  }

  async getPaypalPaymentDetails(orderId: string): Promise<any> {
    return await getPaypalPaymentDetails(orderId);
  }

  // Razorpay payment methods
  async createRazorpayPaymentIntent(data: PaymentData): Promise<any> {
    return await createRazorpayPaymentIntent(data);
  }

  // M-Pesa payment methods
  async createMpesaPaymentIntent(data: PaymentData, phoneNumber: string): Promise<any> {
    return await createMpesaPaymentIntent(data, phoneNumber);
  }

  async verifyMpesaPaymentIntent(checkoutRequestId: string): Promise<any> {
    return await verifyMpesaPaymentIntent(checkoutRequestId);
  }

  async handleMpesaPaymentConfirmation(confirmationData: any): Promise<any> {
    return await handleMpesaPaymentConfirmation(confirmationData);
  }

  async processMpesaPayment(data: PaymentData, phoneNumber: string): Promise<any> {
    return await processMpesaPayment(data, phoneNumber);
  }
}

export default PaymentService;
