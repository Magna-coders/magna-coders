import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import paypal from '@paypal/checkout-server-sdk';
import axios from 'axios';
import { PaymentMethod, PaymentStatus, Currency } from '../types/payments';
import { db } from '../utils/prismaClient';

// Initialize payment providers
const stripe: Stripe | null = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY || '', ({ apiVersion: '2023-10-16' } as any))
  : null as any;

const paypalClient = new paypal.core.PayPalHttpClient(
  new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID || '',
    process.env.PAYPAL_CLIENT_SECRET || ''
  )
);

interface PaymentData {
  amount: number;
  currency: Currency;
  method: PaymentMethod;
  description?: string;
  fromUserId: string;
  toUserId?: string;
  projectId?: string;
  metadata?: any;
}

interface MpesaPaymentData {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}

class PaymentService {
  constructor() {}

  // Create payment intent
  async createPaymentIntent(data: PaymentData): Promise<any> {
    const payment = await db.payments.create({
      data: {
        amount: data.amount,
        currency: data.currency,
        method: data.method,
        status: 'PENDING',
        fromUserId: data.fromUserId,
        toUserId: data.toUserId ?? null,
        projectId: data.projectId ?? null,
        description: data.description,
        metadata: data.metadata,
      }
    });

    switch (data.method) {
      case 'STRIPE':
        return await this.createStripePaymentIntent(payment, data);
      case 'PAYPAL':
        return await this.createPayPalOrder(payment, data);
      case 'MPESA':
        return await this.initiateMpesaPayment(payment, data);
      case 'BANK_TRANSFER':
        return await this.createBankTransfer(payment, data);
      case 'WALLET':
        return await this.processWalletPayment(payment, data);
      default:
        throw new Error('Unsupported payment method');
    }
  }

