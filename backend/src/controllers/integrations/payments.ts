import { Request, Response } from 'express';
import PaymentService from '../../services/paymentService';
import { PaymentMethod, PaymentStatus, Currency } from '../../types/payments';
import { asyncHandler } from '../../middleware/errorHandler';

const paymentService = new PaymentService();

// Create payment intent
const createPaymentIntent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user as string;
  const {
    amount,
    currency,
    method,
    description,
    toUserId,
    projectId
  } = req.body;

  if (!amount || !currency || !method) {
    res.status(400).json({
      success: false,
      message: 'Amount, currency, and payment method are required'
    });
    return;
  }

  const paymentData = {
    amount: parseFloat(amount),
    currency: currency.toUpperCase(),
    method: method.toUpperCase(),
    description,
    fromUserId: userId,
    toUserId,
    projectId,
  };

  const result = await paymentService.createPaymentIntent(paymentData);

  res.status(201).json({
    success: true,
    message: 'Payment intent created successfully',
    data: result
  });
  return;
});

// Get payment history
const getPaymentHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const payments = await paymentService.getPaymentHistory(userId, page, limit);

  res.status(200).json({
    success: true,
    data: payments
  });
  return;
});

// Get wallet balance
const getWalletBalance = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user as string;

  const wallet = await paymentService.getWalletBalance(userId);

  res.status(200).json({
    success: true,
    data: wallet
  });
  return;
});

// Process refund
const processRefund = asyncHandler(async (req: Request, res: Response) => {
  const { paymentId, amount, reason } = req.body;

  if (!paymentId) {
    res.status(400).json({
      success: false,
      message: 'Payment ID is required'
    });
    return;
  }

  const refund = await paymentService.processRefund(paymentId, amount, reason);

  res.status(200).json({
    success: true,
    message: 'Refund processed successfully',
    data: refund
  });
  return;
});

// Wallet transfer
const walletTransfer = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user as string;
  const { toUserId, amount, description } = req.body;

  if (!toUserId || !amount) {
    res.status(400).json({
      success: false,
      message: 'Recipient user ID and amount are required'
    });
    return;
  }

  const paymentData = {
    amount: parseFloat(amount),
    currency: Currency.USD,
    method: PaymentMethod.WALLET,
    description: description || 'Wallet transfer',
    fromUserId: userId,
    toUserId,
  };

  const result = await paymentService.createPaymentIntent(paymentData);

  res.status(200).json({
    success: true,
    message: 'Wallet transfer completed successfully',
    data: result
  });
  return;
});

// Get payment methods
const getPaymentMethods = asyncHandler(async (req: Request, res: Response) => {
  const methods = [
    {
      id: PaymentMethod.STRIPE,
      name: 'Credit/Debit Card',
      description: 'Pay with Visa, Mastercard, or other cards',
      enabled: !!process.env.STRIPE_SECRET_KEY,
      currencies: [Currency.USD, Currency.EUR, Currency.GBP]
    },
    {
      id: PaymentMethod.PAYPAL,
      name: 'PayPal',
      description: 'Pay with your PayPal account',
      enabled: !!process.env.PAYPAL_CLIENT_ID,
      currencies: [Currency.USD, Currency.EUR, Currency.GBP]
    },
    {
      id: PaymentMethod.MPESA,
      name: 'M-Pesa',
      description: 'Mobile money payment (Kenya)',
      enabled: !!process.env.MPESA_CONSUMER_KEY,
      currencies: [Currency.KES]
    },
    {
      id: PaymentMethod.BANK_TRANSFER,
      name: 'Bank Transfer',
      description: 'Direct bank transfer',
      enabled: true,
      currencies: [Currency.USD, Currency.EUR, Currency.GBP, Currency.KES]
    },
    {
      id: PaymentMethod.WALLET,
      name: 'Platform Wallet',
      description: 'Instant transfer using platform wallet',
      enabled: true,
      currencies: [Currency.USD]
    }
  ];

  res.status(200).json({
    success: true,
    data: methods.filter(method => method.enabled)
  });
  return;
});

// Get payment statistics
const getPaymentStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user as string;

  // This would typically aggregate payment data
  // For now, return basic wallet info
  const wallet = await paymentService.getWalletBalance(userId);

  res.status(200).json({
    success: true,
    data: {
      walletBalance: wallet.balance,
      currency: wallet.currency,
      totalTransactions: wallet._count.transactions,
    }
  });
  return;
});

export {
  createPaymentIntent,
  getPaymentHistory,
  getWalletBalance,
  processRefund,
  walletTransfer,
  getPaymentMethods,
  getPaymentStats,
};