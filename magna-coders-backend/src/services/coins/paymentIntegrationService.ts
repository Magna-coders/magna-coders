import { PrismaClient } from '@prisma/client';
import { PackageService } from './packageService';
import { PaymentMethod } from '../../types/coins';

const prisma = new PrismaClient();

interface PaymentInitiationResult {
  success: boolean;
  order_id: string;
  payment_url?: string;
  reference?: string;
  message?: string;
}

export class CoinPaymentService {
  static async initiatePayment(
    user_id: string,
    package_id: string,
    payment_method: PaymentMethod,
    phone_number?: string
  ): Promise<PaymentInitiationResult> {
    const order = await PackageService.createOrder({
      user_id,
      package_id,
      payment_method,
    });

    const pkg = await PackageService.getPackageById(package_id);
    if (!pkg) {
      return { success: false, order_id: order.id, message: 'Package not found' };
    }

    switch (payment_method) {
      case 'MPESA':
        return this.initiateMpesaPayment(order.id, pkg.price_kes, phone_number);
      case 'STRIPE':
        return this.initiateStripePayment(order.id, pkg.price_kes);
      case 'PAYPAL':
        return this.initiatePaypalPayment(order.id, pkg.price_kes);
      case 'BANK':
        return this.initiateBankPayment(order.id, pkg.price_kes);
      default:
        return { success: false, order_id: order.id, message: 'Unsupported payment method' };
    }
  }

  private static async initiateMpesaPayment(
    order_id: string,
    amount: number,
    phone_number?: string
  ): Promise<PaymentInitiationResult> {
    if (!phone_number) {
      return { success: false, order_id, message: 'Phone number required for M-Pesa' };
    }

    // TODO: Integrate with actual M-Pesa STK Push
    // This is a placeholder - connect to src/services/payment/mpesa.ts
    const reference = `MC${Date.now()}`;

    await prisma.coin_orders.update({
      where: { id: order_id },
      data: { payment_ref: reference },
    });

    return {
      success: true,
      order_id,
      reference,
      message: 'M-Pesa STK Push initiated. Check your phone for payment prompt.',
    };
  }

  private static async initiateStripePayment(
    order_id: string,
    _amount: number
  ): Promise<PaymentInitiationResult> {
    // TODO: Integrate with actual Stripe checkout
    // This is a placeholder - connect to src/services/payment/stripe.ts
    const reference = `STR${Date.now()}`;

    await prisma.coin_orders.update({
      where: { id: order_id },
      data: { payment_ref: reference },
    });

    return {
      success: true,
      order_id,
      reference,
      payment_url: `https://checkout.stripe.com/pay/${reference}`,
      message: 'Stripe checkout session created.',
    };
  }

  private static async initiatePaypalPayment(
    order_id: string,
    _amount: number
  ): Promise<PaymentInitiationResult> {
    // TODO: Integrate with actual PayPal checkout
    // This is a placeholder - connect to src/services/payment/paypal.ts
    const reference = `PP${Date.now()}`;

    await prisma.coin_orders.update({
      where: { id: order_id },
      data: { payment_ref: reference },
    });

    return {
      success: true,
      order_id,
      reference,
      payment_url: `https://www.paypal.com/checkoutnow?token=${reference}`,
      message: 'PayPal checkout session created.',
    };
  }

  private static async initiateBankPayment(
    order_id: string,
    _amount: number
  ): Promise<PaymentInitiationResult> {
    const reference = `BNK${Date.now()}`;

    await prisma.coin_orders.update({
      where: { id: order_id },
      data: { payment_ref: reference },
    });

    return {
      success: true,
      order_id,
      reference,
      message: 'Bank transfer details will be sent to your email.',
    };
  }

  static async handlePaymentWebhook(
    provider: PaymentMethod,
    payload: Record<string, unknown>
  ): Promise<{ success: boolean; order_id?: string }> {
    switch (provider) {
      case 'MPESA':
        return this.handleMpesaCallback(payload);
      case 'STRIPE':
        return this.handleStripeCallback(payload);
      case 'PAYPAL':
        return this.handlePaypalCallback(payload);
      default:
        return { success: false };
    }
  }

  private static async handleMpesaCallback(
    payload: Record<string, unknown>
  ): Promise<{ success: boolean; order_id?: string }> {
    // TODO: Parse M-Pesa callback payload
    // Extract order_id from AccountReference or similar field
    const reference = payload.BillRefNumber as string;
    const resultCode = payload.ResultCode as number;

    if (!reference) return { success: false };

    const order = await prisma.coin_orders.findFirst({
      where: { payment_ref: reference },
    });

    if (!order) return { success: false };

    const success = resultCode === 0;
    await PackageService.processPaymentCallback(order.id, reference, success);

    return { success, order_id: order.id };
  }

  private static async handleStripeCallback(
    payload: Record<string, unknown>
  ): Promise<{ success: boolean; order_id?: string }> {
    // TODO: Parse Stripe webhook payload
    const paymentIntent = payload.data as Record<string, unknown>;
    const reference = paymentIntent?.id as string;
    const status = paymentIntent?.status as string;

    if (!reference) return { success: false };

    const order = await prisma.coin_orders.findFirst({
      where: { payment_ref: reference },
    });

    if (!order) return { success: false };

    const success = status === 'succeeded';
    await PackageService.processPaymentCallback(order.id, reference, success);

    return { success, order_id: order.id };
  }

  private static async handlePaypalCallback(
    payload: Record<string, unknown>
  ): Promise<{ success: boolean; order_id?: string }> {
    // TODO: Parse PayPal webhook payload
    const reference = payload.id as string;
    const status = payload.status as string;

    if (!reference) return { success: false };

    const order = await prisma.coin_orders.findFirst({
      where: { payment_ref: reference },
    });

    if (!order) return { success: false };

    const success = status === 'COMPLETED';
    await PackageService.processPaymentCallback(order.id, reference, success);

    return { success, order_id: order.id };
  }
}