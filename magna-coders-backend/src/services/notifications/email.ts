import nodemailer from 'nodemailer';

// Email configuration
const emailTransporter = nodemailer.createTransporter({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export class EmailService {
  // Send email notification
  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      };

      await emailTransporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${to}`);
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error('Failed to send email');
    }
  }

  // Send OTP via email
  async sendEmailOTP(email: string, otp: string): Promise<void> {
    const subject = 'Your OTP Code - Magna Coders';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Your OTP Code</h2>
        <p>Hello,</p>
        <p>Your One-Time Password (OTP) for Magna Coders is:</p>
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        <br>
        <p>Best regards,<br>Magna Coders Team</p>
      </div>
    `;

    await this.sendEmail(email, subject, html);
  }

  // Send welcome email
  async sendWelcomeEmail(userEmail: string): Promise<void> {
    const welcomeHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Magna Coders! 🎉</h2>
        <p>Hi there,</p>
        <p>Welcome to the Magna Coders community! We're excited to have you join our platform where developers and clients connect.</p>

        <h3>What you can do:</h3>
        <ul>
          <li>Post your projects and find talented developers</li>
          <li>Showcase your skills and get hired</li>
          <li>Connect with like-minded professionals</li>
          <li>Earn tokens and build your reputation</li>
        </ul>

        <p>Get started by completing your profile and exploring available projects!</p>

        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard"
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          Go to Dashboard
        </a>

        <br><br>
        <p>Best regards,<br>The Magna Coders Team</p>
      </div>
    `;

    await this.sendEmail(userEmail, 'Welcome to Magna Coders!', welcomeHtml);
  }

  // Send project bid notification email
  async sendProjectBidEmail(userEmail: string, username: string, bidderName: string, projectTitle: string, bidAmount: number): Promise<void> {
    const bidHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Project Bid!</h2>
        <p>Hi ${username},</p>
        <p>Great news! <strong>${bidderName}</strong> has placed a bid on your project <strong>"${projectTitle}"</strong>.</p>

        <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <h3 style="margin-top: 0;">Bid Details:</h3>
          <p><strong>Bidder:</strong> ${bidderName}</p>
          <p><strong>Amount:</strong> $${bidAmount}</p>
        </div>

        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects"
           style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          View All Bids
        </a>

        <br><br>
        <p>Best regards,<br>Magna Coders Team</p>
      </div>
    `;

    await this.sendEmail(userEmail, 'New Project Bid - Magna Coders', bidHtml);
  }

  // Send project assignment notification email
  async sendProjectAssignmentEmail(userEmail: string, username: string, projectTitle: string, clientName: string): Promise<void> {
    const assignmentHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Project Assigned!</h2>
        <p>Hi ${username},</p>
        <p>Congratulations! You've been selected for the project <strong>"${projectTitle}"</strong> by <strong>${clientName}</strong>.</p>

        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <h3 style="margin-top: 0; color: #155724;">What's Next?</h3>
          <ul style="color: #155724;">
            <li>Contact your client to discuss project details</li>
            <li>Review project requirements and timeline</li>
            <li>Start working on the project</li>
            <li>Keep regular communication with your client</li>
          </ul>
        </div>

        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects"
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          View Project Details
        </a>

        <br><br>
        <p>Best regards,<br>Magna Coders Team</p>
      </div>
    `;

    await this.sendEmail(userEmail, 'Project Assigned - Magna Coders', assignmentHtml);
  }

  // Send security alert email
  async sendSecurityAlertEmail(userEmail: string, username: string, alertType: string, details: string): Promise<void> {
    const alertHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Security Alert ⚠️</h2>
        <p>Hi ${username},</p>
        <p>We detected a security-related activity on your account:</p>

        <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <h3 style="margin-top: 0; color: #721c24;">Alert Details:</h3>
          <p style="color: #721c24;"><strong>Type:</strong> ${alertType}</p>
          <p style="color: #721c24;"><strong>Details:</strong> ${details}</p>
        </div>

        <p>If this wasn't you, please:</p>
        <ol>
          <li>Change your password immediately</li>
          <li>Review your account activity</li>
          <li>Contact our support team</li>
        </ol>

        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings/security"
           style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          Review Security Settings
        </a>

        <br><br>
        <p>Best regards,<br>Magna Coders Security Team</p>
      </div>
    `;

    await this.sendEmail(userEmail, 'Security Alert - Magna Coders', alertHtml);
  }
}
