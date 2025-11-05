import { Request, Response } from 'express';
import crypto from 'crypto';
import PaymentService from '../../services/paymentService';

import { PaymentStatus } from '../../types/payments';
const paymentService = new PaymentService();

// M-Pesa webhook handler
const handleMpesaWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const callbackData = req.body;

    console.log('M-Pesa callback received:', JSON.stringify(callbackData, null, 2));

    // Validate callback data
    if (!callbackData.Body?.stkCallback) {
      console.error('Invalid M-Pesa callback format');
      res.status(400).json({ error: 'Invalid callback format' });
      return;
    }

    const stkCallback = callbackData.Body.stkCallback;
    const resultCode = stkCallback.ResultCode;
    const checkoutRequestId = stkCallback.CheckoutRequestID;

    if (resultCode === 0) {
      // Payment successful
      const callbackMetadata = stkCallback.CallbackMetadata?.Item || [];

      // Extract transaction details
      const amount = callbackMetadata.find((item: any) => item.Name === 'Amount')?.Value;
      const mpesaReceiptNumber = callbackMetadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;
      const transactionDate = callbackMetadata.find((item: any) => item.Name === 'TransactionDate')?.Value;
      const phoneNumber = callbackMetadata.find((item: any) => item.Name === 'PhoneNumber')?.Value;

      console.log(`M-Pesa payment successful: ${mpesaReceiptNumber}, Amount: ${amount}`);

      // Confirm payment
      await paymentService.confirmMpesaPayment(checkoutRequestId, mpesaReceiptNumber, PaymentStatus.COMPLETED);

      res.status(200).json({
        ResultCode: 0,
        ResultDesc: 'Success'
      });
      return;

    } else {
      // Payment failed
      const resultDesc = stkCallback.ResultDesc || 'Payment failed';
      console.log(`M-Pesa payment failed: ${checkoutRequestId}, Result: ${resultCode}, ${resultDesc}`);

      await paymentService.confirmMpesaPayment(checkoutRequestId, '', PaymentStatus.FAILED);

      res.status(200).json({
        ResultCode: resultCode,
        ResultDesc: resultDesc
      });
      return;
    }

  } catch (error) {
    console.error('Error processing M-Pesa webhook:', error);
    res.status(500).json({
      ResultCode: 1,
      ResultDesc: 'Internal server error'
    });
    return;
  }
};

// M-Pesa validation endpoint (called before payment)
const validateMpesaPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const validationData = req.body;

    console.log('M-Pesa validation request:', validationData);

    // Always approve for now (implement business logic as needed)
    res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Accepted'
    });
    return;

  } catch (error) {
    console.error('M-Pesa validation error:', error);
    res.status(500).json({
      ResultCode: 1,
      ResultDesc: 'Validation failed'
    });
    return;
  }
};

// Confirm M-Pesa payment (alternative to webhook)
const confirmMpesaPayment = async (req: Request, res: Response):Promise<void> => {
  const { checkoutRequestId, mpesaReceiptNumber } = req.body;

  if (!checkoutRequestId || !mpesaReceiptNumber) {
    res.status(400).json({
      success: false,
      message: 'Checkout request ID and M-Pesa receipt number are required'
    });
    return;
  }

  try {
    await paymentService.confirmMpesaPayment(checkoutRequestId, mpesaReceiptNumber, PaymentStatus.COMPLETED);

    res.status(200).json({
      success: true,
      message: 'M-Pesa payment confirmed successfully'
    });
    return;
  } catch (error) {
    console.error('M-Pesa confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm M-Pesa payment'
    });
    return;
  }
};

// Query M-Pesa payment status
const queryMpesaPaymentStatus = async (req: Request, res: Response):Promise<void> => {
  const { checkoutRequestId } = req.params;

  if (!checkoutRequestId) {
    res.status(400).json({ success: false, message: 'checkoutRequestId is required' });
    return;
  }

  try {
    // Query STK Push status from M-Pesa
    const status = await querySTKPushStatus(checkoutRequestId as string);

    res.status(200).json({
      success: true,
      data: status
    });
    return;
  } catch (error) {
    console.error('M-Pesa status query error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to query payment status'
    });
    return;
  }
};

// Helper function to query STK Push status
const querySTKPushStatus = async (checkoutRequestId: string): Promise<any> => {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString('base64');

  const payload = {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId,
  };

  // This would make an actual API call to M-Pesa
  // For now, return mock response
  return {
    ResponseCode: '0',
    ResponseDescription: 'Success',
    MerchantRequestID: 'mock-merchant-request-id',
    CheckoutRequestID: checkoutRequestId,
    ResultCode: '0',
    ResultDesc: 'Success'
  };
};

export {
  handleMpesaWebhook,
  validateMpesaPayment,
  confirmMpesaPayment,
  queryMpesaPaymentStatus,
};