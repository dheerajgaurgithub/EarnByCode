import express from 'express';
import nodemailer from 'nodemailer';
import { body, validationResult } from 'express-validator';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SMTP Configuration
const SMTP_CONFIG = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'coder9265@gmail.com',
    pass: 'wytkgrkixzsmpmga'
  },
  logger: true,
  debug: true
};

// Create logs directory if it doesn't exist
const LOGS_DIR = path.join(__dirname, '../../logs');
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Configure transporter
const transporter = nodemailer.createTransport(SMTP_CONFIG);

// Helper function to log email attempts
const logEmail = (type, data) => {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      ...data
    };
    
    const logFile = path.join(LOGS_DIR, 'email-logs.json');
    const logData = fs.existsSync(logFile) 
      ? JSON.parse(fs.readFileSync(logFile, 'utf8')) 
      : [];
    
    logData.push(logEntry);
    fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));
    return logEntry;
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
};

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error);
    logEmail('config_error', { error: error.message });
  } else {
    console.log('✅ Email server is ready to send messages');
    logEmail('config_success', { message: 'SMTP connection verified' });
  }
});

// ------------------- Contact form submission endpoint -------------------
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('message').trim().notEmpty().withMessage('Message is required')
  ],
  async (req, res) => {
    const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const logContext = { requestId, ip: req.ip };
    
    console.log(`[${new Date().toISOString()}] New contact form submission`, logContext);
    console.log('Contact form submission received:', req.body);

    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, subject, message } = req.body;
    
    // Log the incoming request
    logEmail('contact_request', {
      ...logContext,
      name,
      email,
      subject: subject.substring(0, 100)
    });

    const mailOptions = {
      from: `"${name}" <${SMTP_CONFIG.auth.user}>`,
      replyTo: email,
      to: 'coder9265@gmail.com',
      subject: `[Contact Form] ${subject}`,
      text: `
You have a new contact form submission:

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
This email was sent from the contact form on your website.
      `,
      html: `
<div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
  <h2>New Contact Form Submission</h2>
  <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
    <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
    <p><strong>Subject:</strong> ${subject}</p>
  </div>
  <div style="background: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 20px;">
    <h3 style="margin-top: 0;">Message:</h3>
    <p>${message.replace(/\n/g, '<br>')}</p>
  </div>
  <div style="font-size: 12px; color: #777; text-align: center; padding-top: 15px; border-top: 1px solid #eee;">
    <p>This email was sent from the contact form on your website.</p>
    <p>${new Date().toLocaleString()}</p>
  </div>
</div>
      `
    };

    try {
      console.log(`[${new Date().toISOString()}] Sending email...`, logContext);
      
      const info = await transporter.sendMail(mailOptions);
      
      logEmail('email_sent', {
        ...logContext,
        messageId: info.messageId,
        response: info.response
      });

      console.log(`[${new Date().toISOString()}] Email sent successfully`, {
        ...logContext,
        messageId: info.messageId
      });

      res.status(200).json({
        success: true,
        message: 'Your message has been sent successfully!',
        messageId: info.messageId,
        requestId
      });
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Email sending failed`, {
        ...logContext,
        error: error.message,
        code: error.code,
        stack: error.stack
      });

      // Log the error
      logEmail('email_error', {
        ...logContext,
        error: error.message,
        code: error.code,
        command: error.command,
        response: error.response
      });

      // Determine error type and status code
      let errorMessage = 'Failed to send message. Please try again later.';
      let statusCode = 500;

      switch (error.code) {
        case 'EAUTH':
          errorMessage = 'Authentication failed. Please check your email configuration.';
          statusCode = 403;
          break;
        case 'EENVELOPE':
          errorMessage = 'Invalid email address. Please check the email and try again.';
          statusCode = 400;
          break;
        case 'ECONNECTION':
          errorMessage = 'Could not connect to the email server. Please check your internet connection.';
          statusCode = 503;
          break;
      }

      res.status(statusCode).json({
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        code: error.code,
        requestId
      });
    }
  }
);

export default router;
