import axios from 'axios';
import crypto from 'crypto';

interface PaymentData {
  amount: number;
  description?: string;
  fromUserId: string;
  toUserId?: string;
  projectId?: string;
}

interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  baseUrl: string;
}

const mpesaConfig: MpesaConfig = {
  consumerKey: process.env.MPESA_CONSUMER_KEY || '',
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
  shortcode: process.env.MPESA_SHORTCODE || '',
  passkey: process.env.MPESA_PASSKEY || '',
  baseUrl: process.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke'
};

// Get M-Pesa access token
const getAccessToken = async (): Promise<string> => {
  const auth = Buffer.from(`${mpesaConfig.consumerKey}:${mpesaConfig.consumerSecret}`).toString('base64');

  try {
    const response = await axios.get(`${mpesaConfig.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });
    return response.data.access_token;
  } catch (error) {
    throw new Error('Failed to get M-Pesa access token');
  }
};

// Generate timestamp and password for STK Push
const generatePassword = (timestamp: string): string => {
  return crypto.createHash('sha256')
    .update(mpesaConfig.shortcode + mpesaConfig.passkey + timestamp)
    .digest('hex');
};

// Initiate STK Push
export const createMpesaPaymentIntent = async (data: PaymentData, phoneNumber: string): Promise<any> => {
  if (!mpesaConfig.consumerKey) {
    throw new Error('M-Pesa not configured');
  }

  const accessToken = await getAccessToken();
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
  const password = generatePassword(timestamp);

  const stkPushData = {
    BusinessShortCode: mpesaConfig.shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: data.amount,
    PartyA: phoneNumber,
    PartyB: mpesaConfig.shortcode,
    PhoneNumber: phoneNumber,
    CallBackURL: `${process.env.BASE_URL}/api/payments/mpesa/confirmation`,
    AccountReference: data.fromUserId,
    TransactionDesc: data.description || 'Payment'
  };

  try {
    const response = await axios.post(
      `${mpesaConfig.baseUrl}/mpesa/stkpush/v1/processrequest`,
      stkPushData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      paymentId: `mpesa-${response.data.CheckoutRequestID}`,
      checkoutRequestId: response.data.CheckoutRequestID,
      responseCode: response.data.ResponseCode,
      responseDescription: response.data.ResponseDescription,
      customerMessage: response.data.CustomerMessage
    };
  } catch (error: any) {
    throw new Error(`M-Pesa STK Push failed: ${error.response?.data?.errorMessage || error.message}`);
  }
};

// Verify payment status
export const verifyMpesaPaymentIntent = async (checkoutRequestId: string): Promise<any> => {
  const accessToken = await getAccessToken();
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
  const password = generatePassword(timestamp);

  const queryData = {
    BusinessShortCode: mpesaConfig.shortcode,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId
  };

  try {
    const response = await axios.post(
      `${mpesaConfig.baseUrl}/mpesa/stkpushquery/v1/query`,
      queryData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      responseCode: response.data.ResponseCode,
      responseDescription: response.data.ResponseDescription,
      merchantRequestId: response.data.MerchantRequestID,
      checkoutRequestId: response.data.CheckoutRequestID,
      resultCode: response.data.ResultCode,
      resultDesc: response.data.ResultDesc
    };
  } catch (error: any) {
    throw new Error(`M-Pesa query failed: ${error.response?.data?.errorMessage || error.message}`);
  }
};

// Handle payment confirmation callback
export const handleMpesaPaymentConfirmation = async (confirmationData: any): Promise<any> => {
  // This would be called by M-Pesa's callback URL but 
  // make sure u enable in the database as u add things on it 
  const {
    TransactionType,
    TransID,
    TransTime,
    TransAmount,
    BusinessShortCode,
    BillRefNumber,
    InvoiceNumber,
    OrgAccountBalance,
    ThirdPartyTransID,
    MSISDN,
    FirstName,
    MiddleName,
    LastName
  } = confirmationData;

  // Process the confirmation
  // Update payment status in database
  // Trigger business logic

  return {
    ResultCode: 0,
    ResultDesc: 'Confirmation received successfully'
  };
};

// Process M-Pesa payment (main processing logic)
export const processMpesaPayment = async (data: PaymentData, phoneNumber: string): Promise<any> => {
  try {
    const stkResponse = await createMpesaPaymentIntent(data, phoneNumber);
    return {
      ...stkResponse,
      status: 'INITIATED',
      message: 'M-Pesa payment initiated. Please complete the payment on your phone.'
    };
  } catch (error: any) {
    throw new Error(`M-Pesa payment processing failed: ${error.message}`);
  }
};