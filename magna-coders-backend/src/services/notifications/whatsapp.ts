import twilio from 'twilio';

// WhatsApp configuration (using Twilio)
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

export class WhatsAppService {
  // Send WhatsApp message
  async sendWhatsApp(to: string, message: string): Promise<void> {
    try {
      const whatsappTo = `whatsapp:${to}`;
      await twilioClient.messages.create({
        body: message,
        from: `whatsapp:${whatsappNumber}`,
        to: whatsappTo,
      });
      console.log(`WhatsApp message sent successfully to ${to}`);
    } catch (error) {
      console.error('WhatsApp sending failed:', error);
      throw new Error('Failed to send WhatsApp message');
    }
  }

  // Send OTP via WhatsApp
  async sendWhatsAppOTP(phone: string, otp: string): Promise<void> {
    const message = `🔐 Your Magna Coders OTP is: *${otp}*\n\nValid for 10 minutes.\n\nIf you didn't request this, please ignore.`;
    await this.sendWhatsApp(phone, message);
  }
}