  // Stripe payment processing
  private async createStripePaymentIntent(payment: any, data: PaymentData): Promise<any> {
    try {
      if (!stripe) throw new Error('Stripe not configured');
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100), // Convert to cents
        currency: data.currency.toLowerCase(),
        metadata: {
          paymentId: payment.id,
          fromUserId: data.fromUserId,
          toUserId: data.toUserId ?? '',
          projectId: data.projectId ?? '',
        },
        description: data.description,
      });

      // Update payment with external ID
      await db.payments.update({
        where: { id: payment.id },
        data: {
          externalId: paymentIntent.id,
          status: 'PROCESSING'
        }
      });

      return {
        paymentId: payment.id,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error('Stripe payment intent creation failed:', error);
      throw new Error('Failed to create Stripe payment intent');
    }
  }

  // PayPal payment processing
  private async createPayPalOrder(payment: any, data: PaymentData): Promise<any> {
    try {
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: data.currency,
            value: data.amount.toString(),
          },
          description: data.description,
        }],
      });

      const order = await paypalClient.execute(request);

      // Update payment with external ID
      await db.payments.update({
        where: { id: payment.id },
        data: {
          externalId: order.result.id,
          status: 'PROCESSING'
        }
      });

      return {
        paymentId: payment.id,
        orderId: order.result.id,
    approvalUrl: order.result.links?.find((link: any) => link.rel === 'approve')?.href,
      };
    } catch (error) {
      console.error('PayPal order creation failed:', error);
      throw new Error('Failed to create PayPal order');
    }
  }

  // M-Pesa payment processing
  private async initiateMpesaPayment(payment: any, data: PaymentData): Promise<any> {
    try {
      // Get user's phone number
      const user = await db.users.findUnique({
        where: { id: data.fromUserId },
        select: { phone: true }
      });

      if (!user?.phone) {
        throw new Error('Phone number required for M-Pesa payments');
      }

      const mpesaData: MpesaPaymentData = {
        phoneNumber: user.phone,
        amount: data.amount,
        accountReference: `MAGNA-${payment.id.slice(-8)}`,
        transactionDesc: data.description || 'Magna Coders Payment',
      };

      const response = await this.callMpesaSTKPush(mpesaData);

      // Update payment with external ID
      await db.payments.update({
        where: { id: payment.id },
        data: {
          externalId: response.CheckoutRequestID,
          status: 'PROCESSING'
        }
      });

      return {
        paymentId: payment.id,
        checkoutRequestId: response.CheckoutRequestID,
        responseCode: response.ResponseCode,
        message: 'M-Pesa payment initiated. Check your phone.',
      };
    } catch (error) {
      console.error('M-Pesa payment initiation failed:', error);
      throw new Error('Failed to initiate M-Pesa payment');
    }
  }

  // M-Pesa STK Push API call
  private async callMpesaSTKPush(data: MpesaPaymentData): Promise<any> {
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: data.amount,
      PartyA: data.phoneNumber,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: data.phoneNumber,
      CallBackURL: `${process.env.BASE_URL}/api/payments/mpesa/callback`,
      AccountReference: data.accountReference,
      TransactionDesc: data.transactionDesc,
    };

    const response = await axios.post(
      // useSandbox URL for testing; replace with production URL as needed during amendments
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      payload,
      {
        headers: {
          Authorization: `Bearer ${await this.getMpesaAccessToken()}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  }

  // Get M-Pesa access token
  private async getMpesaAccessToken(): Promise<string> {
    const auth = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString('base64');

    const response = await axios.get(
        // useSandbox URL for testing; replace with production URL as needed during amendments
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    return response.data.access_token;
  }

  // Bank transfer processing
  private async createBankTransfer(payment: any, data: PaymentData): Promise<any> {
    // Generate bank transfer details
    const transferDetails = {
      accountName: 'Magna Coders Ltd',
      accountNumber: '1234567890',
      bankName: 'Ex Bank',
      swiftCode: 'EXBK1234',
      reference: `MAGNA-${payment.id.slice(-8)}`,
      amount: data.amount,
      currency: data.currency,
    };

    // Update payment status
    await db.payments.update({
      where: { id: payment.id },
      data: {
        status: 'PENDING',
        metadata: { transferDetails }
      }
    });

    return {
      paymentId: payment.id,
      transferDetails,
      instructions: 'Please transfer the amount to the provided account and include the reference number.',
    };
  }

  // Wallet payment processing
  private async processWalletPayment(payment: any, data: PaymentData): Promise<any> {
    if (!data.toUserId) {
      throw new Error('Recipient user ID required for wallet payments');
    }

    // Check sender's wallet balance
    const senderWallet = await db.wallets.findUnique({
      where: { userId: data.fromUserId }
    });

    if (!senderWallet || senderWallet.balance < data.amount) {
      throw new Error('Insufficient wallet balance');
    }

    // Check recipient's wallet
    const recipientWallet = await db.wallets.findUnique({
      where: { userId: data.toUserId }
    });

    if (!recipientWallet) {
      throw new Error('Recipient wallet not found');
    }

    // Process the transfer
    await db.$transaction(async (tx: any) => {
      // Deduct from sender
      await tx.wallets.update({
        where: { userId: data.fromUserId },
        data: { balance: { decrement: data.amount } }
      });

      // Add to recipient
      await tx.wallets.update({
        where: { userId: data.toUserId },
        data: { balance: { increment: data.amount } }
      });

      // Update payment status
      await tx.payments.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
          transactionId: `WALLET-${Date.now()}-${payment.id.slice(-8)}`
        }
      });
    });

    return {
      paymentId: payment.id,
      status: 'COMPLETED',
      message: 'Wallet transfer completed successfully',
    };
  }

  // Confirm payment (webhook handlers)
  async confirmStripePayment(paymentIntentId: string, status: PaymentStatus): Promise<void> {
    const payment = await db.payments.findFirst({
      where: { externalId: paymentIntentId }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    await db.payments.update({
      where: { id: payment.id },
      data: {
        status,
        processedAt: status === 'COMPLETED' ? new Date() : undefined,
        transactionId: paymentIntentId
      }
    });

    // If payment is for a project, update project status
    if (payment.projectId && status === 'COMPLETED') {
      await this.handleProjectPayment(payment);
    }
  }

  async confirmPayPalPayment(orderId: string, status: PaymentStatus): Promise<void> {
    const payment = await db.payments.findFirst({
      where: { externalId: orderId }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    await db.payments.update({
      where: { id: payment.id },
      data: {
        status,
        processedAt: status === 'COMPLETED' ? new Date() : undefined,
        transactionId: orderId
      }
    });

    if (payment.projectId && status === 'COMPLETED') {
      await this.handleProjectPayment(payment);
    }
  }

  async confirmMpesaPayment(checkoutRequestId: string, mpesaReceiptNumber: string, status: PaymentStatus): Promise<void> {
    const payment = await db.payments.findFirst({
      where: { externalId: checkoutRequestId }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    await db.payments.update({
      where: { id: payment.id },
      data: {
        status,
        processedAt: status === 'COMPLETED' ? new Date() : undefined,
        transactionId: mpesaReceiptNumber
      }
    });

    if (payment.projectId && status === 'COMPLETED') {
      await this.handleProjectPayment(payment);
    }
  }

  // Handle project payment completion
  private async handleProjectPayment(payment: any): Promise<void> {
    if (!payment.projectId) return;

    const project = await db.projects.findUnique({
      where: { id: payment.projectId },
      include: { assignedTo: true }
    });

    if (!project) return;

    // Award tokens to developer
    if (project.assignedTo) {
      const tokenAmount = Math.floor(payment.amount / 10); // 1 token per $10
      await db.users.update({
        where: { id: project.assignedTo.id },
        data: { tokens: { increment: tokenAmount } }
      });
    }

    // Update project status if this completes the payment
    const totalPaid = await db.payments.aggregate({
      where: {
        projectId: payment.projectId,
        status: 'COMPLETED'
      },
      _sum: { amount: true }
    });

    const totalAmountPaid = totalPaid._sum.amount ?? 0;
    const projectBudget = project.budget ?? 0;

    if (totalAmountPaid >= projectBudget) {
      await db.projects.update({
        where: { id: payment.projectId },
        data: { status: 'COMPLETED' }
      });
    }
  }

  // Get payment history
  async getPaymentHistory(userId: string, page: number = 1, limit: number = 20): Promise<any> {
    const payments = await db.payments.findMany({
      where: {
        OR: [
          { fromUserId: userId },
          { toUserId: userId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        fromUser: {
          select: { id: true, username: true, avatar: true }
        },
        toUser: {
          select: { id: true, username: true, avatar: true }
        },
        project: {
          select: { id: true, title: true }
        }
      }
    });

    return payments;
  }

  // Get wallet balance
  async getWalletBalance(userId: string): Promise<any> {
    const wallet = await db.wallets.findUnique({
      where: { userId },
      select: {
        balance: true,
        currency: true,
        isActive: true,
        _count: {
          select: { transactions: true }
        }
      }
    });

    if (!wallet) {
      // Create wallet if it doesn't exist
      const newWallet = await db.wallets.create({
        data: { userId },
        select: {
          balance: true,
          currency: true,
          isActive: true,
          _count: {
            select: { transactions: true }
          }
        }
      });
      return newWallet;
    }

    return wallet;
  }

  // Process refunds
  async processRefund(paymentId: string, amount?: number, reason?: string): Promise<any> {
    const payment = await db.payments.findUnique({
      where: { id: paymentId }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'COMPLETED') {
      throw new Error('Can only refund completed payments');
    }

    const refundAmount = amount || payment.amount;

    switch (payment.method) {
      case 'STRIPE':
        return await this.processStripeRefund(payment, refundAmount, reason);
      case 'PAYPAL':
        return await this.processPayPalRefund(payment, refundAmount, reason);
      case 'WALLET':
        return await this.processWalletRefund(payment, refundAmount, reason);
      default:
        throw new Error('Refund not supported for this payment method');
    }
  }

  private async processStripeRefund(payment: any, amount: number, reason?: string): Promise<any> {
    if (!stripe) throw new Error('Stripe not configured');
    const refund = await stripe.refunds.create({
      payment_intent: payment.externalId,
      amount: Math.round(amount * 100),
      reason: reason as any || 'requested_by_customer',
    });

    await db.payments.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED',
        metadata: {
          ...payment.metadata,
          refundId: refund.id,
          refundAmount: amount,
          refundReason: reason
        }
      }
    });

    return { refundId: refund.id, status: 'REFUNDED' };
  }

  private async processPayPalRefund(payment: any, amount: number, reason?: string): Promise<any> {
    // PayPal refund logic would go here
    // This is a simplified version
    await db.payments.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED',
        metadata: {
          ...payment.metadata,
          refundAmount: amount,
          refundReason: reason
        }
      }
    });

    return { status: 'REFUNDED' };
  }

  private async processWalletRefund(payment: any, amount: number, reason?: string): Promise<any> {
    await db.$transaction(async (tx: any) => {
      // Return money to sender
      await tx.wallets.update({
        where: { userId: payment.fromUserId },
        data: { balance: { increment: amount } }
      });

      // Deduct from recipient
      if (payment.toUserId) {
        await tx.wallets.update({
          where: { userId: payment.toUserId },
          data: { balance: { decrement: amount } }
        });
      }

      await tx.payments.update({
        where: { id: payment.id },
        data: {
          status: 'REFUNDED',
          metadata: {
            ...payment.metadata,
            refundAmount: amount,
            refundReason: reason
          }
        }
      });
    });

    return { status: 'REFUNDED' };
  }
}

export default PaymentService;