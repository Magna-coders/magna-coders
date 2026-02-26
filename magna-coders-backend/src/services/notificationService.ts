// here bro utafanya linking tofauti nmetry kuifix but i responded to your request
import { EmailService } from './notifications/email';
import { SMSService } from './notifications/sms';
import { WhatsAppService } from './notifications/whatsapp';

// Define the NotificationService interface
interface NotificationService {
  sendNotification(message: string): void;
}


// Create a factory function to create notification services based on the type
function createNotificationService(type: string): NotificationService {
  switch (type) {
    case 'email':
      //return new EmailService();
    case 'sms':
      //return new SMSService();
    case 'whatsapp':
      //return new WhatsAppService();
    default:
      throw new Error('Invalid notification type');
  }
}
export { createNotificationService };
// Export the individual services for direct use if needed
export { EmailService } from './notifications/email';
export { SMSService } from './notifications/sms';
export { WhatsAppService } from './notifications/whatsapp';
//export { InAppNotificationService } from './notifications/inapp';
//export { PushNotificationService } from './notifications/push';
//export { NotificationPreferencesService } from './notifications/preferences';
//export { NotificationSchedulerService } from './notifications/scheduler';


// ukitaka the other full code nmeicopy nikaiweka  note.md file