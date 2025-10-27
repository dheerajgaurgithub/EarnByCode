import express from 'express';
// Email sending disabled: nodemailer removed
import { body, validationResult } from 'express-validator';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SMTP config removed

// Create logs directory if it doesn't exist
const LOGS_DIR = path.join(__dirname, '../../logs');
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Transporter removed (email disabled)

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

    // Email sending is disabled. Record submission and respond gracefully.
    logEmail('contact_received_no_email', {
      ...logContext,
      name,
      email,
      subject: subject.substring(0, 100)
    });

    return res.status(200).json({
      success: true,
      message: 'Thanks for reaching out! Your message was received. (Email sending is currently disabled.)',
      requestId
    });
  }
);

export default router;
