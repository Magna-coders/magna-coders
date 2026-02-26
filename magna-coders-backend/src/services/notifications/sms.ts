import twilio from 'twilio';

// SMS configuration (Twilio)
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export class SMSService {
  async sendSMS(to: string, message: string): Promise<void> {
    try {
      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
      });
      console.log(`SMS sent successfully to ${to}`);
    } catch (error) {
      console.error('SMS sending failed:', error);
      throw new Error('Failed to send SMS');
    }
  }

  // Send OTP via SMS
  async sendSMSOTP(phone: string, otp: string): Promise<void> {
    const message = `Your Magna Coders OTP is: ${otp}. Valid for 10 minutes.`;
    await this.sendSMS(phone, message);
  }

  // Send welcome SMS
  async sendWelcomeSMS(phone: string): Promise<void> {
    await this.sendSMS(phone, 'Welcome to Magna Coders! 🎉 Your developer journey starts now. Visit your dashboard to get started.');
  }
}