import express from 'express';
// Email sending via Gmail API
import { body, validationResult } from 'express-validator';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendEmail } from '../utils/email.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SMTP config removed (using Gmail API instead)

// Create logs directory if it doesn't exist
const LOGS_DIR = path.join(__dirname, '../../logs');
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Using Gmail API for email sending

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

// No SMTP verification (email disabled)

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

    // Send email using Gmail API
    try {
      const emailSubject = `Contact Form: ${subject}`;
      const emailText = `
New contact form submission from ${name} (${email})

Subject: ${subject}

Message:
${message}

---
This message was sent from the AlgoBucks contact form.
      `.trim();

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>New Contact Form Submission</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">New Contact Form Submission</h1>
              <p style="color: #6b7280; margin-top: 5px;">AlgoBucks Platform</p>
            </div>

            <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
              <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 15px;">Contact Details</h3>
              <p style="margin: 8px 0; color: #374151;"><strong>Name:</strong> ${name}</p>
              <p style="margin: 8px 0; color: #374151;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 8px 0; color: #374151;"><strong>Subject:</strong> ${subject}</p>
            </div>

            <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
              <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 15px;">Message</h3>
              <div style="color: #374151; line-height: 1.6; white-space: pre-wrap;">${message}</div>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; color: #6b7280; font-size: 12px;">
              <p>This message was sent from the AlgoBucks contact form.</p>
              <p>Timestamp: ${new Date().toISOString()}</p>
              <p>Request ID: ${requestId}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Send email using Gmail API
      await sendEmail({
        to: 'replyearnbycode@gmail.com', // Send to the configured email
        subject: emailSubject,
        text: emailText,
        html: emailHtml
      });

      // Log successful email sending
      logEmail('contact_email_sent', {
        ...logContext,
        name,
        email,
        subject: subject.substring(0, 100)
      });

      return res.status(200).json({
        success: true,
        message: 'Thanks for reaching out! Your message has been sent successfully.',
        requestId
      });

    } catch (emailError) {
      console.error('Failed to send contact email:', emailError);

      // Log email failure
      logEmail('contact_email_failed', {
        ...logContext,
        name,
        email,
        subject: subject.substring(0, 100),
        error: emailError.message
      });

      // Still respond successfully but mention email issue
      return res.status(200).json({
        success: true,
        message: 'Thanks for reaching out! Your message was received. (Note: Email delivery may be delayed.)',
        requestId
      });
    }
  }
);

export default router;
